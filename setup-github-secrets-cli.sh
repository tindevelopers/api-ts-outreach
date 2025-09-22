#!/bin/bash

# GitHub Secrets Setup Script for api-outreach-as-a-service
# This script configures all required GitHub secrets for the deployment pipeline

set -e

echo "🔐 GitHub Secrets Setup for api-outreach-as-a-service"
echo "=================================================="
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

echo ""
print_status "This script will set up the following secrets:"
echo "  🔑 Google Cloud Authentication (WIF_PROVIDER, WIF_SERVICE_ACCOUNT)"
echo "  🔑 Application Secrets (REDIS_URL, JWT_SECRET, etc.)"
echo "  🔑 API Keys (OUTREACH_API_ENDPOINT, OUTREACH_API_KEY)"
echo "  🔑 OAuth Secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)"
echo "  🔑 Optional (SLACK_WEBHOOK_URL, SNYK_TOKEN)"
echo ""

# Confirm before proceeding
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Setup cancelled by user"
    exit 0
fi

echo ""
print_status "Starting GitHub secrets configuration..."
echo ""

# Function to set secret with validation
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=${3:-true}
    
    echo -e "${BLUE}Setting secret: $secret_name${NC}"
    echo "Description: $secret_description"
    
    if [ "$is_required" = true ]; then
        echo -n "Enter value (required): "
    else
        echo -n "Enter value (optional, press Enter to skip): "
    fi
    
    read -s secret_value
    echo ""
    
    if [ -z "$secret_value" ] && [ "$is_required" = true ]; then
        print_error "Secret $secret_name is required but no value provided"
        return 1
    fi
    
    if [ -n "$secret_value" ]; then
        if echo "$secret_value" | gh secret set "$secret_name"; then
            print_success "Secret $secret_name set successfully"
        else
            print_error "Failed to set secret $secret_name"
            return 1
        fi
    else
        print_warning "Skipping optional secret $secret_name"
    fi
    
    echo ""
}

# Google Cloud Authentication Secrets
echo "🔐 Google Cloud Authentication"
echo "=============================="

# Get project number for WIF_PROVIDER
echo "First, we need your Google Cloud project number for the Workload Identity Federation provider."
echo "You can find this in the Google Cloud Console or by running:"
echo "  gcloud projects describe api-outreach-as-a-service --format='value(projectNumber)'"
echo ""

read -p "Enter your Google Cloud project number: " PROJECT_NUMBER

if [ -z "$PROJECT_NUMBER" ]; then
    print_error "Project number is required"
    exit 1
fi

WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
WIF_SERVICE_ACCOUNT="github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"

# Set WIF secrets
echo "$WIF_PROVIDER" | gh secret set WIF_PROVIDER
print_success "Secret WIF_PROVIDER set successfully"

echo "$WIF_SERVICE_ACCOUNT" | gh secret set WIF_SERVICE_ACCOUNT
print_success "Secret WIF_SERVICE_ACCOUNT set successfully"

echo ""

# Application Secrets
echo "🔧 Application Secrets"
echo "====================="

set_secret "REDIS_URL" "Redis connection string (e.g., redis://your-redis-instance:6379)" true
set_secret "JWT_SECRET" "JWT signing secret (use a strong, random string)" true

echo ""

# API Configuration
echo "🌐 API Configuration"
echo "==================="

set_secret "OUTREACH_API_ENDPOINT" "Outreach API endpoint URL (e.g., https://api.outreach.example.com)" true
set_secret "OUTREACH_API_KEY" "Outreach API authentication key" true

echo ""

# Google OAuth Configuration
echo "🔑 Google OAuth Configuration"
echo "============================="

set_secret "GOOGLE_CLIENT_ID" "Google OAuth client ID" true
set_secret "GOOGLE_CLIENT_SECRET" "Google OAuth client secret" true

echo ""

# Optional Secrets
echo "📢 Optional Secrets"
echo "=================="

set_secret "SLACK_WEBHOOK_URL" "Slack webhook URL for deployment notifications" false
set_secret "SNYK_TOKEN" "Snyk security scan token" false

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
echo "1. Verify your Google Cloud project setup:"
echo "   gcloud config set project api-outreach-as-a-service"
echo ""
echo "2. Test the deployment by pushing to main branch:"
echo "   git add ."
echo "   git commit -m 'Test deployment'"
echo "   git push origin main"
echo ""
echo "3. Monitor the deployment in GitHub Actions:"
echo "   https://github.com/$REPO/actions"
echo ""
echo "4. Check the deployed service in Google Cloud Console:"
echo "   https://console.cloud.google.com/run?project=api-outreach-as-a-service"
echo ""

print_success "Setup complete! Your GitHub Actions will now deploy to api-outreach-as-a-service"
