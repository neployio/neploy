# Neploy 🚀

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/henrriusdev/neploy)

A powerful deployment platform and API Gateway for containerized applications with comprehensive team management and monitoring capabilities.

## 🌟 Overview

Neploy is a modern deployment platform that simplifies the process of deploying, managing, and scaling containerized applications. It provides an intuitive web interface for teams to collaborate on application deployments while offering robust API gateway functionality, real-time monitoring, and comprehensive user management.

## ✨ Key Features

- **🐳 Containerized Deployments**: Automatic Docker containerization with support for multiple programming languages
- **🔐 OAuth Integration**: Seamless authentication with GitHub and GitLab
- **👥 Team Management**: Role-based access control and user invitation system
- **📊 Real-time Monitoring**: Application metrics, health checks, and performance tracking
- **🌐 API Gateway**: Dynamic routing, middleware support, and request handling
- **📈 Analytics**: Visitor tracking, request statistics, and application insights
- **🔄 Version Control**: Application versioning with Git integration
- **💬 Real-time Communication**: WebSocket support for live updates and notifications
- **🎯 Health Monitoring**: Automatic health checks and uptime tracking

## 🛠️ Technology Stack

### Backend
- **Go 1.23** - Core backend language
- **Echo v4** - Web framework
- **PostgreSQL** - Primary database
- **Docker** - Containerization
- **JWT** - Authentication
- **WebSocket** - Real-time communication

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Inertia.js** - Server-side rendering
- **Radix UI** - Component library

### Additional Technologies
- **Git Integration** - GitHub and GitLab support
- **Email Service** - Resend integration
- **Swagger** - API documentation
- **i18n** - Internationalization support

## 📋 Prerequisites

- **Go 1.23+**
- **Node.js 18+**
- **PostgreSQL 12+**
- **Docker and Docker Compose**
- **Yarn package manager**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/neployio/neploy.git
cd neploy
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DB_NAME=neploy
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_SSL_MODE=disable

# Application Settings
ENV=local
BASE_URL=http://localhost
PORT=3000
JWT_SECRET=your_jwt_secret_here

# OAuth Configuration (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITLAB_APPLICATION_ID=your_gitlab_application_id
GITLAB_SECRET=your_gitlab_secret

# Email Configuration (Optional)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Neploy
```

### 3. Database Setup

Create a PostgreSQL database and run the migrations:

```bash
# Create database
createdb neploy

# Install goose for migrations (if not already installed)
go install github.com/pressly/goose/v3/cmd/goose@latest

# Run migrations
goose -dir migrations postgres "postgres://your_db_user:your_db_password@localhost:5432/neploy?sslmode=disable" up
```

### 4. Install Dependencies

**Backend dependencies:**
```bash
go mod download
```

**Frontend dependencies:**
```bash
# Enable corepack for yarn 4.x support
corepack enable

# Install dependencies
yarn install
```

### 5. Build the Frontend

```bash
yarn build
```

### 6. Run the Application

**Development mode:**
```bash
# Terminal 1: Start the backend
go run cmd/app/main.go

# Terminal 2: Start the frontend dev server (optional for development)
yarn dev
```

**Production mode:**
```bash
# Build the application
go build -o neploy cmd/app/main.go

# Run the binary
./neploy
```

The application will be available at `http://localhost:3000` (or your configured port).

## 🔧 Configuration

### Database Migrations

The application uses database migrations located in the `migrations/` directory. Ensure your database is set up and migrations are applied before running the application.

### OAuth Setup

To enable GitHub/GitLab authentication:

1. **GitHub OAuth App:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:3000/auth/github/callback`
   - Copy Client ID and Client Secret to your `.env` file

2. **GitLab OAuth App:**
   - Go to GitLab Settings > Applications
   - Create a new application
   - Set Redirect URI to: `http://localhost:3000/auth/gitlab/callback`
   - Copy Application ID and Secret to your `.env` file

### Docker Configuration

The application automatically generates Dockerfiles for supported languages:
- Node.js
- Python
- Go
- Ruby
- Rust
- PHP

## 📖 Usage

### Initial Setup

1. **First Time Setup**: Navigate to `/setup` for initial system configuration
2. **Create Admin User**: Connect with GitHub/GitLab and complete admin profile
3. **Define Roles**: Set up initial team roles and permissions

### Application Management

1. **Create Application**: Upload files or connect Git repository
2. **Deploy**: Automatic containerization and deployment
3. **Monitor**: View real-time metrics and logs
4. **Scale**: Manage multiple versions and configurations

### Team Collaboration

1. **Invite Users**: Send email invitations with role assignments
2. **Manage Permissions**: Control access levels per user/role
3. **Track Activity**: Monitor team member activities and deployments

## 📚 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/swagger/`
- **API Specification**: Located in `neploy/docs/swagger.yaml`

## 🧪 Development

### Project Structure

```
neploy/
├── cmd/app/           # Application entry point
├── config/            # Configuration management
├── migrations/        # Database migrations
├── neploy/           # Core application logic
│   ├── handler/      # HTTP handlers
│   ├── middleware/   # Custom middleware
│   └── docs/         # API documentation
├── pkg/              # Shared packages
│   ├── docker/       # Docker integration
│   ├── gateway/      # API Gateway logic
│   ├── model/        # Data models
│   ├── repository/   # Data access layer
│   ├── service/      # Business logic
│   └── websocket/    # WebSocket handlers
├── resources/        # Frontend assets and documentation
│   ├── js/           # React components
│   └── md/           # Markdown documentation
└── public/           # Static assets
```

### Running Tests

```bash
# Run Go tests
go test ./...

# Run frontend tests (if available)
yarn test
```

### Building for Production

```bash
# Build frontend assets
yarn build

# Build Go binary
go build -o neploy cmd/app/main.go
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](resources/md/) for detailed guides
2. Review existing [GitHub Issues](https://github.com/neployio/neploy/issues)
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Built with ❤️ by the Neploy team
- Inspired by modern deployment platforms and container orchestration tools
- Thanks to all contributors and the open-source community
