# Vuebie

Vuebie is an innovative AI-powered video analysis platform that enables users to extract meaningful insights from video content through advanced computer vision and machine learning technologies.

## Features

- **Intelligent Video Analysis**: Process videos with cutting-edge AI models to extract objects, activities, text, and more
- **Custom Model Training**: Create and train specialized models tailored to your specific video analysis needs
- **Interactive Dashboards**: Visualize analysis results through intuitive and customizable dashboards
- **Collaborative Workspace**: Share projects, findings, and insights with team members
- **Secure Data Management**: Enterprise-grade security for all your sensitive video content
- **API Integration**: Seamlessly integrate video analysis capabilities into your existing applications

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/vuebie.git
   cd vuebie
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration details.

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Environment Setup

For production deployment, configure the following environment variables:

#### Required Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key for client-side operations

#### Additional Variables
- `VITE_APP_NAME`: Application name (defaults to "Vuebie")
- `VITE_API_BASE_URL`: API endpoint base URL
- `NEXT_PUBLIC_API_URL`: API endpoint URL
- `NEXT_PUBLIC_AUTH_DOMAIN`: Authentication domain
- `NEXT_PUBLIC_CLIENT_ID`: Client ID for authentication
- `DATABASE_URL`: Database connection string
- `STORAGE_URL`: Storage service URL
- `MODEL_SERVICE_URL`: Model service endpoint

## Documentation

For comprehensive documentation, please refer to the following resources:

- [User Guide](/docs/user_guide.md)
- [API Reference](/docs/api_reference.md)
- [Developer Documentation](/docs/developer_docs.md)
- [Deployment Guide](/docs/deployment_guide.md)

## Architecture

Vuebie is built using a modern tech stack:

- **Frontend**: Next.js with React and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Node.js API services
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT-based auth system
- **Storage**: Object storage for videos and analysis results
- **AI Processing**: Custom ML pipeline for video analysis

## Contributing

We welcome contributions to Vuebie! Please read our [Contributing Guidelines](/docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](/LICENSE).

## Support

For support, please email support@vuebie.com or visit our [support portal](https://support.vuebie.com).

## Acknowledgments

- The Vuebie Team
- Our open source contributors
- Our beta testers and early adopters