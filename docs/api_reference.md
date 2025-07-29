# Vuebie API Reference

## Introduction

The Vuebie API allows developers to programmatically interact with the Vuebie platform. This document provides comprehensive documentation for all available endpoints, authentication methods, and response formats.

## Base URL

All API requests should be made to:

```
https://api.vuebie.com/v1
```

## Authentication

### API Keys

Vuebie uses API keys to authenticate requests. You can view and manage your API keys in the Vuebie Dashboard under Settings > API.

All API requests must include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### JWT Authentication

For user-context operations, you can also use JWT authentication:

1. Obtain a JWT token via `/auth/login`
2. Include the token in requests:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

## Rate Limiting

API requests are limited based on your subscription plan:

- **Free**: 100 requests per hour
- **Professional**: 1,000 requests per hour
- **Enterprise**: 10,000 requests per hour or custom limits

Rate limit information is included in API response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1627834096
```

## Versioning

The current API version is v1. Include the version in the URL path:

```
https://api.vuebie.com/v1/videos
```

## Response Format

All API responses are returned in JSON format. Successful responses include:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "error_code",
    "message": "Description of the error",
    "details": { ... } // Optional
  }
}
```

## Error Codes

Common error codes:

| Code | Description |
|------|-------------|
| `authentication_error` | Invalid or missing API key |
| `authorization_error` | Insufficient permissions |
| `rate_limit_exceeded` | Too many requests |
| `invalid_request` | Malformed request |
| `resource_not_found` | Requested resource doesn't exist |
| `validation_error` | Invalid data in request |
| `server_error` | Internal server error |

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-08-28T12:00:00Z",
    "user": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "full_name": "Jane Smith"
    }
  }
}
```

### Organizations

#### List Organizations

```
GET /organizations
```

Returns a list of organizations the authenticated user belongs to.

**Response:**

```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_123456789",
        "name": "Acme Corporation",
        "role": "admin"
      },
      {
        "id": "org_987654321",
        "name": "Example Inc",
        "role": "member"
      }
    ]
  }
}
```

#### Get Organization Details

```
GET /organizations/{organization_id}
```

Returns details about a specific organization.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "org_123456789",
    "name": "Acme Corporation",
    "subscription_plan": "professional",
    "subscription_status": "active",
    "created_at": "2024-01-15T10:00:00Z",
    "members_count": 15,
    "projects_count": 8
  }
}
```

### Projects

#### List Projects

```
GET /projects
```

Returns a list of projects accessible to the authenticated user.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organization_id` | string | Filter by organization ID |
| `limit` | integer | Maximum number of results (default: 20, max: 100) |
| `offset` | integer | Pagination offset |

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "prj_123456789",
        "name": "Q3 Marketing Campaign",
        "description": "Analysis of Q3 marketing materials",
        "organization_id": "org_123456789",
        "created_at": "2025-04-15T09:30:00Z",
        "videos_count": 27
      },
      {
        "id": "prj_987654321",
        "name": "Product Testing",
        "description": "User testing videos for new product",
        "organization_id": "org_123456789",
        "created_at": "2025-03-22T14:15:00Z",
        "videos_count": 42
      }
    ],
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

#### Create Project

```
POST /projects
```

Creates a new project.

**Request Body:**

```json
{
  "name": "New Project",
  "description": "Project description",
  "organization_id": "org_123456789",
  "settings": {
    "auto_analyze": true,
    "default_model_id": "mdl_123456789"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prj_123456789",
    "name": "New Project",
    "description": "Project description",
    "organization_id": "org_123456789",
    "created_at": "2025-07-28T10:15:00Z",
    "settings": {
      "auto_analyze": true,
      "default_model_id": "mdl_123456789"
    }
  }
}
```

#### Get Project Details

```
GET /projects/{project_id}
```

Returns details about a specific project.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prj_123456789",
    "name": "Q3 Marketing Campaign",
    "description": "Analysis of Q3 marketing materials",
    "organization_id": "org_123456789",
    "created_at": "2025-04-15T09:30:00Z",
    "updated_at": "2025-07-20T15:45:00Z",
    "settings": {
      "auto_analyze": true,
      "default_model_id": "mdl_123456789"
    },
    "videos_count": 27,
    "collaborators": [
      {
        "user_id": "usr_123456789",
        "email": "user@example.com",
        "full_name": "Jane Smith",
        "role": "admin"
      },
      {
        "user_id": "usr_987654321",
        "email": "other@example.com",
        "full_name": "John Doe",
        "role": "editor"
      }
    ]
  }
}
```

#### Update Project

```
PATCH /projects/{project_id}
```

