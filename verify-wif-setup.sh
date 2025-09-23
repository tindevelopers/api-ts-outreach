#!/bin/bash

# Verify and Fix Workload Identity Federation Setup
# This script ensures WIF is properly configured for GitHub Actions

set -e

echo "🔍 Verifying Workload Identity Federation Setup"
echo "=============================================="
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
PROJECT_NUMBER="312998856461"
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-provider"
REPO_NAME="tindevelopers/api-ts-outreach"

print_status "Verifying setup for project: $PROJECT_ID"

# Set the project
gcloud config set project $PROJECT_ID

# Check if Workload Identity Pool exists
print_status "Checking Workload Identity Pool..."
if gcloud iam workload-identity-pools describe $POOL_NAME --location="global" &>/dev/null; then
    print_success "Workload Identity Pool '$POOL_NAME' exists"
else
    print_warning "Workload Identity Pool '$POOL_NAME' does not exist. Creating..."
    gcloud iam workload-identity-pools create $POOL_NAME \
      --location="global" \
      --display-name="GitHub Actions Pool"
    print_success "Workload Identity Pool created"
fi

# Check if Workload Identity Provider exists
print_status "Checking Workload Identity Provider..."
if gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
  --location="global" \
  --workload-identity-pool=$POOL_NAME &>/dev/null; then
    print_success "Workload Identity Provider '$PROVIDER_NAME' exists"
else
    print_warning "Workload Identity Provider '$PROVIDER_NAME' does not exist. Creating..."
    gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
      --location="global" \
      --workload-identity-pool=$POOL_NAME \
      --display-name="GitHub Provider" \
      --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
      --issuer-uri="https://token.actions.githubusercontent.com"
    print_success "Workload Identity Provider created"
fi

# Check service account
print_status "Checking service account..."
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    print_success "Service account '$SERVICE_ACCOUNT_EMAIL' exists"
else
    print_warning "Service account '$SERVICE_ACCOUNT_EMAIL' does not exist. Creating..."
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
      --display-name="GitHub Actions Service Account" \
      --description="Service account for GitHub Actions deployments"
    print_success "Service account created"
fi

# Grant necessary permissions to service account
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

print_success "Service account permissions granted"

# Allow GitHub Actions to impersonate the service account
print_status "Setting up Workload Identity Federation binding..."
WIF_MEMBER="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$REPO_NAME"

gcloud iam service-accounts add-iam-policy-binding \
  --role="roles/iam.workloadIdentityUser" \
  --member="$WIF_MEMBER" \
  $SERVICE_ACCOUNT_EMAIL \
  --quiet

print_success "Workload Identity Federation binding created"

# Update GitHub secrets
print_status "Updating GitHub secrets..."

WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"

echo "$WIF_PROVIDER" | gh secret set WIF_PROVIDER
print_success "WIF_PROVIDER secret updated"

echo "$SERVICE_ACCOUNT_EMAIL" | gh secret set WIF_SERVICE_ACCOUNT
print_success "WIF_SERVICE_ACCOUNT secret updated"

echo ""
print_success "Workload Identity Federation setup completed!"
echo ""
echo "✅ Project: $PROJECT_ID"
echo "✅ Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "✅ WIF Provider: $WIF_PROVIDER"
echo "✅ Repository: $REPO_NAME"
echo ""
echo "🚀 GitHub Actions should now be able to authenticate successfully!"
