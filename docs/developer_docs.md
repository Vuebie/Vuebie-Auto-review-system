# Vuebie Developer Documentation

## Introduction

This document provides comprehensive technical documentation for developers working with the Vuebie codebase. It covers the architecture, key components, development workflows, and best practices for extending and maintaining the Vuebie platform.

## Architecture Overview

Vuebie is built as a modern web application with the following architecture:

### Tech Stack

- **Frontend**: Next.js (React), TypeScript, Tailwind CSS
- **Backend**: Node.js API services
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Video Processing**: Custom processing pipeline built on AWS
- **ML/AI Services**: Custom TensorFlow models with AWS SageMaker

### Application Structure

The Vuebie application follows a modular architecture:

```
vuebie/
├── public/                # Static assets
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable React components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and services
│   ├── styles/           # Global styles
│   └── types/            # TypeScript type definitions
├── tests/                # Test files
├── docs/                 # Documentation
└── scripts/              # Build and maintenance scripts
```

### Key Components

1. **Authentication System**: Manages user sessions, permissions, and organization access
2. **Project Management**: Handles organization and project data structures
3. **Video Processing Pipeline**: Manages video uploads, processing, and storage
4. **Analysis Engine**: Core AI/ML processing for video content analysis
5. **Report Generator**: Creates insights and visualizations from analysis results

## Development Environment Setup

### Prerequisites

- Node.js (v18+)
- npm (v9+) or yarn (v1.22+)
- Docker Desktop (for local database and services)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vuebie/vuebie-platform.git
   cd vuebie-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with appropriate values (see Environment Configuration section)

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Environment Configuration

The following environment variables are required:

```
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Video Processing
VIDEO_PROCESSING_API_URL=your_processing_api_url
VIDEO_PROCESSING_API_KEY=your_processing_api_key

# AI Services
AI_SERVICE_ENDPOINT=your_ai_service_endpoint
AI_SERVICE_API_KEY=your_ai_service_api_key

# Optional Integrations
ANALYTICS_ID=your_analytics_id
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit following conventional commit format:
   ```bash
   git commit -m "feat: add new analysis visualization"
   ```

3. Run tests:
   ```bash
   npm run test
   # or
   yarn test
   ```

4. Create a pull request to `main` branch

## Core Modules

### Authentication Module

The authentication system uses Supabase Auth with custom permission layers:

- `src/lib/auth/authProvider.ts`: Main authentication context provider
- `src/lib/auth/hooks.ts`: Custom hooks for auth state and actions
- `src/lib/auth/permissions.ts`: Permission management utilities

#### Auth Workflow

1. User signs up/logs in via Supabase Auth
2. JWT token is stored and used for API requests
3. Role-based permissions are calculated based on user's organization roles

#### Custom Auth Hooks

```typescript
// Example usage of auth hooks
import { useAuth, usePermissions } from '@/lib/auth/hooks';

const MyComponent = () => {
  const { user, signOut } = useAuth();
  const { canEditProject, canDeleteVideo } = usePermissions();
  
  // Component logic
};
```

### Video Management Module

Handles video uploads, storage, and processing:

- `src/lib/videos/videoService.ts`: Core video operations
- `src/components/VideoUpload/`: Upload UI components
- `src/lib/videos/processing.ts`: Video processing pipeline interface

#### Video Upload Flow

1. Client requests upload URL from API
2. Client uploads directly to storage bucket
3. Backend processes video (transcoding, thumbnail generation)
4. Video metadata is stored in database
5. Processing status is updated via webhook callbacks

```typescript
// Example video upload
import { uploadVideo } from '@/lib/videos/videoService';

const handleUpload = async (file: File) => {
  try {
    const video = await uploadVideo({
      file,
      projectId: 'project-123',
      title: 'My Video',
      metadata: { recordedAt: new Date() }
    });
    
    // Handle successful upload
    return video.id;
  } catch (error) {
    // Handle error
  }
};
```

### Analysis Module

Manages video analysis jobs and results:

- `src/lib/analysis/analysisService.ts`: Core analysis operations
- `src/lib/analysis/models.ts`: Analysis model definitions
- `src/components/Analysis/`: Analysis UI components

#### Analysis Flow

1. User selects analysis options for a video
2. Analysis job is created and queued
3. Backend processes video through AI models
4. Results are stored and indexed
5. UI is updated with analysis results

```typescript
// Example analysis creation
import { createAnalysisJob } from '@/lib/analysis/analysisService';

