# GitHub Secrets Setup for api-outreach-as-a-service

This guide provides the complete setup for GitHub Actions deployment to the `api-outreach-as-a-service` Google Cloud project.

## 🎯 Project Configuration

- **Google Cloud Project**: `api-outreach-as-a-service`
- **Service Name**: `api-outreach-service`
- **Region**: `us-east1`
- **Deployment Method**: GitHub Actions (Two-Stage Pipeline)

## 🔐 Required GitHub Secrets

### Google Cloud Authentication

#### Option 1: Workload Identity Federation (Recommended)

1. **WIF_PROVIDER**: Workload Identity Federation provider
2. **WIF_SERVICE_ACCOUNT**: Google Cloud service account email

#### Option 2: Service Account Key (Alternative)

1. **GCP_SA_KEY**: Service Account JSON key

### Application Secrets

3. **REDIS_URL**: Redis connection string for caching and rate limiting
4. **JWT_SECRET**: Secret key for JWT token generation
5. **OUTREACH_API_ENDPOINT**: Outreach API endpoint URL
6. **OUTREACH_API_KEY**: Outreach API authentication key
7. **GOOGLE_CLIENT_ID**: Google OAuth client ID
8. **GOOGLE_CLIENT_SECRET**: Google OAuth client secret

### Optional Secrets

9. **SLACK_WEBHOOK_URL**: Slack webhook URL for deployment notifications
10. **SNYK_TOKEN**: Snyk security scan token

## 🏗️ Google Cloud Setup Commands

### 1. Create and Configure Project

```bash
# Create the project (if not exists)
gcloud projects create api-outreach-as-a-service

# Set as active project
gcloud config set project api-outreach-as-a-service

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Set up Workload Identity Federation (Recommended)

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions deployments"

# Grant necessary permissions
gcloud projects add-iam-policy-binding api-outreach-as-a-service \
  --member="serviceAccount:github-actions@api-outreach-as-a-service.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding api-outreach-as-a-service \
  --member="serviceAccount:github-actions@api-outreach-as-a-service.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding api-outreach-as-a-service \
  --member="serviceAccount:github-actions@api-outreach-as-a-service.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create github-actions-pool \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe api-outreach-as-a-service --format="value(projectNumber)")

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/YOUR_GITHUB_USERNAME/api-ts-outreach" \
  github-actions@api-outreach-as-a-service.iam.gserviceaccount.com
```

### 3. Alternative: Service Account Key Setup

```bash
# Create service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@api-outreach-as-a-service.iam.gserviceaccount.com

# The key will be saved as github-actions-key.json
```

## 🔧 GitHub Secrets Configuration

### Using GitHub CLI (Recommended)

```bash
# Set up Workload Identity Federation secrets
gh secret set WIF_PROVIDER --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"

# Or set up Service Account Key
gh secret set GCP_SA_KEY --body "$(cat github-actions-key.json)"

# Set application secrets
gh secret set REDIS_URL --body "redis://your-redis-instance:6379"
gh secret set JWT_SECRET --body "your-super-secret-jwt-key-here"
gh secret set OUTREACH_API_ENDPOINT --body "https://api.outreach.example.com"
gh secret set OUTREACH_API_KEY --body "your-outreach-api-key"
gh secret set GOOGLE_CLIENT_ID --body "your-google-client-id"
gh secret set GOOGLE_CLIENT_SECRET --body "your-google-client-secret"

# Optional secrets
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
gh secret set SNYK_TOKEN --body "your-snyk-token"
```

### Using GitHub Web Interface

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

## 🚀 Deployment Process

### Automatic Deployment

The service automatically deploys when:
- Code is pushed to the `main` branch
- Stage 1 (Docker & Code Quality) completes successfully
- All tests and security scans pass

### Manual Deployment

1. Go to **Actions** tab in your repository
2. Select **"Stage 2 - Google Cloud Run Deployment Pipeline"**
3. Click **"Run workflow"**
4. Choose environment and click **"Run workflow"**

## 🌍 Environment Configuration

### Production (main branch)
- **Authentication**: Requires Google IAM authentication
- **Resources**: 2 CPU, 2Gi memory
- **Scaling**: 1-100 instances, 1000 concurrency
- **Security**: Full authentication required

### Staging (develop branch)
- **Authentication**: Open for testing
- **Resources**: 1 CPU, 1Gi memory
- **Scaling**: 0-10 instances, 80 concurrency
- **Security**: Open for testing

### Development (other branches)
- **Authentication**: Open for development
- **Resources**: 1 CPU, 512Mi memory
- **Scaling**: 0-5 instances, 80 concurrency
- **Security**: Open for development

## 🔍 Verification Steps

### 1. Check GitHub Secrets

```bash
# List all secrets (names only)
gh secret list

# Verify specific secret exists
gh secret get WIF_PROVIDER
```

### 2. Test Deployment

1. Push a small change to the `main` branch
2. Monitor the GitHub Actions workflow
3. Check the deployment in Google Cloud Console

### 3. Verify Service

```bash
# Get service URL
gcloud run services describe api-outreach-service \
  --region=us-east1 \
  --project=api-outreach-as-a-service \
  --format='value(status.url)'

# Test health endpoint
curl -f https://your-service-url/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify Workload Identity Federation setup
   - Check service account permissions
   - Ensure repository name matches in IAM binding

2. **Deployment Failures**
   - Check Docker image exists in GHCR
   - Verify environment variables are set
   - Review Cloud Run service limits

3. **Health Check Failures**
   - Verify application starts correctly
   - Check port configuration (3000)
   - Review application logs in Cloud Console

### Debug Commands

```bash
# Check service status
gcloud run services describe api-outreach-service --region us-east1

# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=api-outreach-service" --limit 50

# Test health endpoint
curl -f https://your-service-url/health
```

## 📊 Monitoring

### Health Checks
- **Endpoint**: `GET /health`
- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 attempts

### Performance Monitoring
- Response time monitoring
- API endpoint accessibility checks
- Resource utilization tracking

## 🔒 Security Best Practices

1. **Use Workload Identity Federation** instead of service account keys
2. **Enable audit logging** for all operations
3. **Implement proper IAM roles** with least privilege
4. **Use HTTPS only** for all communications
5. **Regular security updates** for base images
6. **Monitor for security vulnerabilities** with Container Analysis

## 📝 Next Steps

1. ✅ Set up the Google Cloud project and service account
2. ✅ Configure Workload Identity Federation
3. ✅ Add all required secrets to GitHub
4. 🔄 Test the deployment pipeline
5. 🔄 Monitor the first production deployment
6. 🔄 Set up additional monitoring and alerting as needed

---

**Note**: Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username in the IAM binding command.
