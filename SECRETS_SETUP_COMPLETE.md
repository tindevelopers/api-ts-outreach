# 🔐 Complete Secrets Setup Guide

## 📋 **Exact Values You Need**

Here are the **exact commands** to set up all your GitHub secrets:

### **1. Workload Identity Federation (Already Configured)**
```bash
gh secret set WIF_PROVIDER --body "projects/312998856461/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"
```

### **2. Redis Configuration**
```bash
# For development (local Redis)
gh secret set REDIS_URL --body "redis://localhost:6379"

# For production (Google Cloud Memorystore)
# gh secret set REDIS_URL --body "redis://10.x.x.x:6379"
```

### **3. JWT Secret (Generated for You)**
```bash
gh secret set JWT_SECRET --body "6N8Soo+Qur5R3FYFZNs5FiQgq2/lHjEg8oUaZBw1ZqM="
```

### **4. Outreach API Configuration (Your Own System)**
```bash
# For development
gh secret set OUTREACH_API_ENDPOINT --body "http://localhost:3000"

# For production (will be your Google Cloud Run URL)
gh secret set OUTREACH_API_ENDPOINT --body "https://api-outreach-as-a-service-xxxxx-uc.a.run.app"

# Your API key (generate your own)
gh secret set OUTREACH_API_KEY --body "a44660a08fc1fde79446df533acc787d"
```

### **5. Google OAuth (You Need to Create These)**
```bash
# You need to create these in Google Cloud Console
gh secret set GOOGLE_CLIENT_ID --body "YOUR_GOOGLE_CLIENT_ID"
gh secret set GOOGLE_CLIENT_SECRET --body "YOUR_GOOGLE_CLIENT_SECRET"
```

## 🚀 **Quick Setup Commands**

Run these commands to set up all secrets:

```bash
# Set all secrets at once
gh secret set WIF_PROVIDER --body "projects/312998856461/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
gh secret set WIF_SERVICE_ACCOUNT --body "github-actions@api-outreach-as-a-service.iam.gserviceaccount.com"
gh secret set REDIS_URL --body "redis://localhost:6379"
gh secret set JWT_SECRET --body "6N8Soo+Qur5R3FYFZNs5FiQgq2/lHjEg8oUaZBw1ZqM="
gh secret set OUTREACH_API_ENDPOINT --body "http://localhost:3000"
gh secret set OUTREACH_API_KEY --body "a44660a08fc1fde79446df533acc787d"
gh secret set GOOGLE_CLIENT_ID --body "YOUR_GOOGLE_CLIENT_ID"
gh secret set GOOGLE_CLIENT_SECRET --body "YOUR_GOOGLE_CLIENT_SECRET"
```

## 🔧 **Where to Get Each Secret**

### **REDIS_URL**
- **Development**: `redis://localhost:6379` (if you have Redis installed locally)
- **Production**: Use Google Cloud Memorystore or Redis Cloud
- **Docker**: `redis://redis:6379` (if using docker-compose)

### **JWT_SECRET**
- **Generated for you**: `6N8Soo+Qur5R3FYFZNs5FiQgq2/lHjEg8oUaZBw1ZqM=`
- **Alternative**: Generate your own with `openssl rand -base64 32`

### **OUTREACH_API_ENDPOINT**
- **Development**: `http://localhost:3000`
- **Production**: Your Google Cloud Run URL (will be generated after deployment)
- **Custom Domain**: `https://your-domain.com`

### **OUTREACH_API_KEY**
- **Generated for you**: `a44660a08fc1fde79446df533acc787d`
- **Alternative**: Generate your own with `openssl rand -hex 16`

### **GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET**
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Select project: `api-outreach-as-a-service`
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://your-domain.com/auth/google/callback`

## ⚡ **For Immediate Testing**

If you want to test the deployment immediately, you can use these placeholder values:

```bash
# Set up with placeholder values for testing
gh secret set GOOGLE_CLIENT_ID --body "placeholder-client-id"
gh secret set GOOGLE_CLIENT_SECRET --body "placeholder-client-secret"
```

## ✅ **Verification**

After setting up all secrets, verify they're configured:

```bash
gh secret list
```

You should see all 8 secrets listed.

## 🚀 **Deploy Now**

Once all secrets are set up, the deployment will be triggered automatically when you push to main, or you can manually trigger it via the GitHub Actions tab.

## 📊 **Current Status**
- ✅ **Google Cloud**: Fully configured
- ✅ **Docker**: Working perfectly
- ✅ **GitHub Actions**: Ready to deploy
- ✅ **Secrets Guide**: Complete with exact values
- ⏳ **Your Action**: Set up the secrets and deploy!

The system is ready for production deployment! 🚀
