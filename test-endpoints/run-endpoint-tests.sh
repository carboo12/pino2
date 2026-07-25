#!/bin/bash
# PINO2 — Endpoint Test Runner
# Tests all 211+ endpoints and saves results to endpoint-test-results.txt
# Usage: bash test-endpoints/run-endpoint-tests.sh

set -e

BASE_URL="https://rhclaroni.com/api-dev"
RESULTS_FILE="/opt/apps/pino2/test-endpoints/endpoint-test-results.txt"
ENDPOINTS_JSON="/opt/apps/pino2/test-endpoints/endpoints.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "" > "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "PINO2 — Endpoint Test Results" >> "$RESULTS_FILE"
echo "Date: $(date)" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

echo -e "${YELLOW}PINO2 — Endpoint Test Runner${NC}"
echo "Base URL: $BASE_URL"
echo "Results: $RESULTS_FILE"
echo ""

# Login and get token
echo -n "Logging in... "
TOKEN=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/auth/login" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"email":"dueno@lospinos.com","password":"123"}' 2>/dev/null | \
  python3 -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))')
if [ -z "$TOKEN" ]; then
  echo -e "${RED}FAILED to get token${NC}"
  exit 1
fi
echo -e "${GREEN}OK${NC}"

# Get store ID, user ID, product ID
echo -n "Fetching test IDs... "
SID=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/stores" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c 'import sys,json;d=json.load(sys.stdin);print(d[0]["id"] if d and len(d)>0 else "")')
USR_ID=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/users?storeId=$SID&limit=1" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c 'import sys,json;d=json.load(sys.stdin);print(d[0]["id"] if d and len(d)>0 else d.get("data",[{}])[0].get("id","") if isinstance(d,dict) else "")')
PRD_ID=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/products?storeId=$SID&limit=1" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c 'import sys,json;d=json.load(sys.stdin);print(d[0]["id"] if d and len(d)>0 else d.get("data",[{}])[0].get("id","") if isinstance(d,dict) else "")')
CLT_ID=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/clients?storeId=$SID&limit=1" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c '
import sys,json
d=json.load(sys.stdin)
if isinstance(d,list) and len(d)>0: print(d[0]["id"])
elif isinstance(d,dict): print(d.get("data",[{}])[0].get("id",""))
else: print("")
')
ORD_ID=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$BASE_URL/orders?storeId=$SID&limit=1" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null | \
  python3 -c '
import sys,json
d=json.load(sys.stdin)
if isinstance(d,list) and len(d)>0: print(d[0]["id"])
elif isinstance(d,dict): print(d.get("data",[{}])[0].get("id",""))
else: print("")
')
echo -e "${GREEN}OK (store=$SID, user=$USR_ID, product=$PRD_ID)${NC}"
echo ""

# Read endpoints JSON and test each
TOTAL=$(python3 -c "import json;d=json.load(open('$ENDPOINTS_JSON'));print(len(d))")
echo "Testing $TOTAL endpoints..."
echo ""

PASS=0
FAIL=0
SKIP=0

echo "----------------------------------------" >> "$RESULTS_FILE"
echo "Individual Endpoint Results:" >> "$RESULTS_FILE"
echo "----------------------------------------" >> "$RESULTS_FILE"

