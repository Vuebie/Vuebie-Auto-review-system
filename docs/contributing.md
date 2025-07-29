# Contributing to Vuebie

Thank you for your interest in contributing to Vuebie! This document provides guidelines and instructions for contributing to the Vuebie platform.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment](#development-environment)
4. [Branching Strategy](#branching-strategy)
5. [Making Changes](#making-changes)
6. [Coding Standards](#coding-standards)
7. [Submitting Pull Requests](#submitting-pull-requests)
8. [Testing](#testing)
9. [Documentation](#documentation)
10. [Community](#community)

## Code of Conduct

Vuebie has adopted a Code of Conduct that we expect project participants to adhere to. Please read the [full text](CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

## Getting Started

### Issues and Discussions

Before starting work on a significant change, please:

1. Check if there's already an open issue discussing the feature or bug
2. If not, open a new issue or start a discussion to gather feedback
3. Wait for confirmation from a maintainer before proceeding with implementation

This helps prevent duplicated efforts and ensures your contribution aligns with the project's goals and roadmap.

### Fork and Clone

1. Fork the Vuebie repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/vuebie.git
   cd vuebie
   ```
3. Add the original repository as a remote:
   ```bash
   git remote add upstream https://github.com/vuebie/vuebie.git
   ```
4. Keep your fork in sync:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

## Development Environment

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or yarn (v1.22 or higher)
- Git
- Docker and Docker Compose (for local development with Supabase)

### Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Configure your local environment variables in `.env.local`

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Start local Supabase (optional):
   ```bash
   npm run supabase:start
   # or
   yarn supabase:start
   ```

## Branching Strategy

We use a simplified GitFlow workflow:

- `main` - The main development branch. All PRs are merged here first.
- `staging` - Staging environment branch, updated from main.
- `production` - Production branch, updated from staging.
- `feature/*` - Feature branches, created from main.
- `bugfix/*` - Bug fix branches, created from main.
- `hotfix/*` - Hotfix branches, created from production (for urgent fixes).

### Creating a Branch

```bash
# For new features
git checkout -b feature/your-feature-name main

# For bug fixes
git checkout -b bugfix/issue-description main

# For hotfixes
git checkout -b hotfix/critical-issue production
```

## Making Changes

### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear, structured commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

Examples:
```
feat(auth): add SSO login with Google
fix(upload): resolve video processing timeout issue
docs: update API reference documentation
```

### Keeping Your Branch Updated

Regularly sync your branch with the latest main:

```bash
git checkout main
git pull upstream main
git checkout your-feature-branch
git merge main
```

## Coding Standards

### TypeScript and JavaScript

- We use TypeScript for type safety
- Follow the ESLint configuration
- Use async/await instead of promises
- Prefer functional programming patterns
- Use named exports for better tree-shaking

### React Components

- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use React Context for global state
- Follow component naming conventions:
  - Components: PascalCase (e.g., `VideoPlayer.tsx`)
  - Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
  - Utilities: camelCase (e.g., `formatDuration.ts`)

### CSS and Styling

- Use Tailwind CSS for styling
- Follow BEM methodology for custom CSS
- Keep component-specific styles close to the component
- Use CSS variables for theme values

## Submitting Pull Requests

1. Push your branch to your fork:
   ```bash
   git push origin your-feature-branch
   ```

2. Create a Pull Request from your fork to the main Vuebie repository

3. Fill out the PR template with:
   - Description of changes
   - Issue number(s) addressed
   - Testing performed
   - Screenshots (for UI changes)
   - Breaking changes (if any)

4. Request review from appropriate team members

5. Address review feedback and make necessary changes

6. Once approved, a maintainer will merge your PR

### PR Checklist

Before submitting, ensure:

- [ ] Your code follows the project's coding standards
- [ ] You've added/updated tests for your changes
- [ ] All tests pass locally
- [ ] Documentation is updated (if relevant)
- [ ] Your branch is up to date with main
- [ ] Your commit messages follow conventions
- [ ] You've tested edge cases and error scenarios

## Testing

### Test Structure

Our tests are organized in the following directories:

- `tests/unit/` - Unit tests for individual functions and components
- `tests/integration/` - Integration tests for services and APIs
- `tests/e2e/` - End-to-end tests for complete user flows
- `tests/fixtures/` - Test fixtures and mock data

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern=VideoPlayer

# Run tests in watch mode
npm test -- --watch
```

### Test Guidelines

- Write tests for all new features and bug fixes
- Aim for high test coverage, especially for critical paths
- Use meaningful test descriptions
- Test edge cases and error conditions
- Use test fixtures instead of inline mock data
- Mock external dependencies in unit tests

## Documentation

Documentation is crucial for Vuebie's success. When making changes:

1. Update relevant README files
2. Add or update JSDoc comments for functions and components
3. Update API documentation for endpoint changes
4. Add code examples for new features
5. Update user guides for UI/UX changes

### Documentation Style

- Use clear, concise language
- Include examples where helpful
- Use proper Markdown formatting
- Keep documentation close to the code it describes
- Include screenshots or diagrams for complex features

## Community

### Communication Channels

- GitHub Discussions: For feature discussions and community questions
- Slack: For real-time communication among contributors
- Monthly Contributors Meeting: For roadmap discussions and demos

### Mentorship

We welcome new contributors! If you're looking to get started:

1. Check the "good first issue" label in the issue tracker
2. Join the #new-contributors channel in Slack
3. Ask for mentorship on the issue you'd like to tackle

### Recognition

All contributors are recognized in our CONTRIBUTORS.md file and on the Vuebie website. We celebrate significant contributions in our release notes.

## Thank You!

Your contributions help make Vuebie better for everyone. We appreciate the time and effort you put into improving the platform!

For any questions, reach out to us at contributors@vuebie.com.