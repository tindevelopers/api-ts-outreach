#!/bin/bash

# Google Cloud Setup Script for Stage 2 Deployment
# This script sets up the necessary Google Cloud resources for the deployment pipeline

set -e

# Configuration
PROJECT_ID="api-outreach-as-a-service"
REGION="us-east1"
SERVICE_NAME="api-outreach-service"
SERVICE_ACCOUNT_NAME="github-actions"
WORKLOAD_IDENTITY_POOL="github-actions-pool"
WORKLOAD_IDENTITY_PROVIDER="github-provider"
REPOSITORY="tindevelopers/api-ts-outreach"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first:"
        echo "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    log_success "gcloud CLI is installed"
}

# Check if user is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "You are not authenticated with gcloud. Please run:"
        echo "gcloud auth login"
        exit 1
    fi
    log_success "gcloud authentication verified"
}

# Create project if it doesn't exist
create_project() {
    log_info "Creating project: $PROJECT_ID"
    
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        log_warning "Project $PROJECT_ID already exists"
    else
        gcloud projects create $PROJECT_ID --name="API Outreach as a Service"
        log_success "Project $PROJECT_ID created"
    fi
    
    # Set as active project
    gcloud config set project $PROJECT_ID
    log_success "Set $PROJECT_ID as active project"
}

# Enable required APIs
enable_apis() {
    log_info "Enabling required APIs..."
    
    local apis=(
        "run.googleapis.com"
        "containerregistry.googleapis.com"
        "iam.googleapis.com"
        "cloudbuild.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log_info "Enabling $api..."
        gcloud services enable $api
    done
    
    log_success "All required APIs enabled"
}

# Create service account
create_service_account() {
    log_info "Creating service account: $SERVICE_ACCOUNT_NAME"
    
    local service_account_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    if gcloud iam service-accounts describe $service_account_email &> /dev/null; then
        log_warning "Service account $service_account_email already exists"
    else
        gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
            --display-name="GitHub Actions Service Account" \
            --description="Service account for GitHub Actions deployments"
        log_success "Service account $service_account_email created"
    fi
}

# Grant permissions to service account
grant_permissions() {
    log_info "Granting permissions to service account..."
    
    local service_account_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Cloud Run Admin
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$service_account_email" \
        --role="roles/run.admin"
    
    # Storage Admin (for Container Registry)
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$service_account_email" \
        --role="roles/storage.admin"
    
    # Service Account User
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$service_account_email" \
        --role="roles/iam.serviceAccountUser"
    
    # Logging Writer
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$service_account_email" \
        --role="roles/logging.logWriter"
    
    # Monitoring Metric Writer
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$service_account_email" \
        --role="roles/monitoring.metricWriter"
    
    log_success "Permissions granted to service account"
}

# Create Workload Identity Pool
create_workload_identity_pool() {
    log_info "Creating Workload Identity Pool: $WORKLOAD_IDENTITY_POOL"
    
    if gcloud iam workload-identity-pools describe $WORKLOAD_IDENTITY_POOL \
        --location="global" &> /dev/null; then
        log_warning "Workload Identity Pool $WORKLOAD_IDENTITY_POOL already exists"
    else
        gcloud iam workload-identity-pools create $WORKLOAD_IDENTITY_POOL \
            --location="global" \
            --display-name="GitHub Actions Pool"
        log_success "Workload Identity Pool $WORKLOAD_IDENTITY_POOL created"
    fi
}

# Create Workload Identity Provider
create_workload_identity_provider() {
    log_info "Creating Workload Identity Provider: $WORKLOAD_IDENTITY_PROVIDER"
    
    if gcloud iam workload-identity-pools providers describe $WORKLOAD_IDENTITY_PROVIDER \
        --location="global" \
        --workload-identity-pool=$WORKLOAD_IDENTITY_POOL &> /dev/null; then
        log_warning "Workload Identity Provider $WORKLOAD_IDENTITY_PROVIDER already exists"
    else
        gcloud iam workload-identity-pools providers create-oidc $WORKLOAD_IDENTITY_PROVIDER \
            --location="global" \
            --workload-identity-pool=$WORKLOAD_IDENTITY_POOL \
            --display-name="GitHub Provider" \
            --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
            --issuer-uri="https://token.actions.githubusercontent.com"
        log_success "Workload Identity Provider $WORKLOAD_IDENTITY_PROVIDER created"
    fi
}

# Allow GitHub Actions to impersonate service account
allow_github_impersonation() {
    log_info "Allowing GitHub Actions to impersonate service account..."
    
    local service_account_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    local project_number=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    local member="principalSet://iam.googleapis.com/projects/$project_number/locations/global/workloadIdentityPools/$WORKLOAD_IDENTITY_POOL/attribute.repository/$REPOSITORY"
    
    gcloud iam service-accounts add-iam-policy-binding \
        --role="roles/iam.workloadIdentityUser" \
        --member="$member" \
        $service_account_email
    
    log_success "GitHub Actions impersonation configured"
}

# Get project number
get_project_number() {
    local project_number=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    echo $project_number
}

# Display setup summary
display_summary() {
    local project_number=$(get_project_number)
    local service_account_email="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    local wif_provider="projects/$project_number/locations/global/workloadIdentityPools/$WORKLOAD_IDENTITY_POOL/providers/$WORKLOAD_IDENTITY_PROVIDER"
    
    echo ""
    echo "=========================================="
    echo "🎉 Google Cloud Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📋 Configuration Summary:"
    echo "  Project ID: $PROJECT_ID"
    echo "  Project Number: $project_number"
    echo "  Region: $REGION"
    echo "  Service Name: $SERVICE_NAME"
    echo "  Service Account: $service_account_email"
    echo "  WIF Provider: $wif_provider"
    echo ""
    echo "🔐 GitHub Secrets to Set:"
    echo "  WIF_PROVIDER: $wif_provider"
    echo "  WIF_SERVICE_ACCOUNT: $service_account_email"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Set the GitHub secrets listed above"
    echo "  2. Add your application secrets (REDIS_URL, JWT_SECRET, etc.)"
    echo "  3. Test the deployment pipeline"
    echo ""
    echo "🔗 Useful Links:"
    echo "  Google Cloud Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo "  IAM Console: https://console.cloud.google.com/iam-admin?project=$PROJECT_ID"
    echo "  Workload Identity: https://console.cloud.google.com/iam-admin/workload-identity-pools?project=$PROJECT_ID"
    echo ""
}

# Main execution
main() {
    echo "🚀 Setting up Google Cloud for Stage 2 Deployment"
    echo "=================================================="
    echo ""
    
    check_gcloud
    check_auth
    create_project
    enable_apis
    create_service_account
    grant_permissions
    create_workload_identity_pool
    create_workload_identity_provider
    allow_github_impersonation
    display_summary
    
    log_success "Setup completed successfully!"
}

# Run main function
main "$@"
