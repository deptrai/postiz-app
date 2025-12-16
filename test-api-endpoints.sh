#!/bin/bash

echo "🔐 Testing API endpoints for Epic 6"
echo ""

# Login with test@analytics.com (org "axx" user)
echo "Logging in as test@analytics.com..."
LOGIN_RESPONSE=$(curl -s -c cookies-test.txt -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@analytics.com",
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

# Test Playbooks endpoint
echo "📚 Testing /analytics/playbooks endpoint..."
PLAYBOOKS=$(curl -s -b cookies-test.txt http://localhost:4001/analytics/playbooks)
echo "$PLAYBOOKS" | jq '.'
echo ""

# Test Experiments endpoint
echo "🧪 Testing /analytics/experiments endpoint..."
EXPERIMENTS=$(curl -s -b cookies-test.txt http://localhost:4001/analytics/experiments)
echo "$EXPERIMENTS" | jq '.'
echo ""

# Cleanup
rm -f cookies-test.txt

echo "✅ API tests complete!"
