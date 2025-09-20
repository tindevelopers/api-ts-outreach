#!/bin/bash

# GitHub Secrets Setup Script
# Run this script to set up all required GitHub secrets for deployment

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

# Set application secrets (you'll need to update these with your actual values)
echo ""
echo "🔑 Setting up application secrets..."

# Redis URL - update with your actual Redis connection string
gh secret set REDIS_URL --body "redis://localhost:6379"
echo "✅ REDIS_URL set (update with your actual Redis URL)"

# JWT Secret - generate a secure secret
JWT_SECRET=$(openssl rand -base64 32)
gh secret set JWT_SECRET --body "$JWT_SECRET"
echo "✅ JWT_SECRET set (auto-generated)"

# Outreach API configuration - update with your actual values
gh secret set OUTREACH_API_ENDPOINT --body "https://api.outreach.example.com"
echo "✅ OUTREACH_API_ENDPOINT set (update with your actual endpoint)"

gh secret set OUTREACH_API_KEY --body "your-outreach-api-key"
echo "✅ OUTREACH_API_KEY set (update with your actual API key)"

# Google OAuth configuration - update with your actual values
gh secret set GOOGLE_CLIENT_ID --body "your-google-client-id"
echo "✅ GOOGLE_CLIENT_ID set (update with your actual client ID)"

gh secret set GOOGLE_CLIENT_SECRET --body "your-google-client-secret"
echo "✅ GOOGLE_CLIENT_SECRET set (update with your actual client secret)"

echo ""
echo "🎉 GitHub Secrets Setup Complete!"
echo "=================================="
echo ""
echo "📋 Secrets Summary:"
echo "  ✅ WIF_PROVIDER: Set"
echo "  ✅ WIF_SERVICE_ACCOUNT: Set"
echo "  ✅ REDIS_URL: Set (update with your actual Redis URL)"
echo "  ✅ JWT_SECRET: Set (auto-generated)"
echo "  ✅ OUTREACH_API_ENDPOINT: Set (update with your actual endpoint)"
echo "  ✅ OUTREACH_API_KEY: Set (update with your actual API key)"
echo "  ✅ GOOGLE_CLIENT_ID: Set (update with your actual client ID)"
echo "  ✅ GOOGLE_CLIENT_SECRET: Set (update with your actual client secret)"
echo ""
echo "⚠️  IMPORTANT: Update the following secrets with your actual values:"
echo "   • REDIS_URL - Your Redis connection string"
echo "   • OUTREACH_API_ENDPOINT - Your outreach API endpoint"
echo "   • OUTREACH_API_KEY - Your outreach API key"
echo "   • GOOGLE_CLIENT_ID - Your Google OAuth client ID"
echo "   • GOOGLE_CLIENT_SECRET - Your Google OAuth client secret"
echo ""
echo "🚀 Once you've updated the secrets, you can trigger deployment by:"
echo "   1. Push to main branch, or"
echo "   2. Go to Actions tab and manually trigger the workflow"
