# GitHub Secrets Setup Guide

## 🔐 Required GitHub Secrets for Deployment

You need to set up these secrets in your GitHub repository for the deployment to work properly.

### 📋 Secret Values

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `WIF_PROVIDER` | `projects/312998856461/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` | Workload Identity Federation Provider |
| `WIF_SERVICE_ACCOUNT` | `github-actions@api-outreach-as-a-service.iam.gserviceaccount.com` | Google Cloud Service Account |
| `REDIS_URL` | `redis://your-redis-host:6379` | Redis connection string |
| `JWT_SECRET` | `your-jwt-secret-key` | JWT signing secret (32+ characters) |
| `OUTREACH_API_ENDPOINT` | `https://api.outreach.example.com` | Your outreach API endpoint |
| `OUTREACH_API_KEY` | `your-outreach-api-key` | Your outreach API key |
| `GOOGLE_CLIENT_ID` | `your-google-client-id` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | Google OAuth client secret |

## 🚀 How to Set Up Secrets

### Method 1: Using GitHub CLI (Recommended)

```bash
# Set Workload Identity Federation secrets
gh secret set WIF_PROVIDER --body "projects/312998856461/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"

# Set application secrets (update with your actual values)
gh secret set REDIS_URL --body "redis://your-redis-host:6379"
gh secret set JWT_SECRET --body "your-jwt-secret-key-32-characters-long"
gh secret set OUTREACH_API_ENDPOINT --body "https://api.outreach.example.com"
gh secret set OUTREACH_API_KEY --body "your-outreach-api-key"
gh secret set GOOGLE_CLIENT_ID --body "your-google-client-id"
gh secret set GOOGLE_CLIENT_SECRET --body "your-google-client-secret"
```

### Method 2: Using GitHub Web Interface

1. Go to your repository: `https://github.com/tindevelopers/api-ts-outreach`
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value from the table above

## 🔄 Update Existing Secrets

You may need to update these existing secrets:

```bash
# Update old GrowChief secrets to new Outreach API secrets
gh secret set OUTREACH_API_ENDPOINT --body "https://api.outreach.example.com"
gh secret set OUTREACH_API_KEY --body "your-outreach-api-key"

# Remove old secrets if they exist
gh secret delete GROWCHIEF_ENDPOINT
gh secret delete GROWCHIEF_API_KEY
```

## ✅ Verification

After setting up the secrets, you can verify they're set correctly:

```bash
gh secret list
```

You should see all the required secrets listed.

## 🚀 Trigger Deployment

Once all secrets are set up, you can trigger deployment by:

1. **Push to main branch** (automatic trigger)
2. **Manual trigger** via GitHub Actions tab
3. **Pull request** to main branch

## 🔧 Troubleshooting

### GitHub CLI Authentication Issues

If you get authentication errors:

```bash
# Clear any existing tokens
unset GITHUB_TOKEN

# Re-authenticate with proper scopes
gh auth login --scopes repo,admin:org
```

### Permission Issues

Make sure your GitHub token has the following scopes:
- `repo` (Full control of private repositories)
- `admin:org` (Full control of orgs and teams)

## 📊 Current Status

- ✅ **Google Cloud**: Fully configured and ready
- ✅ **Docker**: Working perfectly
- ✅ **GitHub Actions**: Ready to deploy
- ⏳ **GitHub Secrets**: Need to be configured
- ⏳ **Deployment**: Ready to trigger once secrets are set

## 🎯 Next Steps

1. Set up all the GitHub secrets using one of the methods above
2. Update the placeholder values with your actual configuration
3. Trigger deployment by pushing to main or manually via Actions tab
4. Monitor the deployment in the GitHub Actions tab

The system is ready for production deployment once the secrets are configured! 🚀
