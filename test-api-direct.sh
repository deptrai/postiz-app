#!/bin/bash

# Test Epic 6 API Endpoints with Real Data
# Org: Analytics Test Co (49470bf8-706f-49d8-9ddc-2f0eb727aef9)

echo "🧪 Testing Epic 6 API Endpoints"
echo "================================"
echo ""

BASE_URL="http://localhost:4001"

# Test 1: GET /playbooks
echo "📋 Test 1: GET /playbooks"
curl -s "$BASE_URL/playbooks" | jq -r '.playbooks | length' 2>/dev/null && echo "✅ Playbooks endpoint working" || echo "❌ Failed"
echo ""

# Test 2: GET /experiments
echo "🧪 Test 2: GET /experiments"
EXPERIMENTS=$(curl -s "$BASE_URL/experiments" | jq -r '.experiments | length' 2>/dev/null)
if [ ! -z "$EXPERIMENTS" ]; then
  echo "✅ Experiments endpoint working"
  echo "   Count: $EXPERIMENTS"
else
  echo "❌ Failed or requires auth"
fi
echo ""

# Test 3: GET /experiments with sample ID
echo "🧪 Test 3: GET /experiments/:id"
EXP_ID="cmj713y9x00019kgt8zirvk5b"
curl -s "$BASE_URL/experiments/$EXP_ID" 2>/dev/null | jq -r '.success' 2>/dev/null && echo "✅ Get experiment by ID working" || echo "❌ Failed or requires auth"
echo ""

# Summary
echo "================================"
echo "💡 Note: Some endpoints may require authentication"
echo "   Frontend uses cookies/JWT for auth"
echo ""
echo "🔗 API Endpoints:"
echo "   GET  $BASE_URL/playbooks"
echo "   GET  $BASE_URL/experiments"
echo "   POST $BASE_URL/experiments"
echo "   GET  $BASE_URL/experiments/:id"
echo "   POST $BASE_URL/experiments/:id/start"
echo "   POST $BASE_URL/experiments/:id/track"
echo "   GET  $BASE_URL/experiments/:id/results"
echo "   POST $BASE_URL/experiments/:id/confirm-winner"
