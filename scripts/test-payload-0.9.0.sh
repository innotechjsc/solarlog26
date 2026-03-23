#!/bin/bash
# Test script for payload schema 0.9.0
# Usage: ./test-payload-0.9.0.sh [API_KEY] [BASE_URL]

# Configuration
API_KEY="${1:-your-api-key-here}"
BASE_URL="${2:-http://localhost:5023}"
PAYLOAD_FILE="../payload/payload/basic_payload.json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if payload file exists
if [ ! -f "$PAYLOAD_FILE" ]; then
    echo -e "${RED}Error: Payload file not found: $PAYLOAD_FILE${NC}"
    echo "Please run this script from backend-system/scripts directory"
    exit 1
fi

# Update timestamp in payload
echo -e "${CYAN}Updating timestamp in payload...${NC}"
TIMESTAMP=$(date +%s)
TEMP_PAYLOAD=$(mktemp)

# Update timestamp using sed (works on Linux/Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed "s/\"timestamp\": [0-9]*/\"timestamp\": $TIMESTAMP/g" "$PAYLOAD_FILE" > "$TEMP_PAYLOAD"
else
    # Linux
    sed -i "s/\"timestamp\": [0-9]*/\"timestamp\": $TIMESTAMP/g" "$PAYLOAD_FILE"
    cp "$PAYLOAD_FILE" "$TEMP_PAYLOAD"
fi

echo -e "${CYAN}Sending payload to $BASE_URL/api/v1/data...${NC}"
echo -e "${YELLOW}API Key: $API_KEY${NC}"
echo ""

# Send request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/data" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$TEMP_PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Clean up temp file
rm -f "$TEMP_PAYLOAD"

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Success!${NC}"
    echo -e "${GREEN}HTTP Status: $HTTP_CODE${NC}"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Error!${NC}"
    echo -e "${RED}HTTP Status: $HTTP_CODE${NC}"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

