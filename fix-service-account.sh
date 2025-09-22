#!/bin/bash

# Fix Service Account for api-outreach-as-a-service project
# This script creates a new service account and key for the correct project

set -e

echo "🔧 Fixing Service Account for api-outreach-as-a-service"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

PROJECT_ID="api-outreach-as-a-service"
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"

print_status "Setting up service account for project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Create service account if it doesn't exist
print_status "Creating service account: $SERVICE_ACCOUNT_EMAIL"
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions deployments" \
  --quiet || echo "Service account may already exist"

# Grant necessary permissions
print_status "Granting permissions to service account..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/run.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.admin" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/artifactregistry.reader" \
  --quiet

# Create service account key
print_status "Creating service account key..."
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SERVICE_ACCOUNT_EMAIL

# Set the key as GitHub secret
print_status "Setting GCP_SA_KEY secret in GitHub..."
gh secret set GCP_SA_KEY < github-actions-key.json

# Clean up the key file
rm github-actions-key.json

print_success "Service account setup completed!"
echo ""
echo "✅ Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "✅ Project: $PROJECT_ID"
echo "✅ GitHub Secret GCP_SA_KEY updated"
echo ""
echo "🚀 You can now deploy to the correct project!"
