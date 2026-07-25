#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RUN_DIR="/opt/apps/pino2/test-results/runs/run_${TIMESTAMP}"
mkdir -p "$RUN_DIR"
exec > >(tee "${RUN_DIR}/output.log") 2>&1

echo "=========================================="
echo " PINO2 TEST RUNNER — $(date)"
echo " Commit: $(cd /opt/apps/pino2 && git log --oneline -1 2>/dev/null || echo '?')"
echo "=========================================="

cd /opt/apps/pino2/backend

run_test() {
  local name=$1; shift
  echo ""
  echo "--- $name ---"
  set +e
  timeout 40 npx jest "$@" --no-cache --forceExit 2>&1
  local ec=$?
  set -e
  echo "exit=$ec"
}

run_test "Unit Backend" "src/modules/"
run_test "E2E App" "test/active/app.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E MVP Critical" "test/active/mvp-critical.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E Tenant Isolation" "test/active/tenant-isolation.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E Concurrency Real" "test/active/concurrency-real.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E Load Basic" "test/active/load-basic.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E Plan F10" "test/active/plan-f10.e2e-spec.ts" --config test/jest-e2e.json
run_test "E2E Scenarios" "test/active/scenarios-runner.e2e-spec.ts" --config test/jest-e2e.json

echo ""
echo "--- Web Tests ---"
cd /opt/apps/pino2/web && npx vitest run --reporter=verbose 2>&1; cd /opt/apps/pino2/backend

echo ""
echo "--- SQL Integrity ---"
docker exec postgres_alacaja psql -U postgres -d multitienda_db -c "
SELECT 'stock_negativo' as check, count(*) FROM products WHERE current_stock < 0
UNION ALL SELECT 'sale_mismatch', count(*) FROM sale_items WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity
UNION ALL SELECT 'order_mismatch', count(*) FROM order_items WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity
UNION ALL SELECT 'constraints_invalid', count(*) FROM pg_constraint WHERE convalidated = false AND connamespace = 'public'::regnamespace
UNION ALL SELECT 'outbox_pending', count(*) FROM sync_outbox WHERE published_at IS NULL;
"

echo ""
echo "=========================================="
echo " RESULTADOS GUARDADOS EN: ${RUN_DIR}"
echo "=========================================="