Updates an existing project.

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "settings": {
    "auto_analyze": false
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prj_123456789",
    "name": "Updated Project Name",
    "description": "Updated description",
    "organization_id": "org_123456789",
    "created_at": "2025-04-15T09:30:00Z",
    "updated_at": "2025-07-28T11:20:00Z",
    "settings": {
      "auto_analyze": false,
      "default_model_id": "mdl_123456789"
    }
  }
}
```

#### Delete Project

```
DELETE /projects/{project_id}
```

Deletes a project. This operation is irreversible.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prj_123456789",
    "deleted": true
  }
}
```

### Videos

#### List Videos

```
GET /videos
```

Returns a list of videos.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | string | Filter by project ID |
| `status` | string | Filter by status (pending, processing, complete, error) |
| `limit` | integer | Maximum number of results (default: 20, max: 100) |
| `offset` | integer | Pagination offset |

**Response:**

```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "vid_123456789",
        "title": "Product Demo - July 2025",
        "project_id": "prj_123456789",
        "duration": 1245.75,
        "status": "complete",
        "thumbnail_url": "https://storage.vuebie.com/thumbnails/vid_123456789.jpg",
        "created_at": "2025-07-12T15:30:00Z"
      },
      {
        "id": "vid_987654321",
        "title": "Customer Interview #4",
        "project_id": "prj_123456789",
        "duration": 1825.20,
        "status": "complete",
        "thumbnail_url": "https://storage.vuebie.com/thumbnails/vid_987654321.jpg",
        "created_at": "2025-07-10T09:45:00Z"
      }
    ],
    "total": 27,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Upload URL

```
POST /videos/upload-url
```

Generates a pre-signed URL for direct video upload.

**Request Body:**

```json
{
  "project_id": "prj_123456789",
  "filename": "product-demo.mp4",
  "content_type": "video/mp4",
  "content_length": 256000000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "video_id": "vid_123456789",
    "upload_url": "https://storage.vuebie.com/uploads/...",
    "expires_at": "2025-07-28T12:30:00Z"
  }
}
```

#### Complete Upload

```
POST /videos/{video_id}/complete-upload
```

Finalizes a video upload and starts processing.

**Request Body:**

```json
{
  "title": "Product Demo - July 2025",
  "description": "Official product demonstration for the summer lineup",
  "metadata": {
    "recorded_date": "2025-07-10",
    "location": "Studio B",
    "tags": ["product", "demo", "official"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "vid_123456789",
    "title": "Product Demo - July 2025",
    "description": "Official product demonstration for the summer lineup",
    "project_id": "prj_123456789",
    "status": "processing",
    "created_at": "2025-07-28T12:00:00Z"
  }
}
```

#### Get Video Details

```
GET /videos/{video_id}
```

Returns details about a specific video.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "vid_123456789",
    "project_id": "prj_123456789",
    "title": "Product Demo - July 2025",
    "description": "Official product demonstration for the summer lineup",
    "file_path": "organizations/org_123456789/projects/prj_123456789/videos/vid_123456789.mp4",
    "file_size": 258769420,
    "file_type": "mp4",
    "duration": 1245.75,
    "width": 1920,
    "height": 1080,
    "fps": 30.00,
    "thumbnail_url": "https://storage.vuebie.com/thumbnails/vid_123456789.jpg",
    "metadata": {
      "recorded_date": "2025-07-10",
      "location": "Studio B",
      "tags": ["product", "demo", "official"]
    },
    "status": "complete",
    "created_at": "2025-07-12T15:30:00Z",
    "updated_at": "2025-07-12T15:45:00Z",
    "uploaded_by": {
      "id": "usr_123456789",
      "email": "user@example.com",
      "full_name": "Jane Smith"
    }
  }
}
```

#### Update Video

```
PATCH /videos/{video_id}
```

Updates an existing video's metadata.

**Request Body:**

```json
{
  "title": "Updated Video Title",
  "description": "Updated video description",
  "metadata": {
    "tags": ["product", "demo", "official", "summer-2025"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "vid_123456789",
    "title": "Updated Video Title",
    "description": "Updated video description",
    "metadata": {
      "recorded_date": "2025-07-10",
      "location": "Studio B",
      "tags": ["product", "demo", "official", "summer-2025"]
    },
    "updated_at": "2025-07-28T12:30:00Z"
  }
}
```

#### Delete Video

```
DELETE /videos/{video_id}
```

Deletes a video. This operation is irreversible.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "vid_123456789",
    "deleted": true
  }
}
```

### Analysis

#### Create Analysis Job

```
POST /analysis
```

Creates a new analysis job for a video.

**Request Body:**

```json
{
  "video_id": "vid_123456789",
  "model_id": "mdl_123456789",
  "options": {
    "detect_objects": true,
    "detect_faces": true,
    "transcribe_audio": true,
    "sentiment_analysis": true,
    "key_moment_detection": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ana_123456789",
    "video_id": "vid_123456789",
    "model_id": "mdl_123456789",
    "status": "queued",
    "options": {
      "detect_objects": true,
      "detect_faces": true,
      "transcribe_audio": true,
      "sentiment_analysis": true,
      "key_moment_detection": true
    },
    "created_at": "2025-07-28T12:45:00Z"
  }
}
```

#### Get Analysis Status

```
GET /analysis/{analysis_id}
```

Returns the status and results of an analysis job.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ana_123456789",
    "video_id": "vid_123456789",
    "model_id": "mdl_123456789",
    "status": "complete",
    "options": {
      "detect_objects": true,
      "detect_faces": true,
      "transcribe_audio": true,
      "sentiment_analysis": true,
      "key_moment_detection": true
    },
    "progress": 100,
    "created_at": "2025-07-28T12:45:00Z",
    "started_at": "2025-07-28T12:46:00Z",
    "completed_at": "2025-07-28T13:10:00Z",
    "results": {
      "summary": {
        "object_count": 157,
        "face_count": 3,
        "transcript_word_count": 2450,
        "average_sentiment": 0.65
      }
    }
  }
}
```

