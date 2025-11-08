#!/bin/bash
# Google Sheets Webhook Test Script
# Run this after redeploying the webhook to verify it's working

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Webhook URL (update this with your NEW webhook URL after redeployment)
WEBHOOK_URL="${1:-https://script.google.com/macros/s/AKfycbwqknIV5HvQ3LScyR19MJPa1BL9ZJ_PReBFzQpt_pxZFryWdv3WMLRnefXHajP0K0zl1g/exec}"

echo "========================================="
echo "Google Sheets Webhook Test"
echo "========================================="
echo ""
echo "Testing webhook: $WEBHOOK_URL"
echo ""

# Test 1: GET request (health check)
echo "Test 1: GET Request (Health Check)"
echo "-----------------------------------"
response=$(curl -L -s -w "\n%{http_code}" -X GET "$WEBHOOK_URL")
http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')
status_code="$http_code"

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP $status_code"
    echo "Response: $body"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP $status_code"
    echo "Response: $body"
fi
echo ""

# Test 2: POST request with batch sync
echo "Test 2: POST Request (Batch Sync)"
echo "-----------------------------------"
test_data='{
  "action": "batch",
  "expenses": [
    {
      "ref": 1,
      "date": "11/08/2025",
      "description": "Test Expense 1",
      "category": "Food",
      "in": 0,
      "out": 50.00,
      "balance": -50.00
    },
    {
      "ref": 2,
      "date": "11/08/2025",
      "description": "Test Expense 2",
      "category": "Transport",
      "in": 100,
      "out": 0,
      "balance": 50.00
    }
  ]
}'

response=$(curl -L -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$test_data")
http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')
status_code="$http_code"

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - HTTP $status_code"
    echo "Response: $body"

    # Check if response contains success:true
    if echo "$body" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Batch sync successful${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Response doesn't indicate success${NC}"
    fi
elif [ "$status_code" = "405" ]; then
    echo -e "${RED}✗ FAILED${NC} - HTTP $status_code (Method Not Allowed)"
    echo -e "${RED}The webhook is still not accepting POST requests!${NC}"
    echo "Please follow the redeployment steps in GOOGLE_SHEETS_SYNC_FIX.md"
else
    echo -e "${RED}✗ FAILED${NC} - HTTP $status_code"
    echo "Response: $body"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""

if [ "$status_code" = "200" ] && echo "$body" | grep -q '"success":true'; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED ✓✓✓${NC}"
    echo ""
    echo "The webhook is working correctly!"
    echo "You can now use the Google Sheets sync feature."
    echo ""
    echo "Next steps:"
    echo "1. Update the webhook URL in the app (Settings screen)"
    echo "2. Add/edit an expense to test the sync"
    echo "3. Check your Google Sheet to verify data appears"
else
    echo -e "${RED}✗✗✗ TESTS FAILED ✗✗✗${NC}"
    echo ""
    echo "The webhook is NOT working correctly."
    echo ""
    echo "Common issues:"
    echo "1. HTTP 405 - Webhook not deployed with POST access"
    echo "   → Follow redeployment steps in GOOGLE_SHEETS_SYNC_FIX.md"
    echo "2. HTTP 403 - Permission denied"
    echo "   → Set 'Who has access' to 'Anyone'"
    echo "3. HTTP 404 - Webhook URL invalid"
    echo "   → Verify the URL is correct"
    echo ""
    echo "Read GOOGLE_SHEETS_SYNC_FIX.md for detailed fix instructions."
fi
echo ""
