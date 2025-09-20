# Stage 2: Google Cloud Run Deployment Setup

This document outlines the setup required for the Stage 2 Google Cloud Run deployment pipeline.

## 🚀 Overview

The Stage 2 pipeline automatically deploys validated Docker images from Stage 1 to Google Cloud Run in the `api-outreach-as-a-service` project in the `us-east1` region.

## 🔐 Required GitHub Secrets

### Google Cloud Authentication (Workload Identity Federation - Recommended)

1. **WIF_PROVIDER**: Workload Identity Federation provider
2. **WIF_SERVICE_ACCOUNT**: Google Cloud service account email

### Application Secrets

3. **REDIS_URL**: Redis connection string for caching and rate limiting
4. **JWT_SECRET**: Secret key for JWT token generation
5. **GROWCHIEF_ENDPOINT**: GrowChief API endpoint URL
6. **GROWCHIEF_API_KEY**: GrowChief API authentication key
7. **GOOGLE_CLIENT_ID**: Google OAuth client ID
8. **GOOGLE_CLIENT_SECRET**: Google OAuth client secret

### Notifications (Optional)

9. **SLACK_WEBHOOK_URL**: Slack webhook URL for deployment notifications

## 🏗️ Google Cloud Setup

### 1. Create Google Cloud Project

```bash
# Create the project
gcloud projects create api-outreach-as-a-service

# Set as active project
gcloud config set project api-outreach-as-a-service

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Set up Workload Identity Federation

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

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/tindevelopers/api-ts-outreach" \
  github-actions@api-outreach-as-a-service.iam.gserviceaccount.com
```

### 3. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

```bash
# Get the Workload Identity Provider
WIF_PROVIDER="projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"

# Set GitHub secrets (replace with actual values)
gh secret set WIF_PROVIDER --body "$WIF_PROVIDER"
gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"
gh secret set REDIS_URL --body "redis://your-redis-instance:6379"
gh secret set JWT_SECRET --body "your-jwt-secret-key"
gh secret set GROWCHIEF_ENDPOINT --body "https://api.growchief.com"
gh secret set GROWCHIEF_API_KEY --body "your-growchief-api-key"
gh secret set GOOGLE_CLIENT_ID --body "your-google-client-id"
gh secret set GOOGLE_CLIENT_SECRET --body "your-google-client-secret"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

## 🌍 Environment Configuration

### Production Environment (main branch)
- **Authentication**: `--no-allow-unauthenticated` (requires Google IAM)
- **Resources**: 2 CPU, 2Gi memory
- **Scaling**: 1-100 instances, 1000 concurrency
- **Security**: Full authentication required

### Staging Environment (develop branch)
- **Authentication**: `--allow-unauthenticated` (for testing)
- **Resources**: 1 CPU, 1Gi memory
- **Scaling**: 0-10 instances, 80 concurrency
- **Security**: Open for testing

### Development Environment (other branches)
- **Authentication**: `--allow-unauthenticated` (for development)
- **Resources**: 1 CPU, 512Mi memory
- **Scaling**: 0-5 instances, 80 concurrency
- **Security**: Open for development

## 🔄 Deployment Flow

1. **Trigger**: Stage 1 completes successfully OR manual trigger
2. **Authentication**: Workload Identity Federation with Google Cloud
3. **Image Transfer**: Pull from GHCR → Push to GCR
4. **Deployment**: Deploy to Google Cloud Run with environment-specific config
5. **Verification**: Health checks and API endpoint testing
6. **Rollback**: Automatic rollback to previous revision if deployment fails
7. **Notification**: Slack notifications with deployment status

## 📊 Monitoring and Observability

### Health Checks
- **Endpoint**: `GET /health`
- **Frequency**: Every 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3 attempts

### Performance Monitoring
- Response time monitoring
- API endpoint accessibility checks
- Resource utilization tracking

### Logging
- Structured logging with environment context
- Request/response logging
- Error tracking and alerting

## 🚨 Rollback Strategy

### Automatic Rollback
- Triggered on deployment failure
- Rolls back to previous successful revision
- Maintains 100% traffic to previous version

### Manual Rollback
```bash
# List revisions
gcloud run revisions list --service api-outreach-service --region us-east1

# Rollback to specific revision
gcloud run services update-traffic api-outreach-service \
  --to-revisions REVISION_NAME=100 \
  --region us-east1
```

## 🔧 Troubleshooting

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

## 📈 Performance Optimization

### Resource Tuning
- Monitor CPU and memory usage
- Adjust instance limits based on traffic
- Optimize concurrency settings

### Cost Optimization
- Use appropriate instance sizes
- Set minimum instances to 0 for non-production
- Monitor and optimize resource allocation

## 🔒 Security Best Practices

1. **Use Workload Identity Federation** instead of service account keys
2. **Enable audit logging** for all operations
3. **Implement proper IAM roles** with least privilege
4. **Use HTTPS only** for all communications
5. **Regular security updates** for base images
6. **Monitor for security vulnerabilities** with Container Analysis

## 📝 Environment Variables

The following environment variables are automatically set during deployment:

- `NODE_ENV`: Environment name (production/staging/development)
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `GROWCHIEF_ENDPOINT`: GrowChief API endpoint
- `GROWCHIEF_API_KEY`: GrowChief API key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `ENVIRONMENT`: Deployment environment
- `VERSION`: Git commit SHA
- `DEPLOYED_AT`: Deployment timestamp

## 🎯 Next Steps

1. Set up the Google Cloud project and service account
2. Configure Workload Identity Federation
3. Add all required secrets to GitHub
4. Test the deployment pipeline
5. Monitor the first production deployment
6. Set up additional monitoring and alerting as needed