const startAnalysis = async (videoId: string) => {
  const analysis = await createAnalysisJob({
    videoId,
    modelId: 'general-v2',
    options: {
      detectObjects: true,
      transcribeAudio: true,
      sentimentAnalysis: true
    }
  });
  
  return analysis.id;
};
```

### Report Generation Module

Creates insights and visualizations from analysis data:

- `src/lib/reports/reportService.ts`: Report generation logic
- `src/components/Reports/`: Report UI components
- `src/lib/visualization/`: Data visualization utilities

## Database Schema

Vuebie uses a relational database with the following core tables:

### Organizations

```sql
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now(),
  metadata jsonb
);
```

### Projects

```sql
create table projects (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  settings jsonb
);
```

### Videos

```sql
create table videos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  file_path text,
  file_size bigint,
  duration numeric,
  width integer,
  height integer,
  fps numeric,
  thumbnail_url text,
  status text default 'pending',
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Analysis Jobs

```sql
create table analysis_jobs (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade,
  model_id text not null,
  status text default 'pending',
  options jsonb,
  results jsonb,
  created_at timestamp with time zone default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);
```

## API Endpoints

See the [API Reference](api_reference.md) for detailed API documentation.

## Testing

### Test Structure

Tests are organized in the `tests` directory:

```
tests/
├── unit/              # Unit tests for individual functions
├── integration/       # Integration tests for service combinations
├── e2e/               # End-to-end tests for full workflows
└── fixtures/          # Test data and mocks
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/unit/videoService.test.ts

# Run tests in watch mode
npm run test -- --watch
```

### Testing Guidelines

1. All new features should include tests
2. Unit tests should mock external dependencies
3. Use test fixtures rather than hardcoded values
4. E2E tests should run against a test database
5. Target 80%+ test coverage for core modules

## Deployment

### Environments

- **Development**: Automatic deploy from `main` branch
- **Staging**: Manual promotion from Development
- **Production**: Manual promotion from Staging

### CI/CD Pipeline

Vuebie uses GitHub Actions for CI/CD:

1. On PR to `main`:
   - Run linting
   - Run tests
   - Build application

2. On merge to `main`:
   - Deploy to Development
   - Run smoke tests

3. On release creation:
   - Deploy to Staging
   - Run E2E tests

4. On promotion to production:
   - Deploy to Production
   - Run verification tests

### Release Process

1. Create release branch: `release/vX.Y.Z`
2. Update version in package.json
3. Update CHANGELOG.md
4. Create GitHub release with release notes
5. Merge to `main`
6. Deploy through environments

## Performance Optimization

### Frontend Optimization

- Use React.memo for expensive component renders
- Implement virtualization for long lists (videos, analysis results)
- Optimize bundle size with code splitting
- Lazy load components and routes
- Cache API responses with SWR or React Query

### Backend Optimization

- Implement database query optimization
- Use appropriate indexes
- Cache frequent queries
- Paginate large result sets
- Use background jobs for long-running processes

## Security Considerations

### Authentication & Authorization

- All API endpoints must validate authentication
- Row-level security in database
- Permission checks before sensitive operations
- Regular token rotation

### Data Protection

- All sensitive data encrypted at rest
- TLS for all API communication
- Secure storage credentials management
- Regular security audits

## Contributing Guidelines

### Code Style

- Follow ESLint configuration
- Use TypeScript for type safety
- Follow component structure guidelines
- Use named exports for better tree-shaking

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes following style guidelines
3. Write or update tests
4. Create pull request with clear description
5. Address review comments
6. Squash and merge after approval

### Documentation

- Update relevant documentation with code changes
- Include JSDoc comments for functions and interfaces
- Document complex logic with inline comments
- Update README when adding new features or dependencies

## Troubleshooting

### Common Issues

#### Video Upload Failures

- Check file format and size limits
- Verify storage permissions
- Check network connectivity
- Review server logs for processing errors

#### Analysis Job Failures

- Verify video is properly processed
- Check AI service availability
- Review job logs for specific errors
- Ensure sufficient quota for AI services

#### Performance Issues

- Check database query performance
- Monitor API response times
- Review client-side rendering performance
- Check for memory leaks in components

## Support

For technical support with the Vuebie codebase:

- GitHub Issues: Report bugs and feature requests
- Slack Channel: #vuebie-dev for developer discussions
- Documentation: Check updated docs at docs.vuebie.com
- Email: dev-support@vuebie.com for urgent issues