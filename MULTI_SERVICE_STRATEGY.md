# Multi-Service API Strategy

## 🎯 **Recommended Approach: Single Project with Multiple Services**

### **Project Structure**
```
api-outreach-as-a-service (Google Cloud Project)
├── Environments
│   ├── dev-api-outreach-service
│   ├── staging-api-outreach-service  
│   └── prod-api-outreach-service
├── Shared Resources
│   ├── shared-database (Cloud SQL)
│   ├── shared-cache (Redis)
│   └── shared-storage (Cloud Storage)
└── Monitoring
    ├── centralized-logging
    └── unified-monitoring
```

### **Service URLs**
- **Dev**: `https://dev-api-outreach-service-xxx-uc.a.run.app`
- **Staging**: `https://staging-api-outreach-service-xxx-uc.a.run.app`
- **Prod**: `https://prod-api-outreach-service-xxx-uc.a.run.app`

## 🔧 **Implementation Steps**

### **Step 1: Update GitHub Actions for Multi-Environment**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Multiple Environments

on:
  push:
    branches: [ main, develop, staging ]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: 
          - ${{ github.ref == 'refs/heads/main' && 'prod' || '' }}
          - ${{ github.ref == 'refs/heads/staging' && 'staging' || '' }}
          - ${{ github.ref == 'refs/heads/develop' && 'dev' || '' }}
      fail-fast: false
    
    steps:
    - name: Deploy to ${{ matrix.environment }}
      if: matrix.environment != ''
      run: |
        gcloud run deploy api-outreach-${{ matrix.environment }} \
          --image gcr.io/${{ env.PROJECT_ID }}/api-outreach-service:${{ github.sha }} \
          --region ${{ env.REGION }} \
          --set-env-vars ENVIRONMENT=${{ matrix.environment }}
```

### **Step 2: Environment-Specific Configuration**

```typescript
// src/config/environment.ts
export const getEnvironmentConfig = () => {
  const env = process.env.ENVIRONMENT || 'dev';
  
  return {
    dev: {
      databaseUrl: process.env.DATABASE_URL_DEV,
      redisUrl: process.env.REDIS_URL_DEV,
      growchiefEndpoint: process.env.GROWCHIEF_ENDPOINT_DEV,
    },
    staging: {
      databaseUrl: process.env.DATABASE_URL_STAGING,
      redisUrl: process.env.REDIS_URL_STAGING,
      growchiefEndpoint: process.env.GROWCHIEF_ENDPOINT_STAGING,
    },
    prod: {
      databaseUrl: process.env.DATABASE_URL_PROD,
      redisUrl: process.env.REDIS_URL_PROD,
      growchiefEndpoint: process.env.GROWCHIEF_ENDPOINT_PROD,
    }
  }[env];
};
```

### **Step 3: Shared Resources Setup**

```bash
# Create shared database
gcloud sql instances create shared-database \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create shared Redis
gcloud redis instances create shared-cache \
  --size=1 \
  --region=us-central1
```

## 🔄 **Migration Strategy**

### **Phase 1: Development (Current)**
- All services in `api-outreach-as-a-service`
- Multiple environments (dev/staging/prod)
- Shared infrastructure

### **Phase 2: Service Separation (Future)**
When services are mature and need independent scaling:

```bash
# Create dedicated projects
gcloud projects create api-outreach-prod
gcloud projects create api-lead-management-prod
gcloud projects create api-analytics-prod

# Transfer services
gcloud run services export api-outreach-prod --format=yaml > outreach-config.yaml
gcloud config set project api-outreach-prod
gcloud run services replace outreach-config.yaml
```

### **Phase 3: Independent Operations**
- Each service in its own project
- Independent billing and scaling
- Service-specific monitoring

## 📊 **Cost Optimization**

### **Shared Resources**
- **Database**: One Cloud SQL instance for all environments
- **Cache**: One Redis instance for all environments  
- **Storage**: Shared Cloud Storage bucket
- **Monitoring**: Unified logging and metrics

### **Environment-Specific Scaling**
```bash
# Dev environment - minimal resources
gcloud run services update api-outreach-dev \
  --min-instances=0 \
  --max-instances=2 \
  --memory=512Mi

# Staging environment - moderate resources  
gcloud run services update api-outreach-staging \
  --min-instances=0 \
  --max-instances=5 \
  --memory=1Gi

# Prod environment - full resources
gcloud run services update api-outreach-prod \
  --min-instances=1 \
  --max-instances=20 \
  --memory=2Gi
```

## 🔒 **Security & Access Control**

### **Environment Isolation**
```bash
# Different service accounts per environment
gcloud iam service-accounts create api-outreach-dev-sa
gcloud iam service-accounts create api-outreach-staging-sa  
gcloud iam service-accounts create api-outreach-prod-sa

# Environment-specific IAM policies
gcloud projects add-iam-policy-binding api-outreach-as-a-service \
  --member="serviceAccount:api-outreach-dev-sa@api-outreach-as-a-service.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## 📈 **Monitoring & Observability**

### **Unified Monitoring**
```yaml
# All services use the same monitoring setup
monitoring:
  logging:
    destination: shared-logging-bucket
  metrics:
    destination: shared-metrics-dataset
  tracing:
    destination: shared-trace-collector
```

## 🚀 **Deployment Commands**

### **Deploy All Environments**
```bash
# Deploy to dev
git checkout develop
git push origin develop

# Deploy to staging  
git checkout staging
git push origin staging

# Deploy to prod
git checkout main
git push origin main
```

### **Deploy Specific Service**
```bash
# Deploy only outreach service to prod
gcloud run deploy api-outreach-prod \
  --image gcr.io/api-outreach-as-a-service/api-outreach-service:latest \
  --region us-central1
```

## 🔧 **GitHub Secrets for Multi-Environment**

### **Required Secrets**
```
GCP_PROJECT_ID=api-outreach-as-a-service
GCP_SA_KEY=<service-account-json>

# Environment-specific secrets
DATABASE_URL_DEV=postgresql://dev-user:pass@host:5432/dev-db
DATABASE_URL_STAGING=postgresql://staging-user:pass@host:5432/staging-db  
DATABASE_URL_PROD=postgresql://prod-user:pass@host:5432/prod-db

REDIS_URL_DEV=redis://dev-host:6379
REDIS_URL_STAGING=redis://staging-host:6379
REDIS_URL_PROD=redis://prod-host:6379

GROWCHIEF_ENDPOINT_DEV=https://dev-api.growchief.com
GROWCHIEF_ENDPOINT_STAGING=https://staging-api.growchief.com
GROWCHIEF_ENDPOINT_PROD=https://api.growchief.com
```

## 🎯 **Benefits of This Approach**

1. **Cost Effective**: Shared infrastructure reduces costs
2. **Easy Management**: All services in one place
3. **Flexible**: Easy to separate services later
4. **Scalable**: Independent scaling per environment
5. **Secure**: Environment isolation with shared resources
6. **Maintainable**: Unified monitoring and logging

---

**Next Steps**: Implement this strategy and you can always migrate individual services to dedicated projects when they mature!
