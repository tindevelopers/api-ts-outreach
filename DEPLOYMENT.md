# Deployment Guide

This guide explains how to deploy the API Outreach Service to Google Cloud Run using GitHub Actions.

## Prerequisites

1. **Google Cloud Project**
   - Create a Google Cloud Project
   - Enable the following APIs:
     - Cloud Run API
     - Container Registry API
     - Cloud Build API

2. **Service Account**
   - Create a service account with the following roles:
     - Cloud Run Admin
     - Storage Admin
     - Cloud Build Editor
   - Generate and download the service account key JSON

3. **GitHub Repository**
   - Fork or clone this repository
   - Set up the required secrets

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

### Required Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `my-outreach-project` |
| `GCP_SA_KEY` | Service Account JSON key | `{"type": "service_account", ...}` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `OUTREACH_API_ENDPOINT` | Outreach API endpoint | `https://outreach.example.com` |
| `OUTREACH_API_KEY` | Outreach API key | `your-outreach-api-key` |

### Optional Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SNYK_TOKEN` | Snyk security scan token | `your-snyk-token` |

## Deployment Process

### Automatic Deployment

The service automatically deploys when:
- Code is pushed to the `main` branch
- All tests pass
- Security scans complete successfully

### Manual Deployment

1. **Trigger deployment via GitHub Actions:**
   - Go to Actions tab in your repository
   - Select "Deploy to Google Cloud Run" workflow
   - Click "Run workflow"

2. **Deploy using gcloud CLI:**
   ```bash
   # Authenticate with Google Cloud
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   
   # Build and deploy
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/api-outreach-service .
   gcloud run deploy api-outreach-service \
     --image gcr.io/YOUR_PROJECT_ID/api-outreach-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Environment Configuration

### Development Environment

For local development, use the provided Docker Compose setup:

```bash
# Copy environment file
cp env.example .env

# Start services
docker-compose up -d

# Run the application
npm run dev
```

### Production Environment

The production environment is automatically configured through GitHub Actions with the following settings:

- **Memory**: 1GB
- **CPU**: 1 vCPU
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300 seconds
- **Concurrency**: 80 requests per instance

## Monitoring and Logging

### Health Checks

The service includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-18T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Logging

Logs are automatically collected by Google Cloud Logging and can be viewed in:
- Google Cloud Console → Logging
- Cloud Run service → Logs tab

### Monitoring

Set up monitoring in Google Cloud Console:
1. Go to Cloud Run → your service → Monitoring
2. Configure alerts for:
   - High error rates
   - High latency
   - Low availability

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check GitHub Actions logs
   - Verify all secrets are set correctly
   - Ensure service account has proper permissions

2. **Service Won't Start**
   - Check Cloud Run logs
   - Verify environment variables
   - Test health endpoint

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database accessibility from Cloud Run
   - Ensure proper network configuration

### Debugging Commands

```bash
# View service logs
gcloud run services logs read api-outreach-service --region=us-central1

# Check service status
gcloud run services describe api-outreach-service --region=us-central1

# Test health endpoint
curl https://your-service-url/health
```

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to the repository
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement rate limiting

3. **Access Control**
   - Use strong API keys
   - Implement proper authentication
   - Monitor for suspicious activity

## Scaling Configuration

To modify scaling settings, update the deployment workflow or use gcloud:

```bash
gcloud run services update api-outreach-service \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=20 \
  --cpu-throttling
```

## Cost Optimization

1. **Set appropriate min/max instances**
2. **Use CPU throttling for cost savings**
3. **Monitor usage patterns**
4. **Set up billing alerts**

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run logs
3. Verify configuration
4. Contact support team

---

**Note**: This deployment guide assumes you have the necessary Google Cloud permissions and GitHub repository access.
