#!/bin/bash

echo "🔐 Logging in with cookies..."

# Login and save cookies
LOGIN_RESPONSE=$(curl -s -c cookies.txt -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luis@test.com",
    "password": "password123",
    "provider": "LOCAL"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

if [ "$(echo "$LOGIN_RESPONSE" | jq -r '.login')" != "true" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo ""
echo "📥 Calling manual-sync endpoint..."
echo ""

# Call manual-sync with cookies
SYNC_RESPONSE=$(curl -s -b cookies.txt -X POST http://localhost:4001/analytics/manual-sync \
  -H "Content-Type: application/json")

echo "$SYNC_RESPONSE" | jq '.'

# Cleanup
rm -f cookies.txt

echo ""
echo "✅ Manual sync complete!"
