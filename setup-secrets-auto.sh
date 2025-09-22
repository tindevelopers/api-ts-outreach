#!/bin/bash

# Automated GitHub Secrets Setup Script for api-outreach-as-a-service
# This script configures all required GitHub secrets for the deployment pipeline

set -e

echo "🔐 Automated GitHub Secrets Setup for api-outreach-as-a-service"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  macOS: brew install gh"
    echo "  Linux: https://cli.github.com/manual/installation"
    echo "  Windows: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    print_error "You are not authenticated with GitHub CLI. Please run:"
    echo "  gh auth login"
    exit 1
fi

# Get current repository
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
print_status "Configuring secrets for repository: $REPO"

# Google Cloud project configuration
PROJECT_NUMBER="312998856461"
PROJECT_ID="api-outreach-as-a-service"

print_status "Using Google Cloud project: $PROJECT_ID (Project Number: $PROJECT_NUMBER)"
echo ""

# Set up Workload Identity Federation secrets
print_status "Setting up Google Cloud Authentication secrets..."

WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
WIF_SERVICE_ACCOUNT="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

echo "$WIF_PROVIDER" | gh secret set WIF_PROVIDER
print_success "Secret WIF_PROVIDER set successfully"

echo "$WIF_SERVICE_ACCOUNT" | gh secret set WIF_SERVICE_ACCOUNT
print_success "Secret WIF_SERVICE_ACCOUNT set successfully"

echo ""

# Set up application secrets with default/example values
print_status "Setting up application secrets with example values..."

# Redis URL (you'll need to update this with your actual Redis instance)
echo "redis://localhost:6379" | gh secret set REDIS_URL
print_success "Secret REDIS_URL set (update with your actual Redis instance)"

# JWT Secret (generate a random one)
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | gh secret set JWT_SECRET
print_success "Secret JWT_SECRET set with generated value"

# Outreach API Configuration (you'll need to update these)
echo "https://api.outreach.example.com" | gh secret set OUTREACH_API_ENDPOINT
print_success "Secret OUTREACH_API_ENDPOINT set (update with your actual endpoint)"

echo "your-outreach-api-key-here" | gh secret set OUTREACH_API_KEY
print_success "Secret OUTREACH_API_KEY set (update with your actual API key)"

# Google OAuth Configuration (you'll need to update these)
echo "your-google-client-id.apps.googleusercontent.com" | gh secret set GOOGLE_CLIENT_ID
print_success "Secret GOOGLE_CLIENT_ID set (update with your actual client ID)"

echo "your-google-client-secret-here" | gh secret set GOOGLE_CLIENT_SECRET
print_success "Secret GOOGLE_CLIENT_SECRET set (update with your actual client secret)"

echo ""

# Verify secrets
print_status "Verifying configured secrets..."
echo ""

# List all secrets
echo "Configured secrets:"
gh secret list

echo ""
print_success "GitHub secrets configuration completed!"
echo ""

# Display next steps
echo "🚀 Next Steps:"
echo "=============="
echo "1. Update the following secrets with your actual values:"
echo "   - REDIS_URL: Update with your actual Redis instance URL"
echo "   - OUTREACH_API_ENDPOINT: Update with your actual Outreach API endpoint"
echo "   - OUTREACH_API_KEY: Update with your actual Outreach API key"
echo "   - GOOGLE_CLIENT_ID: Update with your actual Google OAuth client ID"
echo "   - GOOGLE_CLIENT_SECRET: Update with your actual Google OAuth client secret"
echo ""
echo "2. Verify your Google Cloud project setup:"
echo "   gcloud config set project $PROJECT_ID"
echo ""
echo "3. Test the deployment by pushing to main branch:"
echo "   git add ."
echo "   git commit -m 'Test deployment'"
echo "   git push origin main"
echo ""
echo "4. Monitor the deployment in GitHub Actions:"
echo "   https://github.com/$REPO/actions"
echo ""
echo "5. Check the deployed service in Google Cloud Console:"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""

print_warning "IMPORTANT: Please update the API keys and endpoints with your actual values before deploying!"
echo ""

print_success "Setup complete! Your GitHub Actions will now deploy to $PROJECT_ID"
