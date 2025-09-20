#!/bin/bash

# Complete GitHub Secrets Setup Script
# This script sets up all required secrets with the exact values you need

echo "🔐 Setting up GitHub Secrets for API Outreach Service"
echo "=================================================="

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is available and authenticated"

# Set Workload Identity Federation secrets
echo ""
echo "🔑 Setting up Workload Identity Federation secrets..."

gh secret set WIF_PROVIDER --body "projects/312998856461/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
echo "✅ WIF_PROVIDER set"

gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"
echo "✅ WIF_SERVICE_ACCOUNT set"

# Set application secrets with exact values
echo ""
echo "🔑 Setting up application secrets..."

# Redis URL - using localhost for development
gh secret set REDIS_URL --body "redis://localhost:6379"
echo "✅ REDIS_URL set (localhost for development)"

# JWT Secret - generated secure secret
gh secret set JWT_SECRET --body "6N8Soo+Qur5R3FYFZNs5FiQgq2/lHjEg8oUaZBw1ZqM="
echo "✅ JWT_SECRET set (secure generated secret)"

# Outreach API configuration - your own system
gh secret set OUTREACH_API_ENDPOINT --body "http://localhost:3000"
echo "✅ OUTREACH_API_ENDPOINT set (localhost for development)"

gh secret set OUTREACH_API_KEY --body "a44660a08fc1fde79446df533acc787d"
echo "✅ OUTREACH_API_KEY set (generated secure key)"

# Google OAuth configuration - you need to create these
echo ""
echo "🔑 Setting up Google OAuth secrets..."
echo "⚠️  You need to create these in Google Cloud Console first!"

read -p "Enter your Google Client ID (or press Enter to use placeholder): " GOOGLE_CLIENT_ID
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    GOOGLE_CLIENT_ID="placeholder-client-id"
    echo "Using placeholder: $GOOGLE_CLIENT_ID"
fi

read -p "Enter your Google Client Secret (or press Enter to use placeholder): " GOOGLE_CLIENT_SECRET
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    GOOGLE_CLIENT_SECRET="placeholder-client-secret"
    echo "Using placeholder: $GOOGLE_CLIENT_SECRET"
fi

gh secret set GOOGLE_CLIENT_ID --body "$GOOGLE_CLIENT_ID"
echo "✅ GOOGLE_CLIENT_ID set"

gh secret set GOOGLE_CLIENT_SECRET --body "$GOOGLE_CLIENT_SECRET"
echo "✅ GOOGLE_CLIENT_SECRET set"

echo ""
echo "🎉 GitHub Secrets Setup Complete!"
echo "=================================="
echo ""
echo "📋 Secrets Summary:"
echo "  ✅ WIF_PROVIDER: Set"
echo "  ✅ WIF_SERVICE_ACCOUNT: Set"
echo "  ✅ REDIS_URL: Set (localhost for development)"
echo "  ✅ JWT_SECRET: Set (secure generated secret)"
echo "  ✅ OUTREACH_API_ENDPOINT: Set (localhost for development)"
echo "  ✅ OUTREACH_API_KEY: Set (generated secure key)"
echo "  ✅ GOOGLE_CLIENT_ID: Set"
echo "  ✅ GOOGLE_CLIENT_SECRET: Set"
echo ""
echo "🚀 Ready to deploy! You can now:"
echo "   1. Push to main branch to trigger deployment, or"
echo "   2. Go to Actions tab and manually trigger the workflow"
echo ""
echo "📝 To create Google OAuth credentials:"
echo "   1. Go to: https://console.developers.google.com/apis/credentials/consent"
echo "   2. Select project: api-outreach-as-a-service"
echo "   3. Configure OAuth consent screen"
echo "   4. Create OAuth 2.0 Client ID"
echo "   5. Update the secrets with your actual credentials"
