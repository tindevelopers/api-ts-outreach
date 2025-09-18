# GitHub Secrets Setup Guide

This guide will help you configure the required GitHub secrets for successful deployment to Google Cloud Run.

## 🔧 Required GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. Google Cloud Configuration

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `endless-station-471909-a8` |
| `GCP_SA_KEY` | Service Account JSON Key | Generated from Google Cloud Console |

### 2. Database Configuration

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |

### 3. Application Configuration

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secret-jwt-key-32-chars` |
| `GROWCHIEF_ENDPOINT` | GrowChief API endpoint | `https://growchief.example.com` |
| `GROWCHIEF_API_KEY` | GrowChief API key | `your-growchief-api-key` |

### 4. Optional Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SNYK_TOKEN` | Snyk security scan token | `your-snyk-token` |

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID**

### Step 2: Enable Required APIs

Run these commands in Google Cloud Shell or with gcloud CLI:

```bash
# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --description="Service account for GitHub Actions deployment"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"
```

### Step 4: Generate Service Account Key

```bash
# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Copy the contents of github-actions-key.json
cat github-actions-key.json
```

### Step 5: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret:

#### GCP_PROJECT_ID
- **Name**: `GCP_PROJECT_ID`
- **Value**: Your Google Cloud Project ID (e.g., `my-outreach-project-123`)

#### GCP_SA_KEY
- **Name**: `GCP_SA_KEY`
- **Value**: The entire JSON content from `github-actions-key.json`

#### DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://username:password@host:5432/database_name`

#### REDIS_URL
- **Name**: `REDIS_URL`
- **Value**: `redis://username:password@host:6379`

#### JWT_SECRET
- **Name**: `JWT_SECRET`
- **Value**: Generate a secure 32+ character string (e.g., `my-super-secret-jwt-key-32-chars-long`)

#### GROWCHIEF_ENDPOINT
- **Name**: `GROWCHIEF_ENDPOINT`
- **Value**: Your GrowChief API endpoint (e.g., `https://api.growchief.com`)

#### GROWCHIEF_API_KEY
- **Name**: `GROWCHIEF_API_KEY`
- **Value**: Your GrowChief API key

### Step 6: Set Up Database (Optional)

For a complete setup, you'll need:

1. **PostgreSQL Database**:
   - Use Google Cloud SQL
   - Or external PostgreSQL service
   - Create database and user

2. **Redis Instance**:
   - Use Google Cloud Memorystore
   - Or external Redis service

### Step 7: Test Deployment

1. Push a commit to the `main` branch
2. Go to **Actions** tab in your repository
3. Watch the "Deploy to Google Cloud Run" workflow
4. Check the deployment logs

## 🔍 Troubleshooting

### Common Issues

1. **"Permission denied" errors**:
   - Verify service account has correct roles
   - Check GCP_SA_KEY format

2. **"Project not found" errors**:
   - Verify GCP_PROJECT_ID is correct
   - Ensure project exists and APIs are enabled

3. **Database connection errors**:
   - Verify DATABASE_URL format
   - Check database accessibility from Cloud Run

4. **Build failures**:
   - Check GitHub Actions logs
   - Verify all secrets are set correctly

### Verification Commands

```bash
# Test service account permissions
gcloud auth activate-service-account --key-file=github-actions-key.json
gcloud projects describe YOUR_PROJECT_ID

# Test database connection
psql "postgresql://user:pass@host:5432/db" -c "SELECT 1;"

# Test Redis connection
redis-cli -h host -p 6379 ping
```

## 📋 Secret Checklist

- [ ] `GCP_PROJECT_ID` - Google Cloud Project ID
- [ ] `GCP_SA_KEY` - Service Account JSON key
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `GROWCHIEF_ENDPOINT` - GrowChief API endpoint
- [ ] `GROWCHIEF_API_KEY` - GrowChief API key
- [ ] `SNYK_TOKEN` - Snyk token (optional)

## 🚨 Security Notes

1. **Never commit secrets to code**
2. **Rotate secrets regularly**
3. **Use least-privilege access**
4. **Monitor service account usage**
5. **Enable audit logging**

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify all secrets are correctly set
3. Test individual components
4. Contact support team

---

**Next Step**: Once all secrets are configured, push a commit to trigger the deployment!
