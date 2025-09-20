# API Outreach as a Service

A TypeScript-based API service for social media outreach automation, built on top of the GrowChief automation engine and designed for deployment on Google Cloud Run.

## 🚀 Features

- **Multi-platform Support**: LinkedIn, Twitter, Facebook, Instagram
- **Campaign Management**: Create, manage, and monitor outreach campaigns
- **Lead Management**: Import, organize, and track leads
- **Workflow Automation**: Define custom automation workflows
- **Rate Limiting**: Built-in rate limiting and concurrency control
- **Analytics**: Comprehensive campaign and lead analytics
- **API Authentication**: JWT and API key authentication
- **Cloud Ready**: Optimized for Google Cloud Run deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Campaign API   │    │  GrowChief      │
│   (Express.js)  │────│  (TypeScript)   │────│  (Automation)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   Cloud Run     │
│   (Database)    │    │    (Cache)      │    │ (Deployment)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Google Cloud SDK (for deployment)
- PostgreSQL (for production)
- Redis (for caching and rate limiting)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd api-outreach-as-a-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Build and run locally**
   ```bash
   npm run build
   npm start
   ```

### Production Deployment

1. **Build the Docker image**
   ```bash
   docker build -t api-outreach-service .
   ```

2. **Deploy to Google Cloud Run**
   ```bash
   gcloud run deploy api-outreach-service \
     --image gcr.io/YOUR_PROJECT_ID/api-outreach-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OUTREACH_API_ENDPOINT` | Outreach API endpoint | Required |
| `OUTREACH_API_KEY` | Outreach API key | Required |

### API Configuration

- **Rate Limiting**: 100 requests per 15 minutes per user
- **Request Size**: 10MB maximum
- **Timeout**: 30 seconds for external API calls
- **CORS**: Configurable origins

## 📚 API Documentation

### Authentication

All API endpoints require authentication via:
- **API Key**: `Authorization: Bearer ak_your_api_key`
- **JWT Token**: `Authorization: Bearer jwt_token`

### Core Endpoints

#### Campaigns
```http
POST   /api/v1/campaigns              # Create campaign
GET    /api/v1/campaigns              # List campaigns
GET    /api/v1/campaigns/:id          # Get campaign
PUT    /api/v1/campaigns/:id          # Update campaign
DELETE /api/v1/campaigns/:id          # Delete campaign
POST   /api/v1/campaigns/:id/start    # Start campaign
POST   /api/v1/campaigns/:id/pause    # Pause campaign
```

#### Leads
```http
POST   /api/v1/leads                  # Add leads
GET    /api/v1/leads                  # List leads
PUT    /api/v1/leads/:id              # Update lead
DELETE /api/v1/leads/:id              # Remove lead
```

#### Analytics
```http
GET    /api/v1/analytics/campaigns    # Campaign metrics
GET    /api/v1/analytics/leads        # Lead statistics
```

### Example Requests

#### Create Campaign
```bash
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Authorization: Bearer ak_demo123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LinkedIn Outreach Q1",
    "description": "Q1 LinkedIn outreach campaign",
    "platform": "linkedin",
    "settings": {
      "workingHours": {
        "start": "09:00",
        "end": "17:00",
        "timezone": "UTC",
        "weekdays": [1,2,3,4,5]
      },
      "rateLimiting": {
        "maxConnectionsPerDay": 50,
        "maxMessagesPerDay": 25,
        "delayBetweenActions": 60000
      },
      "personalization": {
        "useCustomMessages": true,
        "messageTemplates": ["Hello {{name}}, I noticed..."],
        "includeCompanyInfo": true
      }
    }
  }'
```

## 🔍 Monitoring & Logging

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
- **Development**: Console output with colors
- **Production**: JSON format with file rotation
- **Levels**: error, warn, info, debug

### Metrics
- Request/response times
- Error rates
- Campaign performance
- Lead conversion rates

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Google Cloud Run

1. **Configure Cloud Run**
   ```bash
   # Set environment variables
   gcloud run services update api-outreach-service \
     --set-env-vars="NODE_ENV=production,DATABASE_URL=your-db-url"
   ```

2. **Set up monitoring**
   ```bash
   # Enable Cloud Monitoring
   gcloud services enable monitoring.googleapis.com
   ```

3. **Configure autoscaling**
   ```bash
   gcloud run services update api-outreach-service \
     --min-instances=1 \
     --max-instances=10 \
     --cpu-throttling
   ```

### Environment-Specific Configs

- **Development**: Local Docker Compose setup
- **Staging**: Cloud Run with test database
- **Production**: Cloud Run with production database and monitoring

## 🔒 Security

- **Authentication**: JWT and API key based
- **Rate Limiting**: Per-user request limits
- **Input Validation**: Joi schema validation
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers
- **HTTPS**: Enforced in production

## 📈 Performance

- **Connection Pooling**: PostgreSQL connection management
- **Caching**: Redis for session and rate limit data
- **Compression**: Gzip response compression
- **Health Checks**: Built-in health monitoring
- **Graceful Shutdown**: Proper cleanup on termination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [API Docs](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: support@example.com

---

**Built with ❤️ using TypeScript, Express.js, and GrowChief**
# Trigger deployment - Thu Sep 18 16:58:36 CEST 2025
# Test deployment
