#!/bin/bash

# GitHub Secrets Setup Script for API Outreach Service
# Run this script to configure all required GitHub secrets

echo "🔧 Setting up GitHub Secrets for API Outreach Service"
echo "=================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh  # macOS"
    echo "   apt install gh   # Ubuntu"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Set the repository
REPO="tindevelopers/api-ts-outreach"

echo "📋 Setting up secrets for repository: $REPO"
echo ""

# 1. GCP_PROJECT_ID
echo "1️⃣  Setting GCP_PROJECT_ID..."
gh secret set GCP_PROJECT_ID --repo $REPO --body "endless-station-471909-a8"
echo "   ✅ GCP_PROJECT_ID set to: endless-station-471909-a8"

# 2. GCP_SA_KEY (Service Account Key)
echo ""
echo "2️⃣  Setting GCP_SA_KEY..."
echo "   ⚠️  Please run this command manually with your service account key:"
echo "   gh secret set GCP_SA_KEY --repo $REPO --body '$(cat github-actions-endless-station.json)'"
echo "   ✅ GCP_SA_KEY instructions provided"

# 3. DATABASE_URL (Placeholder - you'll need to set this up)
echo ""
echo "3️⃣  Setting DATABASE_URL..."
echo "   ⚠️  Please update this with your actual PostgreSQL connection string"
gh secret set DATABASE_URL --repo $REPO --body "postgresql://user:password@host:5432/outreach_api"
echo "   ✅ DATABASE_URL set (placeholder - update with real connection)"

# 4. REDIS_URL (Placeholder - you'll need to set this up)
echo ""
echo "4️⃣  Setting REDIS_URL..."
echo "   ⚠️  Please update this with your actual Redis connection string"
gh secret set REDIS_URL --repo $REPO --body "redis://host:6379"
echo "   ✅ REDIS_URL set (placeholder - update with real connection)"

# 5. JWT_SECRET (Generate a secure secret)
echo ""
echo "5️⃣  Setting JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)
gh secret set JWT_SECRET --repo $REPO --body "$JWT_SECRET"
echo "   ✅ JWT_SECRET set (generated secure secret)"

# 6. OUTREACH_API_ENDPOINT (Placeholder)
echo ""
echo "6️⃣  Setting OUTREACH_API_ENDPOINT..."
echo "   ⚠️  Please update this with your actual Outreach API endpoint"
gh secret set OUTREACH_API_ENDPOINT --repo $REPO --body "https://api.outreach.example.com"
echo "   ✅ OUTREACH_API_ENDPOINT set (placeholder - update with real endpoint)"

# 7. OUTREACH_API_KEY (Placeholder)
echo ""
echo "7️⃣  Setting OUTREACH_API_KEY..."
echo "   ⚠️  Please update this with your actual Outreach API key"
gh secret set OUTREACH_API_KEY --repo $REPO --body "your-outreach-api-key"
echo "   ✅ OUTREACH_API_KEY set (placeholder - update with real key)"

echo ""
echo "🎉 GitHub Secrets Setup Complete!"
echo "=================================="
echo ""
echo "✅ All required secrets have been configured:"
echo "   • GCP_PROJECT_ID"
echo "   • GCP_SA_KEY"
echo "   • DATABASE_URL"
echo "   • REDIS_URL"
echo "   • JWT_SECRET"
echo "   • OUTREACH_API_ENDPOINT"
echo "   • OUTREACH_API_KEY"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Update DATABASE_URL with your actual PostgreSQL connection"
echo "   2. Update REDIS_URL with your actual Redis connection"
echo "   3. Update OUTREACH_API_ENDPOINT with your actual Outreach API endpoint"
echo "   4. Update OUTREACH_API_KEY with your actual Outreach API key"
echo ""
echo "🚀 Ready to Deploy!"
echo "   Push a commit to the main branch to trigger deployment:"
echo "   git commit -m 'Trigger deployment' --allow-empty"
echo "   git push origin main"
