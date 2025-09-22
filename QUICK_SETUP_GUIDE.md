# Quick Setup Guide - GitHub Secrets Configuration

This guide will help you quickly configure all GitHub secrets using the GitHub CLI script.

## 🚀 Prerequisites

1. **Install GitHub CLI** (if not already installed):
   ```bash
   # macOS
   brew install gh
   
   # Linux/Windows
   # Visit: https://cli.github.com/manual/installation
   ```

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

3. **Get your Google Cloud project number**:
   ```bash
   gcloud projects describe api-outreach-as-a-service --format='value(projectNumber)'
   ```

## 🔐 Run the Setup Script

1. **Navigate to your project directory**:
   ```bash
   cd "/Users/gene/Library/CloudStorage/OneDrive-TheInformationNetworkLtd/@ Programming/Google Cloud Run/api-ts-outreach"
   ```

2. **Run the setup script**:
   ```bash
   ./setup-github-secrets-cli.sh
   ```

3. **Follow the interactive prompts**:
   - Enter your Google Cloud project number
   - Provide values for each required secret
   - Skip optional secrets if not needed

## 📋 Required Secrets

The script will prompt you for these secrets:

### Google Cloud Authentication
- **WIF_PROVIDER**: Automatically generated from your project number
- **WIF_SERVICE_ACCOUNT**: Automatically set to `github-actions@api-outreach-as-a-service.iam.gserviceaccount.com`

### Application Secrets
- **REDIS_URL**: Redis connection string (e.g., `redis://your-redis-instance:6379`)
- **JWT_SECRET**: JWT signing secret (use a strong, random string)

### API Configuration
- **OUTREACH_API_ENDPOINT**: Outreach API endpoint URL
- **OUTREACH_API_KEY**: Outreach API authentication key

### Google OAuth
- **GOOGLE_CLIENT_ID**: Google OAuth client ID
- **GOOGLE_CLIENT_SECRET**: Google OAuth client secret

### Optional
- **SLACK_WEBHOOK_URL**: Slack webhook for notifications (optional)
- **SNYK_TOKEN**: Snyk security scan token (optional)

## ✅ Verification

After running the script, verify your secrets:

```bash
# List all configured secrets
gh secret list

# Check specific secret (shows if it exists, not the value)
gh secret get WIF_PROVIDER
```

## 🚀 Test Deployment

1. **Make a small change and push**:
   ```bash
   git add .
   git commit -m "Test deployment setup"
   git push origin main
   ```

2. **Monitor the deployment**:
   - Go to: https://github.com/YOUR_USERNAME/api-ts-outreach/actions
   - Watch the "Stage 1 - Docker & Code Quality Pipeline" run first
   - Then watch "Stage 2 - Google Cloud Run Deployment Pipeline"

3. **Check the deployed service**:
   - Google Cloud Console: https://console.cloud.google.com/run?project=api-outreach-as-a-service
   - Test health endpoint: `curl https://your-service-url/health`

## 🆘 Troubleshooting

### If the script fails:

1. **Check GitHub CLI authentication**:
   ```bash
   gh auth status
   ```

2. **Verify you're in the correct repository**:
   ```bash
   gh repo view
   ```

3. **Check if secrets already exist**:
   ```bash
   gh secret list
   ```

### If deployment fails:

1. **Check GitHub Actions logs** for specific error messages
2. **Verify Google Cloud project setup**:
   ```bash
   gcloud config set project api-outreach-as-a-service
   gcloud services list --enabled
   ```

3. **Check service account permissions** in Google Cloud Console

## 📞 Need Help?

- Check the detailed setup guide: `GITHUB_SECRETS_SETUP_FINAL.md`
- Review GitHub Actions workflows in `.github/workflows/`
- Check Google Cloud Console for deployment status

---

**Ready to deploy!** 🚀 Your GitHub Actions will automatically deploy to `api-outreach-as-a-service` when you push to the main branch.
