#!/bin/bash

# Script to fix TypeScript error handling issues

echo "🔧 Fixing TypeScript error handling issues..."

# Add error handler import to all files that need it
files=(
  "src/controllers/accountController.ts"
  "src/controllers/analyticsController.ts"
  "src/controllers/campaignController.ts"
  "src/controllers/leadController.ts"
  "src/controllers/workflowController.ts"
  "src/integrations/GrowChiefService.ts"
  "src/services/analyticsService.ts"
  "src/services/campaignService.ts"
  "src/services/leadService.ts"
  "src/services/workflowService.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import if not already present
    if ! grep -q "getErrorMessage" "$file"; then
      # Find the last import statement and add our import after it
      sed -i '' '/^import.*from.*$/a\
import { getErrorMessage, logError } from '\''@/utils/errorHandler'\'';
' "$file"
    fi
    
    # Replace error.message with getErrorMessage(error)
    sed -i '' 's/error\.message/getErrorMessage(error)/g' "$file"
    
    # Replace error handling patterns
    sed -i '' 's/logger\.error(\([^,]*\), {[^}]*error: [^}]*})/logError(error, \1); logger.error(\1, { error: getErrorMessage(error)/g' "$file"
    
    echo "✅ Fixed $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Error handling fixes completed!"