#### List Analysis Jobs for Video

```
GET /videos/{video_id}/analysis
```

Returns all analysis jobs for a specific video.

**Response:**

```json
{
  "success": true,
  "data": {
    "analysis_jobs": [
      {
        "id": "ana_123456789",
        "video_id": "vid_123456789",
        "model_id": "mdl_123456789",
        "model_name": "General Analysis V2",
        "status": "complete",
        "created_at": "2025-07-28T12:45:00Z",
        "completed_at": "2025-07-28T13:10:00Z"
      },
      {
        "id": "ana_987654321",
        "video_id": "vid_123456789",
        "model_id": "mdl_987654321",
        "model_name": "Face Recognition Special",
        "status": "complete",
        "created_at": "2025-07-25T10:30:00Z",
        "completed_at": "2025-07-25T10:55:00Z"
      }
    ]
  }
}
```

#### Get Analysis Results

```
GET /analysis/{analysis_id}/results
```

Returns detailed results from a completed analysis job.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by result type (objects, faces, transcript, etc.) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ana_123456789",
    "video_id": "vid_123456789",
    "completed_at": "2025-07-28T13:10:00Z",
    "results": {
      "objects": [
        {
          "timestamp": 12.5,
          "duration": 8.2,
          "label": "laptop",
          "confidence": 0.97,
          "bounding_box": {
            "x": 0.2,
            "y": 0.4,
            "width": 0.3,
            "height": 0.15
          }
        }
      ],
      "faces": [
        {
          "timestamp": 5.8,
          "duration": 120.4,
          "bounding_box": {
            "x": 0.4,
            "y": 0.2,
            "width": 0.1,
            "height": 0.15
          },
          "confidence": 0.99,
          "age_estimate": 35,
          "gender": "female",
          "emotions": {
            "happy": 0.8,
            "neutral": 0.15,
            "surprised": 0.05
          }
        }
      ],
      "transcript": {
        "language": "en",
        "segments": [
          {
            "start_time": 2.5,
            "end_time": 8.7,
            "text": "Welcome to our latest product demonstration.",
            "speaker": "speaker_1",
            "confidence": 0.98
          }
        ]
      }
    }
  }
}
```

### Webhooks

Vuebie can send webhook events to notify your application about specific events.

#### Create Webhook

```
POST /webhooks
```

Creates a new webhook subscription.

**Request Body:**

```json
{
  "url": "https://example.com/vuebie-webhook",
  "events": ["video.complete", "analysis.complete", "report.complete"],
  "secret": "your-signing-secret"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "wh_123456789",
    "url": "https://example.com/vuebie-webhook",
    "events": ["video.complete", "analysis.complete", "report.complete"],
    "created_at": "2025-07-28T15:30:00Z",
    "status": "active"
  }
}
```

### Event Types

| Event Type | Description |
|------------|-------------|
| `video.uploaded` | Video has been uploaded |
| `video.processing` | Video processing has started |
| `video.complete` | Video processing is complete |
| `video.error` | Error occurred during video processing |
| `analysis.queued` | Analysis job has been queued |
| `analysis.processing` | Analysis job is processing |
| `analysis.complete` | Analysis job is complete |
| `analysis.error` | Error occurred during analysis |
| `report.complete` | Report generation is complete |

## SDK Libraries

Vuebie provides official SDK libraries for popular programming languages:

- [Vuebie JavaScript SDK](https://github.com/vuebie/vuebie-js)
- [Vuebie Python SDK](https://github.com/vuebie/vuebie-python)
- [Vuebie Ruby SDK](https://github.com/vuebie/vuebie-ruby)
- [Vuebie PHP SDK](https://github.com/vuebie/vuebie-php)

## Support

If you have any questions or need assistance with the Vuebie API, please contact our developer support team:

- Email: api-support@vuebie.com
- Developer Forum: [developers.vuebie.com/forum](https://developers.vuebie.com/forum)
- API Status: [status.vuebie.com](https://status.vuebie.com)