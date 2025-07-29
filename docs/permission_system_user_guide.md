# Vuebie Permission System User Guide

## Overview
The Vuebie platform implements a comprehensive role-based access control (RBAC) system that allows organizations to finely control which users can access specific features and data. This guide explains how the permission system works, how to configure permissions for your organization, and best practices for permission management.

## Permission Model

### Core Concepts

#### 1. Users
Individual accounts that access the Vuebie platform. Each user belongs to a single organization and has one assigned role.

#### 2. Roles
A collection of permissions that define what actions a user can perform. Vuebie provides built-in roles and supports custom role creation.

#### 3. Resources
Elements in the system that can be acted upon, such as videos, projects, models, and settings.

#### 4. Permissions
Defines the actions a user can perform on specific resources, such as view, edit, delete, or analyze.

#### 5. Scopes
Limits permissions to specific contexts, such as specific projects or video types.

## Default Roles

### 1. Organization Administrator
- **Description**: Full control over the organization's Vuebie instance
- **Permissions**:
  - Manage users and roles
  - Configure organization settings
  - Access all projects and videos
  - Manage billing and subscription
  - View usage analytics and logs
  - Create and manage custom models
  - Configure integrations

### 2. Project Manager
- **Description**: Manages specific projects and their resources
- **Permissions**:
  - Create and manage projects
  - Add users to projects
  - Upload and analyze videos
  - View project analytics
  - Configure project settings
  - Use custom models

### 3. Analyst
- **Description**: Works with videos and analysis results
- **Permissions**:
  - Upload videos to assigned projects
  - Run analyses on videos
  - View and export results
  - Create annotations and notes
  - Use existing custom models

### 4. Viewer
- **Description**: View-only access to specific resources
- **Permissions**:
  - View assigned projects
  - View videos and analysis results
  - Export reports and dashboards
  - No editing or creation capabilities

## Permission Management

### Accessing Permission Settings

1. Log in to your Vuebie account
2. Navigate to **Settings > User Management**
3. Select the **Roles & Permissions** tab

### Creating Custom Roles

1. Click **Create New Role**
2. Enter a role name and description
3. Select permissions from the available list
4. Specify permission scopes if needed
5. Click **Save Role**

### Assigning Roles to Users

#### For New Users:
1. Go to **Settings > User Management**
2. Click **Invite User**
3. Enter the user's email address
4. Select the appropriate role
5. Optionally, specify project access
6. Click **Send Invitation**

#### For Existing Users:
1. Go to **Settings > User Management**
2. Find the user in the list
3. Click the **Edit** button
4. Change the role assignment
5. Adjust project access if needed
6. Click **Save Changes**

### Project-Level Permissions

For finer control, you can adjust permissions at the project level:

1. Navigate to the project
2. Select the **Settings** tab
3. Click on **Project Access**
4. Add users with specific roles for this project
5. Click **Save Changes**

## Permission Inheritance

The Vuebie permission system uses inheritance rules:

1. Organization-level roles apply across all projects
2. Project-level roles override organization roles within that project
3. Resource-specific permissions take precedence over broader permissions

## Best Practices

### Permission Strategy

1. **Follow the Principle of Least Privilege**
   - Assign the minimum permissions needed for each role
   - Regularly audit and adjust permissions as needed

2. **Use Role Templates**
   - Create standardized roles for common job functions
   - Maintain consistency across projects

3. **Group by Function**
   - Organize permissions by business function
   - Consider workflow requirements when designing roles

### Security Considerations

1. **Regular Auditing**
   - Review user roles quarterly
   - Remove unnecessary permissions
   - Check for outdated role assignments

2. **Permission Monitoring**
   - Enable permission change logging
   - Review the audit logs regularly
   - Investigate unusual permission changes

3. **Offboarding Process**
   - Immediately revoke access when users leave
   - Perform regular access reviews

## Advanced Features

### Temporary Access

Grant time-limited access to resources:

1. Go to the resource (project, video, etc.)
2. Select **Share**
3. Enter the user's email
4. Set an expiration date
5. Click **Grant Temporary Access**

### Permission Groups

Create groups of users for easier permission management:

1. Go to **Settings > User Management**
2. Select the **Groups** tab
3. Click **Create Group**
4. Add users to the group
5. Assign permissions to the entire group

### API Permissions

When creating API keys, you can specify limited permissions:

1. Go to **Settings > API Keys**
2. Click **Generate New Key**
3. Select the specific permissions for the API key
4. Set an expiration date if needed
5. Click **Generate Key**

## Troubleshooting

### Common Issues

#### User Cannot Access a Resource
1. Check their assigned role
2. Verify project-level permissions
3. Check for resource-specific restrictions
4. Ensure the user's account is active

#### Permission Changes Not Taking Effect
1. Ask the user to log out and log back in
2. Clear browser cache
3. Check for conflicting permission rules
4. Contact support if issues persist

### Permission Audit

To review all permissions:

1. Go to **Settings > User Management**
2. Click **Permission Audit**
3. Filter by user, role, or resource
4. Export the report for review

## Glossary

- **RBAC**: Role-Based Access Control
- **Permission**: The ability to perform a specific action
- **Role**: A collection of permissions assigned to users
- **Resource**: An object in the system that can be accessed
- **Scope**: The boundary within which a permission applies
- **Inheritance**: How permissions flow from broader to more specific contexts

## Additional Resources

- [Advanced Permission Configuration](https://docs.vuebie.com/permissions/advanced)
- [Permission API Reference](https://api.vuebie.com/docs/permissions)
- [Security Best Practices Guide](https://docs.vuebie.com/security)
- [Video Tutorial: Setting Up Custom Roles](https://learn.vuebie.com/permissions)

For additional support with permissions, contact Vuebie support at support@vuebie.com.