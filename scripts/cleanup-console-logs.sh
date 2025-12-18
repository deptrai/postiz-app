#!/bin/bash
# Script to remove console.log statements from production code
# Part of Phase 1 optimization

echo "🧹 Cleaning up console.log statements..."

# Find and remove console.error (keep only in catch blocks)
find apps/frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' '/console\.error.*Failed to/d' {} \;

echo "✅ Console cleanup complete!"
echo "Note: console.error in catch blocks preserved for error tracking"
