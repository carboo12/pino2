#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RUN_DIR="/opt/apps/pino2/test-results/runs/run_${TIMESTAMP}"
mkdir -p "$RUN_DIR"

echo "=== RUN COMPLETO $(date) ==="
echo "Commit: $(cd /opt/apps/pino2 && git log --oneline -1 2>/dev/null || echo 'N/A')"
echo ""

summary_line() {
  echo "$1|$2|$3|$4" >> "${RUN_DIR}/summary.csv"
}

# 1. Unit tests
echo "--- Unit Backend ---"
cd /opt/apps/pino2/backend
set +e
npx jest "src/modules/" --config "./test/jest-e2e.json" --no-cache --forceExit 2>&1 | tee "${RUN_DIR}/unit-backend.txt"
EC=$?
set -e
PASS=$(grep -c "PASS" "${RUN_DIR}/unit-backend.txt" 2>/dev/null || echo 0)
FAIL=$(grep -c "FAIL" "${RUN_DIR}/unit-backend.txt" 2>/dev/null || echo 0)
TOTAL=$(grep -oP 'Tests:\s+\K\d+' "${RUN_DIR}/unit-backend.txt" 2>/dev/null || echo 0)
echo "Result: ${PASS} suites pass, ${FAIL} fail, ${TOTAL} tests"
summary_line "unit-backend" "$PASS" "$FAIL" "$TOTAL"

# 2. Web unit tests
echo "--- Web Unit ---"
cd /opt/apps/pino2/web
set +e
npx vitest run --reporter=verbose 2>&1 | tee "${RUN_DIR}/web-unit.txt"
EC=$?
set -e
PASS=$(grep -c "✓" "${RUN_DIR}/web-unit.txt" 2>/dev/null || echo 0)
WFAIL=$(grep -c "✕" "${RUN_DIR}/web-unit.txt" 2>/dev/null || echo 0)
echo "Result: exit=${EC}"
summary_line "web-unit" "$PASS" "$WFAIL" "$EC"

# 3-9. E2E tests
echo "--- E2E Tests ---"
cd /opt/apps/pino2/backend
for TEST in app mvp-critical tenant-isolation concurrency-real load-basic plan-f10 scenarios-runner; do
  echo -n "  ${TEST}: "
  set +e
  timeout 40 npx jest "test/active/${TEST}.e2e-spec.ts" --config "./test/jest-e2e.json" --no-cache --forceExit > "${RUN_DIR}/e2e-${TEST}.txt" 2>&1
  EC=$?
  set -e
  TPASS=$(grep -c "PASS" "${RUN_DIR}/e2e-${TEST}.txt" 2>/dev/null || echo 0)
  TFAIL=$(grep -c "FAIL" "${RUN_DIR}/e2e-${TEST}.txt" 2>/dev/null || echo 0)
  TTOTAL=$(grep -oP 'Tests:\s+\K\d+' "${RUN_DIR}/e2e-${TEST}.txt" 2>/dev/null || echo "?")
  echo "${TPASS}/${TTOTAL} pass, ${TFAIL} fail (exit=${EC})"
  summary_line "e2e-${TEST}" "$TPASS" "$TFAIL" "$TTOTAL"
done

# 10. Comprehensive
echo -n "  comprehensive: "
set +e
timeout 45 npx jest "test/active/comprehensive.e2e-spec.ts" --config "./test/jest-e2e.json" --no-cache --forceExit > "${RUN_DIR}/e2e-comprehensive.txt" 2>&1
EC=$?
set -e
CPASS=$(grep -c "PASS" "${RUN_DIR}/e2e-comprehensive.txt" 2>/dev/null || echo 0)
CFAIL=$(grep -c "FAIL" "${RUN_DIR}/e2e-comprehensive.txt" 2>/dev/null || echo 0)
CTOTAL=$(grep -oP 'Tests:\s+\K\d+' "${RUN_DIR}/e2e-comprehensive.txt" 2>/dev/null || echo "?")
echo "${CPASS}/${CTOTAL} pass, ${CFAIL} fail (exit=${EC})"
summary_line "e2e-comprehensive" "$CPASS" "$CFAIL" "$CTOTAL"

# 11. SQL integrity
echo "--- SQL Integrity ---"
docker exec postgres_alacaja psql -U postgres -d multitienda_db -c "
SELECT 'stock_negativo' as c, count(*) FROM products WHERE current_stock < 0
UNION ALL SELECT 'sale_mismatch', count(*) FROM sale_items WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity
UNION ALL SELECT 'order_mismatch', count(*) FROM order_items WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity
UNION ALL SELECT 'constraints_invalid', count(*) FROM pg_constraint WHERE convalidated = false AND connamespace = 'public'::regnamespace
UNION ALL SELECT 'outbox_pending', count(*) FROM sync_outbox WHERE published_at IS NULL;
" > "${RUN_DIR}/sql-integrity.txt" 2>&1
cat "${RUN_DIR}/sql-integrity.txt"

# 12. API health
echo "--- API Health ---"
curl -s http://127.0.0.1:3035/api/health > "${RUN_DIR}/api-health.json" 2>&1 || echo '{"status":"error"}' > "${RUN_DIR}/api-health.json"
python3 -c "import json; d=json.load(open('${RUN_DIR}/api-health.json')); print(f\"API: {d.get('status','?')} v{d.get('version','?')}\")"

# Summary
echo ""
echo "====================="
echo " RESUMEN FINAL"
echo "====================="
echo "Test | Pass | Fail | Total" | tee -a "${RUN_DIR}/SUMMARY.md"
echo "-----|------|------|------" | tee -a "${RUN_DIR}/SUMMARY.md"
TP=0; TF=0; TT=0
while IFS='|' read -r n p f t; do
  [ -z "$n" ] && continue
  echo "$n | $p | $f | $t" | tee -a "${RUN_DIR}/SUMMARY.md"
  TP=$((TP + p))
  TF=$((TF + f))
  TT=$((TT + t))
done < "${RUN_DIR}/summary.csv"
echo "" | tee -a "${RUN_DIR}/SUMMARY.md"
echo "TOTAL: ${TP} pass, ${TF} fail, ${TT} tests" | tee -a "${RUN_DIR}/SUMMARY.md"

# Generate bug report
BUGS="${RUN_DIR}/BUGS.md"
echo "# Bugs Detectados - Run ${TIMESTAMP}" > "$BUGS"
echo "" >> "$BUGS"
for f in "${RUN_DIR}"/e2e-*.txt "${RUN_DIR}"/unit-*.txt; do
  if grep -q "✕\|FAIL.*Error\|errored" "$f" 2>/dev/null; then
    echo "## $(basename "$f")" >> "$BUGS"
    grep -A3 "✕\|●\|Error\|FAIL" "$f" 2>/dev/null | head -15 >> "$BUGS"
    echo "" >> "$BUGS"
    echo "---" >> "$BUGS"
  fi
done

# Link
rm -f /opt/apps/pino2/test-results/latest
ln -sf "$RUN_DIR" /opt/apps/pino2/test-results/latest
echo ""
echo "Resultados: ${RUN_DIR}"
echo "Bugs: ${BUGS}"