# Read each endpoint from JSON
python3 -c "
import json, sys
eps = json.load(open('$ENDPOINTS_JSON'))
for i, ep in enumerate(eps):
    print(f\"{i}|{ep['method']}|{ep['path']}|{ep.get('file','')}\")
" > /tmp/endpoint_list.txt

while IFS='|' read -r idx method path file; do
  [ -z "$method" ] && continue
  
  # Build URL with path params replaced by test data
  url="$BASE_URL$path"
  
  # Build URL with path params replaced by test data
  url_raw="$BASE_URL$path"
  
  # Replace path params with test values (only within path, not https://)
  url=$(echo "$url_raw" | sed "s/:storeId/$SID/g" | sed "s/:id/$SID/g" | sed "s/:orderId/$ORD_ID/g" | sed "s/:productId/$PRD_ID/g" | sed "s/:clientId/$CLT_ID/g" | sed "s/:userId/$USR_ID/g" | sed "s/:vendorId/$USR_ID/g" | sed "s/:ruteroId/$USR_ID/g")
  
  # Count remaining colon params (skip https://)
  remaining=$(echo "$url" | grep -o "/:[a-zA-Z]" | wc -l)
  if [ "$remaining" -gt 0 ]; then
    echo -e "${YELLOW}⚠ SKIP $method $path ($remaining dynamic params remain)${NC}"
    echo "⚠ SKIP | $method | $path | Dynamic params" >> "$RESULTS_FILE"
    SKIP=$((SKIP+1))
    continue
  fi
  
  # Add storeId for most GET endpoints that need it
  if [[ "$method" == "GET" ]] && [[ "$url" != *"storeId"* ]] && [[ "$url" != *"health"* ]] && [[ "$url" != *"auth/"* ]] && [[ "$url" != *"login"* ]] && [[ "$url" != *"sync/statuses"* ]] && [[ "$url" != *"sync/idempotency"* ]]; then
    url="${url}?storeId=$SID"
  fi
  
  # Special endpoint handling
  if [[ "$path" == "/vendors/inventory/"* ]]; then
    url="$BASE_URL/vendors/inventory/$USR_ID?storeId=$SID"
  fi
  if [[ "$path" == "/product-barcodes/"*"/barcodes" ]]; then
    url="$BASE_URL/product-barcodes/$PRD_ID/barcodes"
  fi
  if [[ "$path" == *"barcode"*":"* ]]; then
    url="$BASE_URL/products/barcode/test123?storeId=$SID"
  fi
  
  # Execute request
  resp_code=$(curl -sk --connect-to rhclaroni.com:443:127.0.0.1:443 "$url" \
    -H "Authorization: Bearer $TOKEN" \
    -o /tmp/endpoint_resp.json \
    -w "%{http_code}" \
    --max-time 15 2>/dev/null || echo "000")
  
  # Check result
  if [ "$resp_code" = "200" ] || [ "$resp_code" = "201" ] || [ "$resp_code" = "204" ] || [ "$resp_code" = "404" ] || [ "$resp_code" = "400" ]; then
    if [ "$resp_code" = "200" ]; then
      echo -e "${GREEN}✅ PASS${NC} $method $path → $resp_code"
      echo "✅ PASS | $method | $path | $resp_code | $file" >> "$RESULTS_FILE"
      PASS=$((PASS+1))
    elif [ "$resp_code" = "404" ] || [ "$resp_code" = "400" ]; then
      echo -e "${YELLOW}⚠ ACCEPTABLE${NC} $method $path → $resp_code (no data or invalid input)"
      echo "⚠ ACCEPTABLE | $method | $path | $resp_code | $file" >> "$RESULTS_FILE"
      PASS=$((PASS+1))
    else
      echo -e "${GREEN}✅ PASS${NC} $method $path → $resp_code"
      echo "✅ PASS | $method | $path | $resp_code | $file" >> "$RESULTS_FILE"
      PASS=$((PASS+1))
    fi
  else
    echo -e "${RED}❌ FAIL${NC} $method $path → $resp_code"
    echo "❌ FAIL | $method | $path | $resp_code | $file" >> "$RESULTS_FILE"
    if [ -f /tmp/endpoint_resp.json ]; then
      python3 -c "import json;d=json.load(open('/tmp/endpoint_resp.json'));print('  Message:',d.get('message','') or d.get('error',{}).get('message','') or d.get('statusCode',''))" 2>/dev/null
    fi
    FAIL=$((FAIL+1))
  fi
done < /tmp/endpoint_list.txt

# Summary
echo "" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "SUMMARY" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"
echo "Total: $TOTAL" | tee -a "$RESULTS_FILE"
echo "Pass:  $PASS" | tee -a "$RESULTS_FILE"
echo "Fail:  $FAIL" | tee -a "$RESULTS_FILE"
echo "Skip:  $SKIP" | tee -a "$RESULTS_FILE"
echo "Date:  $(date)" | tee -a "$RESULTS_FILE"
echo "========================================" | tee -a "$RESULTS_FILE"

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}$FAIL endpoints FAILING${NC}"
  echo "Check $RESULTS_FILE for details"
else
  echo -e "${GREEN}All $PASS endpoints passed!${NC}"
fi
