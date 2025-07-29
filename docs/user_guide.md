# Vuebie User Guide

## Introduction

Welcome to Vuebie, the AI-powered video analysis platform that transforms your video content into actionable insights. This comprehensive guide will help you navigate the Vuebie platform, understand its key features, and optimize your video analysis workflow.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Projects](#projects)
4. [Video Management](#video-management)
5. [Analysis Features](#analysis-features)
6. [Reports and Insights](#reports-and-insights)
7. [Team Collaboration](#team-collaboration)
8. [Account Management](#account-management)
9. [Settings and Preferences](#settings-and-preferences)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

## Getting Started

### Account Creation and Login

1. **Sign Up**: Visit [app.vuebie.com](https://app.vuebie.com) and click "Sign Up"
   - Enter your email address and create a password
   - Verify your email address through the confirmation link
   - Complete your profile with your name and organization details

2. **Login**: Access your account at [app.vuebie.com](https://app.vuebie.com)
   - Enter your email and password
   - Use "Remember Me" for quicker access on trusted devices
   - Use "Forgot Password" if needed to reset your credentials

3. **First-Time Setup**:
   - Complete the onboarding tutorial for a guided introduction
   - Set your notification preferences
   - Customize your dashboard layout

### System Requirements

Vuebie is a cloud-based platform that works in modern web browsers:

- **Recommended Browsers**: Chrome (latest), Firefox (latest), Safari (latest), Edge (latest)
- **Minimum Screen Resolution**: 1280 x 800
- **Internet Connection**: 5+ Mbps recommended for optimal performance
- **For Video Uploads**: Stable connection recommended

## Dashboard Overview

The Vuebie dashboard is your command center for all video analysis activities.

### Key Dashboard Elements

1. **Navigation Menu**: Located on the left side, provides access to:
   - Projects
   - Videos
   - Analysis
   - Reports
   - Team
   - Settings

2. **Quick Stats Panel**: Shows at-a-glance metrics:
   - Recent activity
   - Analysis completion status
   - Storage usage
   - Processing credits remaining

3. **Recent Items**: Quick access to:
   - Recently viewed videos
   - Recent projects
   - Latest analysis results

4. **Notifications Center**: Updates on:
   - Completed analyses
   - Team comments
   - System announcements

5. **Search Bar**: Global search for videos, projects, and analysis results

### Customizing Your Dashboard

1. Click the "Customize" button in the top-right corner
2. Drag and drop widgets to rearrange
3. Add or remove widgets based on your preferences
4. Set default view options
5. Save your custom layout

## Projects

Projects help you organize related videos and analyses into meaningful groups.

### Creating a Project

1. Click "New Project" from the Projects page
2. Enter project details:
   - Name (required)
   - Description (recommended)
   - Tags (optional)
   - Default analysis settings (optional)
3. Click "Create Project"

### Managing Projects

1. **View Projects**: Access the complete list from the Projects tab
2. **Edit Project**: Click the "⋮" menu on any project card and select "Edit"
3. **Archive Project**: Use the "⋮" menu to archive projects you no longer need
4. **Delete Project**: Only available for projects with no videos

### Project Collaboration

1. Click "Share" on a project
2. Enter team members' email addresses
3. Assign appropriate permission levels:
   - Viewer: Can view videos and analysis results
   - Editor: Can add/edit videos and run analyses
   - Admin: Full project management rights
4. Click "Send Invites"

## Video Management

### Supported Video Formats

Vuebie supports most common video formats:
- MP4 (.mp4)
- MOV (.mov)
- AVI (.avi)
- WebM (.webm)
- MKV (.mkv)
- WMV (.wmv)

Maximum file size: 5GB per video (higher limits available on Enterprise plans)

### Uploading Videos

1. **Single Video Upload**:
   - Navigate to a project
   - Click "Upload Video"
   - Select a video file from your device
   - Add basic information (title, description)
   - Click "Upload"

2. **Batch Upload**:
   - Click "Batch Upload" from the project page
   - Select multiple files or drag and drop into the upload area
   - Videos will queue for processing
   - Edit details individually after upload

3. **API Upload** (available on Professional and Enterprise plans):
   - Use the Vuebie API to programmatically upload videos
   - See the [API Reference](/docs/api) for details

### Video Organization

1. **Tagging**: Add relevant tags to videos for easier filtering
2. **Sorting**: Arrange videos by upload date, duration, name, or status
3. **Filtering**: Filter by tags, upload date, or analysis status
4. **Searching**: Use the search bar to find specific videos by name or content

### Video Playback

1. Click on any video thumbnail to open the video player
2. Player controls include:
   - Play/pause
   - Timeline scrubbing
   - Volume control
   - Playback speed adjustment
   - Full-screen mode
3. Analysis overlay options:
   - Object bounding boxes
   - Text transcription
   - Timeline markers for key events

## Analysis Features

### Running an Analysis

1. Select a video (or multiple videos)
2. Click "Analyze"
3. Choose analysis options:
   - **Quick Analysis**: Uses default settings
   - **Custom Analysis**: Select specific features to analyze
   - **Use Model**: Select from available pre-trained or custom models
4. Click "Start Analysis"

### Analysis Types

1. **Object Detection**: Identifies and tracks objects in video
   - Configurable object classes
   - Confidence threshold adjustment
   - Temporal tracking across frames

2. **Face Detection & Recognition**:
   - Detects faces in video
   - Optional recognition against known faces
   - Emotion analysis

3. **Action Recognition**:
   - Identifies specific activities
   - Customizable action categories
   - Temporal segmentation

4. **Text Detection & OCR**:
   - Identifies and extracts visible text
   - Supports multiple languages
   - Searchable text index

5. **Audio Analysis**:
   - Speech-to-text transcription
   - Speaker identification
   - Language detection
   - Sentiment analysis

6. **Scene Understanding**:
   - Scene classification
   - Environment recognition
   - Spatial relationship mapping

### Custom Analysis Models

Professional and Enterprise plans can create custom models:

1. Navigate to "Models" section
2. Click "Create Custom Model"
3. Select base model type
4. Upload training data or use existing annotated videos
5. Configure training parameters
6. Submit for training
7. Once training is complete, use the model in analyses

### Analysis Results

1. **Results Dashboard**: Shows summary of findings
2. **Timeline View**: Visualizes detections across video duration
3. **Detail Panel**: Provides specific information about each detection
4. **Raw Data**: Access JSON format of all results

## Reports and Insights

### Creating Reports

1. From the Analysis Results page, click "Generate Report"
2. Select report type:
   - Summary Report
   - Detailed Analysis
   - Custom Report (select specific metrics)
3. Choose format (PDF, PPTX, CSV)
4. Click "Generate"

### Available Metrics

Vuebie provides various metrics depending on analysis types:

1. **Presence Metrics**:
   - Object occurrence counts
   - Screen time percentages
   - Appearance frequency

2. **Temporal Metrics**:
   - Duration of appearances
   - First/last appearances
   - Co-occurrence patterns

3. **Spatial Metrics**:
   - Positioning analysis
   - Movement patterns
   - Interaction maps

4. **Audio Metrics**:
   - Speech duration
   - Speaker distribution
   - Keyword frequency
   - Sentiment trends

### Data Visualization

1. **Charts**: Bar, line, and pie charts for quantitative data
2. **Heat Maps**: Visual representation of spatial data
3. **Network Graphs**: Relationship visualization between elements
4. **Time Series**: Temporal patterns and trends

### Exporting and Sharing

1. **Download Options**:
   - PDF Reports
   - PowerPoint Presentations
   - Excel Spreadsheets
   - CSV Raw Data
   - JSON Full Data

2. **Sharing**:
   - Direct link sharing
   - Email reports
   - Schedule recurring reports
   - Embed visualizations

## Team Collaboration

### User Roles and Permissions

Vuebie offers five permission levels:

1. **Owner**: Full system access and billing control
2. **Admin**: Management access across all projects
3. **Manager**: Can create and manage specific projects
4. **Editor**: Can upload and analyze videos
5. **Viewer**: Can only view videos and results

### Team Management

1. Navigate to "Team" in the main navigation
2. View all team members and their roles
3. Add new members with "Invite Team Member"
4. Edit permissions using the "⋮" menu
5. Remove members if needed

### Collaboration Features

1. **Comments**: Add notes and observations on specific videos or analysis points
2. **Annotations**: Create manual annotations to supplement AI analysis
3. **Shared Projects**: Work together on project-based analysis
4. **Activity Feed**: Track team actions and updates

## Account Management

### Organization Settings

1. Navigate to "Settings" > "Organization"
2. Update organization details:
   - Name
   - Logo
   - Billing information
   - Default settings

### Subscription Management

1. View current plan details in "Settings" > "Subscription"
2. Upgrade or downgrade your plan
3. View usage metrics:
   - Storage used
   - Processing minutes used
   - API calls made

### User Profile

1. Access your profile via your name in the top-right corner
2. Update personal information:
   - Name
   - Email
   - Password
   - Profile picture
3. Set notification preferences
4. Manage connected accounts

## Settings and Preferences

### Application Settings

1. **Interface Settings**:
   - Language preference
   - Dark/light mode
   - Default dashboard layout

2. **Notification Settings**:
   - Email notifications
   - Browser notifications
   - Notification frequency

3. **Analysis Defaults**:
   - Default analysis options
   - Preferred models
   - Auto-analysis settings

### API Access

Available on Professional and Enterprise plans:

1. Navigate to "Settings" > "API"
2. Generate API keys
3. View documentation
4. Monitor API usage

### Integration Settings

Configure integrations with:
- Cloud storage providers
- Content management systems
- Business intelligence tools
- Communication platforms

## Troubleshooting

### Common Issues

1. **Upload Issues**:
   - Check file format compatibility
   - Verify file size is within limits
   - Ensure stable internet connection
   - Try a different browser if problems persist

2. **Analysis Errors**:
   - Check video integrity
   - Verify sufficient credits
   - Ensure video meets minimum quality requirements
   - Try a different analysis model

3. **Playback Problems**:
   - Clear browser cache
   - Update your browser
   - Check internet connection
   - Try reducing video quality settings

### Getting Support

1. **Help Center**: Access via "Help" button in navigation
2. **Knowledge Base**: Searchable articles and guides
3. **Chat Support**: Available during business hours
4. **Email Support**: support@vuebie.com
5. **Phone Support**: Available for Enterprise customers

## FAQ

**Q: How long does video analysis take?**  
A: Analysis time depends on video length and selected analysis features. Typically, analysis takes 1/4 to 1/2 of the video's runtime.

**Q: What languages are supported for transcription?**  
A: Vuebie supports transcription in 30+ languages including English, Spanish, French, German, Chinese, Japanese, and more.

**Q: Can I analyze videos from YouTube or other platforms?**  
A: Yes, Professional and Enterprise plans allow URL imports from YouTube, Vimeo, and other supported platforms.

**Q: How accurate is the analysis?**  
A: Accuracy varies by feature and video quality. Object detection typically achieves 85-95% accuracy, while transcription accuracy ranges from 90-98% depending on audio quality.

**Q: Can I edit or correct AI analysis results?**  
A: Yes, you can add, edit, or remove annotations manually to correct or supplement AI analysis.

**Q: What happens to my videos after upload?**  
A: Your videos are securely stored in our cloud infrastructure and accessible only to authorized users in your organization.

**Q: Can I download my analysis data?**  
A: Yes, all analysis data can be exported in multiple formats including JSON, CSV, and PDF.

**Q: How do I increase my storage or processing limits?**  
A: You can upgrade your subscription plan or purchase additional resources as needed from the Subscription section.

---

## Getting Additional Help

If you need further assistance:

- Email: support@vuebie.com
- Support Portal: [support.vuebie.com](https://support.vuebie.com)
- Phone: +1 (800) VUE-HELP (Enterprise customers)

Our support team is available Monday through Friday, 9 AM - 6 PM ET.