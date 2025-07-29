# Vuebie Deployment Guide

This document provides detailed instructions for deploying the Vuebie platform in various environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Cloud Deployment Options](#cloud-deployment-options)
5. [Local Development Environment](#local-development-environment)
6. [Continuous Integration/Deployment](#continuous-integrationdeployment)
7. [Database Migration](#database-migration)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

## Deployment Overview

Vuebie consists of several components that need to be deployed:

1. **Frontend Application**: Next.js React application
2. **Backend API Services**: Node.js services
3. **Database**: PostgreSQL database (via Supabase)
4. **Storage**: Object storage for videos and generated assets
5. **AI Processing Pipeline**: Video analysis services
6. **Authentication Services**: User authentication and authorization

### Deployment Architecture

![Vuebie Deployment Architecture](/data/chats/ff0fcd8bc5d04025b1eadb7e5f7bc5ec/workspace/aivue-v2/docs/assets/deployment_architecture.png)

## Prerequisites

Before deploying Vuebie, ensure you have:

- Access to your cloud provider account (AWS, GCP, Azure, or Vercel)
- Proper IAM permissions to create necessary resources
- Supabase project created (or PostgreSQL database configured)
- Domain name configured with DNS provider
- SSL certificates for secure HTTPS connections
- API keys for third-party services (if applicable)

### Required Tools

- Node.js (v18+)
- npm (v9+) or Yarn (v1.22+)
- Git
- Docker and Docker Compose (for local development)
- Terraform (optional, for infrastructure as code)
- CI/CD platform access (GitHub Actions, GitLab CI, etc.)

## Environment Configuration

Vuebie uses environment variables for configuration. Create appropriate `.env` files for each environment:

### Core Environment Variables

```bash
# Application
VITE_APP_ENV=production  # (development, staging, production)
VITE_APP_URL=https://app.vuebie.com
VITE_APP_NAME=Vuebie

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server-side operations only

# Storage Configuration
VITE_STORAGE_PROVIDER=s3  # (s3, gcs, azure)
VITE_STORAGE_REGION=us-west-2
VITE_STORAGE_BUCKET=vuebie-media-production
VITE_STORAGE_ACCESS_KEY=your_access_key
VITE_STORAGE_SECRET_KEY=your_secret_key

# API Configuration
VITE_API_BASE_URL=/api

# AI Services
VITE_AI_SERVICE_ENDPOINT=your_ai_service_endpoint
VITE_AI_SERVICE_API_KEY=your_ai_service_api_key

# Optional Integrations
VITE_SMTP_HOST=smtp.provider.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_smtp_user
VITE_SMTP_PASSWORD=your_smtp_password
VITE_SMTP_FROM_EMAIL=no-reply@vuebie.com

VITE_ANALYTICS_ID=your_analytics_id
```

### Environment Specific Configurations

Create separate files for each environment:
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Cloud Deployment Options

### Vercel (Recommended for Frontend)

1. Connect your Git repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy using the following settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

```bash
# Deploy using Vercel CLI
vercel --prod
```

### AWS Deployment

#### Prerequisites
- AWS CLI configured with appropriate permissions
- ECR repository created for container images
- S3 bucket for static assets
- RDS PostgreSQL database (if not using Supabase)

#### Deployment Steps

1. Build the application:
```bash
npm run build
```

2. Build and push Docker image:
```bash
docker build -t vuebie-app:latest .
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-west-2.amazonaws.com
docker tag vuebie-app:latest your-account-id.dkr.ecr.us-west-2.amazonaws.com/vuebie-app:latest
docker push your-account-id.dkr.ecr.us-west-2.amazonaws.com/vuebie-app:latest
```

3. Update ECS service or deploy to Elastic Beanstalk:
```bash
aws ecs update-service --cluster vuebie-cluster --service vuebie-service --force-new-deployment
```

### Google Cloud Platform

#### Prerequisites
- Google Cloud SDK configured
- Container Registry access
- Cloud SQL PostgreSQL instance (if not using Supabase)

#### Deployment Steps

1. Build and push Docker image:
```bash
docker build -t gcr.io/your-project/vuebie-app:latest .
docker push gcr.io/your-project/vuebie-app:latest
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy vuebie-app \
  --image gcr.io/your-project/vuebie-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure

#### Prerequisites
- Azure CLI configured
- Azure Container Registry access
- Azure Database for PostgreSQL (if not using Supabase)

#### Deployment Steps

1. Build and push Docker image:
```bash
docker build -t vuebie-app:latest .
az acr login --name vuebieregistry
docker tag vuebie-app:latest vuebieregistry.azurecr.io/vuebie-app:latest
docker push vuebieregistry.azurecr.io/vuebie-app:latest
```

2. Deploy to Azure App Service:
```bash
az webapp create --resource-group vuebie-resources --plan vuebie-app-plan --name vuebie-app --deployment-container-image-name vuebieregistry.azurecr.io/vuebie-app:latest
```

## Local Development Environment

For local development:

1. Clone the repository:
```bash
git clone https://github.com/vuebie/vuebie-platform.git
cd vuebie-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with appropriate values

4. Start the development server:
```bash
npm run dev
```

### Docker-based Development Environment

We also provide a Docker Compose setup for development:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start:
- Next.js application
- Local PostgreSQL database
- MinIO for local S3-compatible storage
- Mock AI service for development

## Continuous Integration/Deployment

### GitHub Actions

We use GitHub Actions for CI/CD. The workflows are defined in `.github/workflows/`:

#### CI Workflow

The CI workflow runs on pull requests to validate changes:

```yaml
name: CI

on:
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

#### CD Workflow

The CD workflow deploys to the appropriate environment:

```yaml
name: Deploy

on:
  push:
    branches: [main, staging, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Database Migration

Vuebie uses Supabase migrations for database schema management.

### Running Migrations

```bash
# Apply migrations
npx supabase db push

# Generate migration from changes
npx supabase db diff --schema public > supabase/migrations/$(date +%Y%m%d%H%M%S)_your_migration_name.sql
```

### Backup and Restore

Always create a backup before significant changes:

```bash
# Backup database
npx supabase db dump -f backup.sql

# Restore from backup
npx supabase db restore -f backup.sql
```

## Post-Deployment Verification

After deployment, verify the system is working correctly:

### Automated Tests

```bash
# Run end-to-end tests against deployed environment
npm run test:e2e -- --url=https://app.vuebie.com
```

### Manual Verification Checklist

1. **Authentication**:
   - Sign up process works
   - Login works
   - Password reset works
   - OAuth providers work (if configured)

2. **Core Features**:
   - Project creation works
   - Video upload works
   - Video processing works
   - Analysis jobs run correctly
   - Reports can be generated

3. **Integrations**:
   - Verify webhooks fire correctly
   - Check email notifications
   - Confirm analytics tracking

## Monitoring and Maintenance

### Monitoring Tools

- **Application Monitoring**: Datadog or New Relic
- **Error Tracking**: Sentry
- **Log Management**: CloudWatch Logs or ELK stack
- **Performance Monitoring**: Lighthouse and PageSpeed Insights

### Health Checks

Configure health check endpoints for monitoring system status:

- `/api/health` - API health status
- `/api/health/db` - Database connectivity
- `/api/health/storage` - Storage connectivity
- `/api/health/ai` - AI services connectivity

### Scheduled Maintenance

- Database optimizations (weekly)
- Storage cleanup (monthly)
- Security updates (as needed)
- Feature deployments (scheduled sprints)

## Rollback Procedures

In case of deployment issues, follow these rollback procedures:

### Frontend Rollback

```bash
# Revert to previous deployment on Vercel
vercel rollback

# OR manually redeploy specific version
git checkout v1.2.3
vercel --prod
```

### Database Rollback

```bash
# Revert most recent migration
npx supabase db reset --db-url=$DATABASE_URL
npx supabase db push --migrations-path=./supabase/migrations/before-problematic-migration
```

### Container Rollback

```bash
# Roll back to previous container version (AWS)
aws ecs update-service --cluster vuebie-cluster --service vuebie-service --task-definition vuebie-app:123

# Roll back to previous container version (GCP)
gcloud run services update vuebie-app --image gcr.io/your-project/vuebie-app:previous-version
```

## Troubleshooting

### Common Deployment Issues

#### Database Connection Issues

**Symptoms**: API returns database connection errors, 500 status codes

**Solutions**:
- Verify database credentials in environment variables
- Check network access to database (security groups, firewall rules)
- Verify database service is running
- Check connection pool configuration

#### Storage Access Issues

**Symptoms**: Video uploads fail, images don't load

**Solutions**:
- Verify storage credentials in environment variables
- Check bucket permissions
- Verify CORS configuration for frontend access
- Test storage service directly using CLI tools

#### Build Failures

**Symptoms**: CI/CD pipeline fails during build step

**Solutions**:
- Check for TypeScript errors
- Verify dependency versions
- Check for missing environment variables needed at build time
- Examine build logs for specific error messages

### Support Resources

For deployment assistance:

- Internal Documentation: [Vuebie DevOps Wiki](https://wiki.vuebie.com/devops)
- Support Email: devops@vuebie.com
- Emergency Contact: ops-emergency@vuebie.com or +1-800-VUE-HELP