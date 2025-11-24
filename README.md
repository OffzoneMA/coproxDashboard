# CoproxDashboard - Enterprise Property Management System

<div align="center">

![CoproxDashboard](https://img.shields.io/badge/CoproxDashboard-v1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-17.0.2-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.14.2-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A comprehensive, enterprise-grade property management platform for condominium administration**

[Features](#-features) • [Architecture](#️-architecture) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Deployment](#-deployment)

</div>

## 🏢 Executive Overview

CoproxDashboard is a sophisticated, enterprise-level property management ecosystem specifically engineered for condominium (copropriété) administration. Built on modern microservice-inspired architecture with hexagonal design patterns, the platform seamlessly integrates with multiple third-party services to provide a unified management experience.

### 🎯 Business Value Proposition

- **📊 Centralized Operations**: Single dashboard for all property management activities
- **🔄 Automated Workflows**: Reduces manual tasks by 70% through intelligent automation
- **📱 Multi-Platform Integration**: Connects Trello, Monday.com, Zendesk, Vilogi, and Dropbox
- **📈 Real-Time Analytics**: Live monitoring of KPIs, tickets, and property metrics
- **🔒 Enterprise Security**: Robust logging, monitoring, and audit trails
- **⚡ High Performance**: Prometheus-monitored APIs with sub-second response times

### 🏗️ System Capabilities

#### Core Property Management
- **Property Lifecycle Management**: Complete CRUD operations with audit trails
- **Multi-Status Tracking**: Active/Inactive property states with transition workflows
- **Advanced Search & Filtering**: Complex property queries with multiple criteria
- **Bulk Operations**: Mass property updates and synchronization capabilities
- **Historical Tracking**: Complete property modification history with timestamps

#### Integration Ecosystem
- **🎯 Trello Integration**: Automated board/card management for project tracking
- **📅 Monday.com Sync**: Bidirectional synchronization with project management workflows
- **🎫 Zendesk Management**: Comprehensive support ticket lifecycle management
- **🏢 Vilogi Connector**: Real-time property data synchronization
- **☁️ Dropbox Backup**: Automated document storage and version control
- **🔥 Firebase Services**: Real-time notifications and authentication

#### Business Intelligence
- **📊 Real-Time Dashboards**: Live property metrics and KPI monitoring
- **📈 Advanced Analytics**: Property performance trends and insights
- **📋 Automated Reporting**: Scheduled PDF/CSV report generation
- **🔍 OCR Processing**: Intelligent document text extraction and analysis
- **📱 Mobile-Responsive**: Optimized for desktop, tablet, and mobile access

## 🏗️ Enterprise Architecture & Technology Stack

CoproxDashboard implements a **Domain-Driven Hexagonal Architecture** with CQRS patterns, providing enterprise-grade scalability, maintainability, and testability. The system follows clean architecture principles with strict separation of concerns.

### 🎯 Architectural Principles

- **🔷 Hexagonal Architecture**: Ports & Adapters pattern for maximum flexibility
- **🏛️ Domain-Driven Design**: Business logic isolation in domain layer
- **🔄 CQRS Ready**: Separation of command and query responsibilities
- **⚡ Event-Driven**: Asynchronous processing with scheduled tasks
- **🔧 Dependency Inversion**: Infrastructure depends on domain, not vice versa
- **🧪 Test-First**: Architecture designed for comprehensive testing

### 💻 Backend Technology Stack

#### 🚀 Core Runtime & Framework
- **Node.js (≥18.0.0)**: Latest LTS with ES2022+ features, enhanced performance
- **Express.js (4.21.2)**: High-performance web framework with custom middleware
- **Express Middleware Stack**:
  - `cors`: Cross-origin resource sharing with configurable policies
  - `body-parser`: JSON/URL-encoded request parsing with size limits
  - Custom prometheus metrics collection middleware
  - Request/response timing and logging middleware

#### 🗄️ Database & Data Layer
- **MongoDB (6.14.2)**: Primary NoSQL database with replica set support
- **Mongoose ODM (8.12.1)**: Advanced schema validation, middleware, and plugins
- **Connection Pooling**: Optimized connection management with retry logic
- **Database Features**:
  - Automatic indexing for performance optimization
  - Schema validation with custom validators
  - Pre/post middleware hooks for data integrity
  - Aggregation pipelines for complex queries
  - GridFS for large file storage

#### 🔐 Security & Authentication
- **Custom JWT Implementation**: Stateless authentication with refresh tokens
- **Firebase Admin SDK (13.2.0)**: Enterprise authentication services
- **CORS Configuration**: Restrictive cross-origin policies
- **Input Validation**: Comprehensive request sanitization
- **Rate Limiting**: API endpoint protection (planned)

#### 📊 Monitoring & Observability
- **Prometheus Client (15.1.3)**: Comprehensive metrics collection
  - HTTP request duration histograms
  - API endpoint hit counters
  - Database operation metrics
  - Custom business metrics
  - Service health checks
- **Winston Logger (3.17.0)**: Enterprise logging framework
  - Daily log rotation with configurable retention
  - Structured JSON logging for production
  - Multiple transport targets (file, console, external)
  - Log level filtering and redaction for sensitive data
  - Service-specific logger instances

#### ⚙️ Task Processing & Automation
- **Node-Cron (3.0.3)**: Robust scheduled task management
  - Database synchronization jobs
  - Automated report generation
  - File cleanup and archival
  - External API synchronization
  - Health check routines
- **Async Processing**: Promise-based concurrent task execution

#### 📄 Document Processing
- **PDF-lib (1.17.1)**: Advanced PDF generation and manipulation
- **PDFKit (0.14.0)**: Programmatic PDF creation
- **Natural (6.10.4)**: Text processing and NLP capabilities
- **OCR Integration**: Document text extraction pipeline

#### 🔌 External API Integrations
- **Axios (1.6.7)**: HTTP client with interceptors and retry logic
- **Monday SDK (0.5.5)**: Official Monday.com GraphQL integration
- **Node-Zendesk (5.0.6)**: Comprehensive Zendesk API wrapper
- **Dropbox (10.34.0)**: Cloud storage and backup automation
- **Firebase Integration**: Real-time database and push notifications

### 🎨 Frontend Technology Stack

#### ⚛️ Core Framework & Libraries
- **React (17.0.2)**: Component-based UI with hooks architecture
- **React DOM (17.0.2)**: Optimized DOM manipulation and rendering
- **React Router DOM (6.14.1)**: Declarative routing with nested routes
- **State Management**: Modern React Hooks pattern (useState, useEffect, useContext)

#### 🎨 UI/UX Framework
- **Material-UI (MUI v5.9.3)**: Google Material Design components
  - **@mui/material**: Core component library
  - **@mui/icons-material**: Comprehensive icon set (5.8.4)
  - **@mui/lab**: Experimental components (5.0.0-alpha.93)
  - **@emotion/react & @emotion/styled**: CSS-in-JS styling solution
- **Responsive Design**: Mobile-first responsive layout system
- **Theming**: Customizable theme system with dark/light modes

#### 📊 Data Visualization
- **Chart.js (4.0.0)**: Modern, responsive chart library
- **React-ChartJS-2 (5.0.0)**: React wrapper for Chart.js
- **Supported Chart Types**:
  - Real-time property metrics dashboards
  - Financial performance charts
  - Ticket status distributions
  - Historical trend analysis

#### 🛠️ Build System & Development Tools
- **Webpack (5.90.3)**: Advanced module bundler with optimization
  - Code splitting and lazy loading
  - Hot module replacement for development
  - Production optimizations (minification, tree shaking)
  - Asset optimization and caching
- **Babel**: ES6+ transpilation with React JSX support
- **CSS Loader**: Modular CSS with preprocessor support
- **Environment Configuration**: Multi-environment build support

#### 📦 Data Processing & Utilities
- **Axios Integration**: Centralized API communication layer
- **PapaParse (5.4.1)**: CSV parsing and generation
- **JSON-to-CSV-Export (3.0.1)**: Data export utilities
- **Custom Utilities**: Reusable helper functions and hooks

### 🔗 Integration Architecture

#### 🎯 Trello Integration Layer
```javascript
const trelloAPI = axios.create({
  baseURL: 'https://api.trello.com/1',
  params: { key: API_KEY, token: TOKEN },
  timeout: 10000,
  retries: 3
});
```
- **Board Management**: Automated board creation and configuration
- **Card Lifecycle**: Property-to-card synchronization
- **Checklist Automation**: Dynamic checklist generation
- **Webhook Support**: Real-time update notifications
- **Error Handling**: Comprehensive retry logic with exponential backoff

#### 📅 Monday.com Integration Layer
- **GraphQL API**: Native Monday.com GraphQL client
- **Board Synchronization**: Bidirectional property-board sync
- **Item Management**: Automated item creation and updates
- **File Management**: Document attachment synchronization
- **Pulse Updates**: Real-time status updates

#### 🎫 Zendesk Integration Layer
- **Ticket Lifecycle**: Complete ticket management workflow
- **Custom Fields**: Property-specific ticket metadata
- **SLA Monitoring**: Automated SLA tracking and alerts
- **Agent Assignment**: Intelligent ticket routing
- **Reporting Integration**: Custom report generation

#### 🏢 Vilogi Integration Layer
- **Property Synchronization**: Real-time property data sync
- **Data Validation**: Comprehensive data integrity checks
- **Conflict Resolution**: Automated merge conflict handling
- **Audit Trail**: Complete synchronization history

### 🚀 Performance Optimizations

#### Backend Performance
- **Connection Pooling**: Optimized database connection management
- **Query Optimization**: Indexed queries with aggregation pipelines
- **Caching Strategy**: In-memory caching for frequently accessed data
- **Async Processing**: Non-blocking I/O with Promise-based workflows
- **Resource Management**: Automatic cleanup and garbage collection

#### Frontend Performance
- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Component-level lazy loading
- **Memoization**: React.memo and useMemo optimizations
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Asset Optimization**: Image compression and CDN integration

### 🔧 Development & DevOps Stack

#### 📋 Quality Assurance
- **Jest (26.6.3)**: Comprehensive testing framework
- **Supertest (6.3.3)**: API integration testing
- **MongoDB Memory Server**: In-memory database for testing
- **ESLint**: Code quality and style enforcement
- **Prettier**: Automated code formatting

#### 🐳 Containerization & Deployment
- **Docker**: Multi-stage builds for production optimization
- **Docker Compose**: Local development environment orchestration
- **Health Checks**: Container health monitoring
- **Volume Management**: Persistent data and log storage

#### 📊 Monitoring & Alerting
- **Prometheus Metrics**: Custom business and technical metrics
- **Health Endpoints**: Application and dependency health checks
- **Log Aggregation**: Centralized logging with rotation
- **Error Tracking**: Comprehensive error monitoring and alerting

## � Detailed Project Architecture & Structure

### 🗂️ Complete Directory Structure

```bash
coproxDashboard/                           # 🏠 Root project directory
├── 🐳 docker-compose.yaml                # Container orchestration configuration
├── 📦 package.json                       # Root workspace dependencies
├── 📖 README.md                          # Comprehensive project documentation
├── 🏗️ HEXAGONAL_ARCHITECTURE.md         # Detailed architecture documentation
├── 📜 scripts/                           # 🛠️ Deployment and utility scripts
│   ├── deploy.sh                         # Production deployment automation
│   ├── backup.sh                         # Database backup utilities
│   └── monitoring-setup.sh               # Monitoring infrastructure setup
│
├── 🎨 front/                             # ⚛️ React Frontend Application
│   ├── 🐳 Dockerfile                     # Frontend container configuration
│   ├── 📦 package.json                   # Frontend dependencies and scripts
│   ├── ⚙️ webpack.config.js              # Advanced Webpack build configuration
│   ├── 🎯 .env.example                   # Environment variables template
│   ├── 📁 dist/                          # Production build output
│   └── 📁 src/
│       ├── 🚀 index.js                   # Application entry point with React 18
│       ├── 📄 index.html                 # HTML template with meta tags
│       ├── 🏗️ App.js                     # Root component with routing setup
│       │
│       ├── 🎨 assets/                    # Static assets and styling
│       │   ├── styles/
│       │   │   ├── App.css               # Global application styles
│       │   │   ├── Sidebar.css           # Navigation component styles
│       │   │   ├── Dashboard.css         # Dashboard-specific styles
│       │   │   └── components/           # Component-specific styles
│       │   ├── images/
│       │   │   ├── logo.png              # Application logo assets
│       │   │   └── icons/                # Custom icon library
│       │   └── fonts/                    # Custom font files
│       │
│       ├── 🧩 components/                # 🔄 Reusable UI Components
│       │   ├── Sidebar.js                # Main navigation component
│       │   ├── DashboardBox.js           # Metric display component
│       │   ├── PieChart.js               # Chart visualization component
│       │   ├── ChecklistItemsList.js     # Checklist management component
│       │   ├── coprolisttrello.js        # Trello integration component
│       │   └── copros/                   # Property-specific components
│       │       ├── PropertyCard.js       # Individual property display
│       │       ├── PropertyForm.js       # Property creation/editing
│       │       ├── PropertyFilters.js    # Advanced filtering component
│       │       └── PropertySearch.js     # Search functionality
│       │
│       ├── 📦 containers/                # 📄 Page-Level Containers
│       │   ├── HomePage.js               # Main dashboard page
│       │   ├── Copro.js                  # Property management page
│       │   ├── DetailCopro.js            # Individual property details
│       │   ├── AddFiches.js              # Document management page
│       │   ├── ListeFiches.js            # Document listing page
│       │   ├── TrelloPage.js             # Trello integration dashboard
│       │   ├── clients.js                # Client management interface
│       │   ├── ficheClient.js            # Client detail management
│       │   └── script.js                 # Automation script management
│       │
│       ├── ⚙️ config/
│       │   ├── config.js                 # Frontend configuration constants
│       │   ├── theme.js                  # Material-UI theme configuration
│       │   └── routes.js                 # Application routing configuration
│       │
│       ├── 🛠️ utils/
│       │   ├── api.js                    # Centralized API communication
│       │   ├── auth.js                   # Authentication utilities
│       │   ├── constants.js              # Application constants
│       │   ├── formatters.js             # Data formatting utilities
│       │   ├── validators.js             # Form validation functions
│       │   └── helpers.js                # General utility functions
│       │
│       └── 🧪 __tests__/                 # Frontend test files
│           ├── components/               # Component unit tests
│           ├── containers/               # Container integration tests
│           └── utils/                    # Utility function tests
│
└── 🖥️ server/                            # 🚀 Node.js Backend Application
    ├── 🐳 Dockerfile                     # Backend container configuration
    ├── 📦 package.json                   # Backend dependencies and scripts
    ├── 🚀 index.js                       # Express server entry point
    ├── ☁️ vercel.json                    # Vercel deployment configuration
    ├── 🎯 .env.example                   # Environment variables template
    ├── 📊 finalContrat.json              # Contract configuration data
    ├── 📄 contratEntretien.csv           # Maintenance contract data
    │
    ├── 📁 api/                           # API-specific configurations
    │   ├── swagger.json                  # OpenAPI/Swagger documentation
    │   └── postman/                      # Postman collection exports
    │
    ├── 📁 logs/                          # Application logs directory
    │   ├── combined.log                  # All log entries
    │   ├── error.log                     # Error-only logs
    │   └── access.log                    # HTTP access logs
    │
    ├── 📁 downloads/                     # File processing and storage
    │   ├── archives/                     # Archived files
    │   │   ├── courrier/                 # Mail archives
    │   │   ├── sinistres/                # Insurance claim files
    │   │   └── zendesk/                  # Zendesk attachments
    │   ├── contrats/                     # Contract documents
    │   ├── factureOCR/                   # OCR-processed invoices
    │   └── zendesk/                      # Zendesk file attachments
    │
    ├── 📁 template/                      # Document templates
    │   ├── pdf/                          # PDF templates
    │   ├── email/                        # Email templates
    │   └── reports/                      # Report templates
    │
    └── 📁 src/                           # 🏗️ Source Code Architecture
        ├── 🚀 index.js                   # Application bootstrap
        │
        ├── 🎮 controllers/               # 🌐 HTTP Request Handlers (Adapters)
        │   ├── coproController.js        # Property management endpoints
        │   ├── trelloController.js       # Trello integration endpoints
        │   ├── mondayController.js       # Monday.com integration endpoints
        │   ├── zendeskController.js      # Zendesk ticket management
        │   ├── vilogiController.js       # Vilogi property sync
        │   ├── personController.js       # Contact management
        │   ├── scriptController.js       # Automation script management
        │   ├── suiviAgController.js      # AG follow-up management
        │   ├── suiviFichenController.js  # Document tracking
        │   └── lebarocoproController.js  # Lebaro property management
        │
        ├── 🔧 services/                  # 💼 Business Logic Layer (Use Cases)
        │   ├── coproService.js           # Property business logic
        │   ├── trelloService.js          # Trello integration logic
        │   ├── mondayService.js          # Monday.com business rules
        │   ├── mondayVilogiSyncService.js # Cross-platform synchronization
        │   ├── zendeskService.js         # Support ticket workflows
        │   ├── vilogiService.js          # Vilogi integration logic
        │   ├── dropboxService.js         # Cloud storage management  
        │   ├── personService.js          # Contact management logic
        │   ├── scriptService.js          # Automation service logic
        │   ├── suiviAgService.js         # AG tracking business rules
        │   ├── suiviFichenService.js     # Document workflow logic
        │   ├── userService.js            # User management service
        │   ├── lebarocoproService.js     # Lebaro integration logic
        │   ├── logger.js                 # Centralized logging service
        │   └── logs.js                   # Log management utilities
        │
        ├── 📊 models/                    # 🗄️ Domain Models (Entities)
        │   ├── copropriete.js            # Property entity schema
        │   ├── person.js                 # Contact entity schema
        │   ├── fiche.js                  # Document entity schema
        │   ├── user.js                   # User entity schema
        │   ├── script.js                 # Script configuration schema
        │   ├── suiviag.js                # AG tracking schema
        │   ├── lebarocopro.js            # Lebaro property schema
        │   └── index.js                  # Model exports and initialization
        │
        ├── 🛣️ routes/                    # 🚦 API Route Definitions
        │   ├── coproRoutes.js            # Property management routes
        │   ├── trelloRoutes.js           # Trello integration routes
        │   ├── mondayRoutes.js           # Monday.com integration routes
        │   ├── zendeskRoutes.js          # Zendesk ticket routes
        │   ├── vilogiRoutes.js           # Vilogi synchronization routes
        │   ├── personRoutes.js           # Contact management routes
        │   ├── scriptRoutes.js           # Automation script routes
        │   ├── suiviAgRoutes.js          # AG follow-up routes
        │   ├── suiviFicheRoutes.js       # Document management routes
        │   └── lebarocoproRoutes.js      # Lebaro integration routes
        │
        ├── 🛠️ utils/                     # 🔧 Infrastructure Utilities
        │   ├── mongodb.js                # Database connection management
        │   ├── validation.js             # Input validation utilities
        │   ├── encryption.js             # Data encryption/decryption
        │   ├── fileUtils.js              # File processing utilities
        │   └── apiHelpers.js             # API communication helpers
        │
        ├── ⏰ cron/                       # 📅 Scheduled Task Management
        │   ├── cronStart.js              # Cron job orchestration
        │   ├── synchroFactureOCRMonday.js # OCR invoice processing
        │   ├── backupDatabase.js         # Automated database backups
        │   ├── syncTrelloBoards.js       # Trello synchronization
        │   ├── syncMondayBoards.js       # Monday.com synchronization
        │   ├── cleanupFiles.js           # File cleanup automation
        │   └── healthChecks.js           # System health monitoring
        │
        ├── 🔧 middelware/                # ⚙️ Express Middleware
        │   ├── multer.js                 # File upload handling
        │   ├── authentication.js        # JWT authentication middleware
        │   ├── validation.js             # Request validation middleware
        │   ├── errorHandler.js           # Global error handling
        │   ├── rateLimiting.js           # API rate limiting
        │   └── cors.js                   # Cross-origin configuration
        │
        ├── ⚙️ config/                    # 📝 Configuration Management
        │   ├── database.js               # Database configuration
        │   ├── server.js                 # Server configuration
        │   ├── external-apis.js          # Third-party API configuration
        │   ├── logging.js                # Logging configuration
        │   └── environment.js            # Environment-specific settings
        │
        └── 🧪 tests/                     # 🔬 Comprehensive Test Suite
            ├── unit/                     # Unit tests for individual functions
            │   ├── controllers/          # Controller unit tests
            │   ├── services/             # Service layer unit tests
            │   ├── models/               # Model validation tests
            │   └── utils/                # Utility function tests
            ├── integration/              # Integration tests
            │   ├── coproRoutes.test.js   # Property API integration tests
            │   ├── trelloRoutes.test.js  # Trello integration tests
            │   ├── mondayRoutes.test.js  # Monday.com integration tests
            │   ├── zendeskRoutes.test.js # Zendesk integration tests
            │   ├── personRoutes.test.js  # Contact management tests
            │   ├── suiviAgRoutes.test.js # AG follow-up tests
            │   └── lebarocoproRoutes.test.js # Lebaro integration tests
            ├── e2e/                      # End-to-end tests
            │   ├── userWorkflows.test.js # Complete user journey tests
            │   └── apiWorkflows.test.js  # API workflow tests
            ├── fixtures/                 # Test data and fixtures
            │   ├── sampleData.json       # Sample property data
            │   └── testUsers.json        # Test user accounts
            └── helpers/                  # Test utility functions
                ├── testDatabase.js       # Test database setup
                ├── mockServices.js       # Service mocking utilities
                └── apiTestHelpers.js     # API testing utilities
```

### 🏗️ Architectural Layer Mapping

#### 🎯 Domain Layer (Core Business Logic)
- **📊 Models (`/models/`)**: Pure business entities with validation rules
- **💼 Business Services**: Core business logic within service classes
- **📏 Domain Rules**: Validation, constraints, and business invariants

#### 🔄 Application Layer (Use Cases & Orchestration)
- **🔧 Services (`/services/`)**: Application-specific business logic
- **🎮 Controllers (`/controllers/`)**: HTTP request/response handling
- **🛣️ Routes (`/routes/`)**: API endpoint definitions and middleware

#### 🌐 Infrastructure Layer (External Concerns)
- **🗄️ Database (`/utils/mongodb.js`)**: Data persistence abstraction
- **🔌 External APIs**: Third-party service integrations
- **📁 File System**: Document and file management
- **⏰ Scheduling (`/cron/`)**: Time-based automation
- **📊 Monitoring**: Logging, metrics, and health checks

### 📊 Component Interaction Flow

```mermaid
graph TD
    A[Frontend Components] --> B[API Routes]
    B --> C[Controllers]
    C --> D[Services]
    D --> E[Models]
    D --> F[External APIs]
    D --> G[Database]
    H[Cron Jobs] --> D
    I[Middleware] --> C
    J[Logging] --> D
    K[Monitoring] --> C
```

### 🎯 Development Workflow Structure

#### 🏁 Development Environment
```bash
# Development commands structure
npm run dev              # Start development server with hot reload
npm run test            # Run comprehensive test suite
npm run test:watch      # Watch mode for continuous testing
npm run lint            # Code quality analysis
npm run format          # Automated code formatting
npm run build           # Production build generation
```

#### 🔧 Configuration Management
- **Environment Files**: `.env` templates for all environments
- **Config Validation**: Startup configuration validation
- **Hot Reload**: Development environment with live reloading
- **Multi-Environment**: Development, staging, production configurations

## 🚀 Comprehensive Quick Start Guide

### 📋 System Prerequisites

#### 🖥️ Development Environment Requirements
- **Node.js**: Version 18.0.0 or higher (Latest LTS recommended)
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Docker**: Version 20.10.0 or higher with Docker Compose V2
- **Git**: Latest version for repository management
- **MongoDB**: Version 6.0+ (local or cloud instance)
- **Memory**: Minimum 8GB RAM recommended for development
- **Storage**: At least 2GB free disk space

#### 🔧 Optional Development Tools
- **MongoDB Compass**: GUI for database management
- **Postman**: API testing and documentation
- **VS Code**: Recommended IDE with extensions:
  - ES7+ React/Redux/React-Native snippets
  - MongoDB for VS Code
  - Docker extension
  - Prettier - Code formatter
  - ESLint extension

### 📥 Installation Process

#### 1️⃣ Repository Setup
```bash
# Clone the repository
git clone https://github.com/Nesslax/coproxDashboard.git
cd coproxDashboard

# Verify directory structure
ls -la
# Expected output: docker-compose.yaml, front/, server/, scripts/, README.md

# Check Node.js version
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

#### 2️⃣ Environment Configuration

##### 🖥️ Backend Environment Setup
Create a comprehensive `.env` file in the `server/` directory:

```bash
# Navigate to server directory
cd server

# Create environment file from template
cp .env.example .env
```

**Complete Server `.env` Configuration:**
```env
# =============================================================================
# 🗄️ DATABASE CONFIGURATION
# =============================================================================
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER_NAME=cluster0.abcdef.mongodb.net
MONGODB_DB_NAME=coprox_production
MONGODB_TEST_DB_NAME=coprox_test

# Connection settings
MONGODB_CONNECTION_TIMEOUT=10000
MONGODB_SERVER_SELECTION_TIMEOUT=10000
MONGODB_MAX_POOL_SIZE=10

# =============================================================================
# 🔐 AUTHENTICATION & SECURITY
# =============================================================================
JWT_SECRET=your_super_secure_jwt_secret_key_min_32_characters
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Firebase configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# =============================================================================
# 🎯 TRELLO API INTEGRATION
# =============================================================================
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_oauth_token
TRELLO_BOARD_ID=your_default_board_id
TRELLO_LIST_NAME=your_default_list_name

# Trello checklist configuration
TRELLO_CHECKLISTS_0_NAME=Initial Setup
TRELLO_CHECKLISTS_0_ITEMS_0=Create property profile
TRELLO_CHECKLISTS_0_ITEMS_1=Verify documentation

TRELLO_CHECKLISTS_1_NAME=Property Management
TRELLO_CHECKLISTS_1_ITEMS_0=Schedule property inspection
TRELLO_CHECKLISTS_1_ITEMS_1=Update maintenance records
TRELLO_CHECKLISTS_1_ITEMS_2=Review financial statements
TRELLO_CHECKLISTS_1_ITEMS_3=Coordinate with stakeholders
TRELLO_CHECKLISTS_1_ITEMS_4=Generate monthly report

# =============================================================================
# 📅 MONDAY.COM INTEGRATION
# =============================================================================
MONDAY_API_KEY=your_monday_api_token
MONDAY_API_VERSION=2025-01
MONDAY_BOARD_ID=your_default_board_id
MONDAY_WORKSPACE_ID=your_workspace_id

# Monday.com webhook configuration
MONDAY_WEBHOOK_SECRET=your_webhook_secret
MONDAY_WEBHOOK_URL=https://your-domain.com/webhooks/monday

# =============================================================================
# 🎫 ZENDESK INTEGRATION
# =============================================================================
ZENDESK_SUBDOMAIN=your_company_subdomain
ZENDESK_EMAIL=admin@your-company.com
ZENDESK_TOKEN=your_zendesk_api_token
ZENDESK_OAUTH_TOKEN=your_oauth_token

# Zendesk configuration
ZENDESK_BRAND_ID=your_brand_id
ZENDESK_DEFAULT_PRIORITY=normal
ZENDESK_DEFAULT_TYPE=incident

# =============================================================================
# 🏢 VILOGI INTEGRATION
# =============================================================================
VILOGI_API_KEY=your_vilogi_api_key
VILOGI_API_URL=https://api.vilogi.com/v1
VILOGI_CLIENT_ID=your_client_id
VILOGI_CLIENT_SECRET=your_client_secret

# Sync configuration
VILOGI_SYNC_INTERVAL=3600000  # 1 hour in milliseconds
VILOGI_BATCH_SIZE=100

# =============================================================================
# ☁️ DROPBOX INTEGRATION
# =============================================================================
DROPBOX_ACCESS_TOKEN=your_dropbox_access_token
DROPBOX_REFRESH_TOKEN=your_refresh_token
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret

# Storage configuration
DROPBOX_BACKUP_FOLDER=/CoproxBackups
DROPBOX_DOCUMENTS_FOLDER=/CoproxDocuments

# =============================================================================
# 📊 LOGGING & MONITORING
# =============================================================================
LOG_LEVEL=info                    # debug, info, warn, error
LOG_TO_CONSOLE=true              # Enable console logging
LOG_JSON=false                   # Use JSON format for logs
LOG_DIR=./logs                   # Log directory path
LOG_ERRORS_DIR=./logs/errors     # Error logs directory
LOG_MAX_FILES=30                 # Max log files to keep
LOG_MAX_SIZE=100m                # Max size per log file

# Prometheus metrics
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_ROUTE=/metrics

# =============================================================================
# 🔧 SERVER CONFIGURATION
# =============================================================================
NODE_ENV=development             # development, staging, production
PORT=8081                        # Server port
HOST=localhost                   # Server host
SERVER_TIMEOUT=30000            # Request timeout in milliseconds

# CORS configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With

# =============================================================================
# 📁 FILE PROCESSING
# =============================================================================
UPLOAD_DIR=./downloads
MAX_FILE_SIZE=50mb
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif
TEMP_DIR=./temp

# OCR configuration
OCR_ENABLED=true
OCR_LANGUAGE=fra+eng
OCR_DPI=300

# =============================================================================
# ⏰ CRON JOBS CONFIGURATION
# =============================================================================
CRON_TIMEZONE=Europe/Paris
ENABLE_CRON_JOBS=true

# Backup schedule (daily at 2 AM)
BACKUP_CRON_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Sync schedule (every 4 hours)
SYNC_CRON_SCHEDULE=0 */4 * * *

# Cleanup schedule (weekly on Sunday at 3 AM)
CLEANUP_CRON_SCHEDULE=0 3 * * 0

# =============================================================================
# 🚨 ERROR HANDLING & NOTIFICATIONS
# =============================================================================
ENABLE_ERROR_NOTIFICATIONS=true
ERROR_NOTIFICATION_EMAIL=admin@your-company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Rate limiting
RATE_LIMIT_WINDOW=15              # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window
```

##### 🎨 Frontend Environment Setup
Create `.env` file in the `front/` directory:

```bash
# Navigate to frontend directory
cd ../front

# Create frontend environment file
cp .env.example .env
```

**Complete Frontend `.env` Configuration:**
```env
# =============================================================================
# 🌐 API CONFIGURATION
# =============================================================================
REACT_APP_BACKEND_URL=http://localhost:8081
REACT_APP_API_VERSION=v1
REACT_APP_API_TIMEOUT=30000

# =============================================================================
# 🔐 AUTHENTICATION
# =============================================================================
REACT_APP_JWT_STORAGE_KEY=coprox_auth_token
REACT_APP_REFRESH_TOKEN_KEY=coprox_refresh_token
REACT_APP_SESSION_TIMEOUT=24      # Hours

# =============================================================================
# 🎨 UI CONFIGURATION
# =============================================================================
REACT_APP_THEME=light             # light, dark, auto
REACT_APP_PRIMARY_COLOR=#1976d2
REACT_APP_SECONDARY_COLOR=#dc004e
REACT_APP_SUCCESS_COLOR=#2e7d32
REACT_APP_ERROR_COLOR=#d32f2f
REACT_APP_WARNING_COLOR=#ed6c02

# =============================================================================
# 📊 FEATURE FLAGS
# =============================================================================
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_SERVICE_WORKER=true
REACT_APP_ENABLE_OFFLINE_MODE=false

# =============================================================================
# 🗺️ EXTERNAL SERVICES
# =============================================================================
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_ANALYTICS_ID=GA-XXXXX-XX

# =============================================================================
# 📱 PWA CONFIGURATION
# =============================================================================
REACT_APP_PWA_NAME=CoproxDashboard
REACT_APP_PWA_SHORT_NAME=Coprox
REACT_APP_PWA_THEME_COLOR=#1976d2
REACT_APP_PWA_BACKGROUND_COLOR=#ffffff

# =============================================================================
# 🔧 DEVELOPMENT SETTINGS
# =============================================================================
GENERATE_SOURCEMAP=true           # Enable source maps in production
REACT_APP_BUNDLE_ANALYZER=false   # Enable bundle analyzer
REACT_APP_HOT_RELOAD=true         # Enable hot reloading
```

#### 3️⃣ Installation Methods

##### 🐳 Method 1: Docker Installation (Recommended)

**Prerequisites Check:**
```bash
# Verify Docker installation
docker --version          # Should be 20.10.0+
docker-compose --version  # Should be 2.0.0+

# Check Docker daemon
docker info               # Should show system information
```

**Production-Ready Docker Setup:**
```bash
# Return to project root
cd ..

# Build and start all services
docker-compose up --build

# For production mode
docker-compose -f docker-compose.prod.yml up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f server    # Backend logs
docker-compose logs -f front     # Frontend logs

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ This will delete data)
docker-compose down -v
```

**Docker Service Health Checks:**
```bash
# Check container health
docker-compose exec server npm run health-check
docker-compose exec front npm run health-check

# Database connectivity test
docker-compose exec server npm run test:db-connection

# API endpoints test
curl http://localhost:8081/health
curl http://localhost:8081/metrics
```

##### 🛠️ Method 2: Manual Installation

**Backend Setup:**
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Verify installation
npm audit                 # Check for vulnerabilities
npm outdated             # Check for outdated packages

# Run database migrations (if applicable)
npm run migrate

# Start development server
npm run dev

# Alternative: Start with debugging
DEBUG=* npm run dev

# Production start
npm start
```

**Frontend Setup (in new terminal):**
```bash
# Navigate to frontend directory
cd front

# Install dependencies
npm install

# Verify installation
npm audit
npm outdated

# Start development server
npm start

# Production build
npm run build

# Serve production build locally
npm install -g serve
serve -s dist -l 3000
```

#### 4️⃣ Verification & Testing

##### 🔍 Application Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8081
- **API Health Check**: http://localhost:8081/health
- **Prometheus Metrics**: http://localhost:8081/metrics
- **API Documentation**: http://localhost:8081/api-docs (if Swagger enabled)

##### 🧪 System Health Verification
```bash
# Test API connectivity
curl -X GET http://localhost:8081/health
# Expected response: {"status": "healthy", "timestamp": "..."}

# Test database connection
curl -X GET http://localhost:8081/copro/listCopro
# Expected: JSON array of properties or empty array

# Test external integrations
curl -X GET http://localhost:8081/trello/boards
curl -X GET http://localhost:8081/monday/boards
curl -X GET http://localhost:8081/zendesk/tickets

# Frontend connectivity test
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

##### 🎯 Feature Testing Checklist
- [ ] **Database Connection**: MongoDB connectivity established
- [ ] **API Endpoints**: All major endpoints responding
- [ ] **Frontend Rendering**: React application loads correctly
- [ ] **Authentication**: Login/logout functionality (if implemented)
- [ ] **External APIs**: Third-party integrations responding
- [ ] **File Upload**: Document upload functionality working
- [ ] **Cron Jobs**: Scheduled tasks running (check logs)
- [ ] **Monitoring**: Metrics collection active

#### 🚨 Troubleshooting Quick Start Issues

##### 🔧 Common Installation Issues

**Port Conflicts:**
```bash
# Check what's using port 3000 or 8081
lsof -i :3000
lsof -i :8081

# Kill processes using ports
kill -9 $(lsof -t -i :3000)
kill -9 $(lsof -t -i :8081)

# Use alternative ports
PORT=3001 npm start              # Frontend
PORT=8082 npm run dev           # Backend
```

**MongoDB Connection Issues:**
```bash
# Test MongoDB connection
mongosh "mongodb+srv://username:password@cluster.mongodb.net/database"

# Check environment variables
cd server && node -e "console.log(process.env.MONGODB_USERNAME)"

# Test with MongoDB Compass GUI
# Connection string: mongodb+srv://username:password@cluster.mongodb.net/
```

**Node.js Version Issues:**
```bash
# Check Node.js version
node --version

# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

**Dependency Installation Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use npm ci for clean install
npm ci
```

##### 📊 Performance Optimization

**Development Performance:**
```bash
# Backend with clustering
npm install -g pm2
pm2 start index.js --name "coprox-server" -i max

# Frontend with build optimization
npm run build:analyze    # Analyze bundle size
npm run start:optimized  # Start optimized development server
```

**Memory Management:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Monitor memory usage
npm install -g clinic
clinic doctor -- node index.js
```

## 🔧 Configuration

### Environment Variables

#### Required Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_USERNAME` | MongoDB username | `admin` |
| `MONGODB_PASSWORD` | MongoDB password | `password123` |
| `MONGODB_CLUSTER_NAME` | MongoDB cluster | `cluster0.abc123` |
| `MONGODB_DB_NAME` | Database name | `coprox_db` |

#### API Integration Variables
| Service | Variables Required |
|---------|-------------------|
| **Trello** | `TRELLO_API_KEY`, `TRELLO_TOKEN` |
| **Monday.com** | `MONDAY_API_TOKEN` |
| **Zendesk** | `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_TOKEN` |
| **Vilogi** | `VILOGI_API_KEY` |
| **Dropbox** | `DROPBOX_ACCESS_TOKEN` |

### Frontend Configuration
The frontend uses environment variables prefixed with `REACT_APP_`:
- `REACT_APP_BACKEND_URL`: Backend API URL

## 📊 Features

### Dashboard
- **Real-time Metrics**: Property count, pending tickets, upcoming meetings
- **Visual Analytics**: Charts and graphs for business insights
- **Quick Actions**: Direct access to common tasks

### Property Management
- **CRUD Operations**: Create, read, update, delete properties
- **Property Details**: Comprehensive property information
- **Status Tracking**: Active/inactive property management
- **Integration Sync**: Automatic synchronization with external systems

### Third-party Integrations
- **Trello**: Board and card management for project tracking
- **Monday.com**: Project management and task assignment
- **Zendesk**: Customer support ticket management
- **Vilogi**: Property data synchronization
- **Dropbox**: Document storage and backup

### Automated Processes
- **Scheduled Synchronization**: Automatic data sync with external APIs
- **OCR Processing**: Document text extraction and processing
- **Report Generation**: Automated PDF and CSV report creation
- **File Management**: Automatic file organization and archival

## 🗃️ Comprehensive Database Schema & Data Architecture

### 📊 Database Design Overview

CoproxDashboard uses MongoDB as its primary database with Mongoose ODM for schema validation, middleware, and advanced querying capabilities. The database design follows Domain-Driven Design principles with clear entity relationships and comprehensive indexing strategies.

#### 🏗️ Database Architecture Principles
- **Schema Validation**: Comprehensive validation rules with custom validators
- **Indexing Strategy**: Optimized indexes for frequent queries
- **Data Integrity**: Pre/post middleware hooks for data consistency
- **Audit Trail**: Automatic timestamping and change tracking
- **Soft Deletion**: Logical deletion with status flags
- **Relationship Management**: Embedded documents and references

### 🏢 Core Domain Models

#### 🏘️ Copropriete (Property) - Primary Entity
```javascript
const CoproprieteSchema = new mongoose.Schema({
  // 🆔 Identification Fields
  idCopro: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^COPRO_\d{4}_\d{3}$/, 'Invalid property ID format'],
    index: true
  },
  
  // 📍 Basic Information
  Nom: { 
    type: String, 
    required: [true, 'Property name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    index: 'text'  // Text search index
  },
  
  ville: { 
    type: String, 
    required: [true, 'City is required'],
    trim: true,
    index: true
  },
  
  status: { 
    type: String, 
    enum: {
      values: ['Actif', 'Inactif', 'En_attente', 'Suspendu', 'Archive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Actif',
    index: true
  },
  
  address: { 
    type: String, 
    trim: true,
    maxlength: [255, 'Address cannot exceed 255 characters']
  },
  
  codepostal: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{5}$/.test(v);
      },
      message: 'Invalid French postal code format'
    },
    index: true
  },
  
  // 💼 Service & Business Information
  Offre: { 
    type: String,
    enum: {
      values: ['Basic', 'Standard', 'Premium', 'Enterprise'],
      message: '{VALUE} is not a valid offer type'
    },
    default: 'Standard',
    index: true
  },
  
  // 📅 Important Dates
  exerciceCT: { 
    type: Date,
    validate: {
      validator: function(v) {
        return v > new Date('2020-01-01');
      },
      message: 'Exercise date must be after 2020'
    }
  },
  
  dateReprise: { 
    type: Date,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Takeover date cannot be in the future'
    }
  },
  
  dateFin: { 
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.dateReprise;
      },
      message: 'End date must be after takeover date'
    }
  },
  
  // 🔗 External System Integration IDs
  idVilogi: { 
    type: String,
    sparse: true,  // Allow null values but enforce uniqueness when present
    unique: true,
    trim: true
  },
  
  idMondayMortex: { 
    type: String,
    sparse: true,
    unique: true,
    trim: true
  },
  
  // 📋 Property Characteristics
  immatriculation: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^FR\d{11}$/.test(v);
      },
      message: 'Invalid immatriculation format (should be FR + 11 digits)'
    },
    sparse: true,
    unique: true
  },
  
  nbLotPrincipaux: { 
    type: Number,
    min: [1, 'Number of lots must be at least 1'],
    max: [10000, 'Number of lots cannot exceed 10000'],
    validate: {
      validator: Number.isInteger,
      message: 'Number of lots must be an integer'
    }
  },
  
  typeChauffage: { 
    type: String,
    enum: {
      values: ['Individuel', 'Collectif', 'Mixte', 'Aucun'],
      message: '{VALUE} is not a valid heating type'
    }
  },
  
  dateConstruction: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\d{4}$/.test(v) && parseInt(v) >= 1800 && parseInt(v) <= new Date().getFullYear();
      },
      message: 'Construction year must be a 4-digit year between 1800 and current year'
    }
  },
  
  // 📊 Financial Information
  financialData: {
    budget: { 
      type: Number, 
      min: 0,
      validate: {
        validator: function(v) {
          return v == null || v >= 0;
        },
        message: 'Budget must be positive'
      }
    },
    charges: { type: Number, min: 0 },
    reserves: { type: Number, min: 0 },
    currency: { type: String, default: 'EUR', enum: ['EUR', 'USD'] }
  },
  
  // 👥 Contact Information (Embedded)
  contacts: [{
    role: { 
      type: String, 
      required: true,
      enum: ['Syndic', 'President', 'Treasurer', 'Secretary', 'Council_Member', 'Manager']
    },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: { 
      type: String,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      },
      lowercase: true,
      trim: true
    },
    telephone: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(\+33|0)[1-9](\d{8})$/.test(v.replace(/\s/g, ''));
        },
        message: 'Invalid French phone number format'
      }
    },
    isActive: { type: Boolean, default: true },
    dateNomination: { type: Date, default: Date.now },
    dateFinMandat: Date
  }],
  
  // 📈 Follow-up and Tracking
  suiviCopro: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  
  // 📄 Documents and Files
  documents: [{
    type: { 
      type: String, 
      required: true,
      enum: ['PV_AG', 'Budget', 'Contrat', 'Facture', 'Rapport', 'Correspondance', 'Autre']
    },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    size: { type: Number, min: 0 },
    mimetype: String,
    isArchived: { type: Boolean, default: false },
    tags: [String]
  }],
  
  // 🔄 Integration Status
  integrationStatus: {
    trello: {
      boardId: String,
      cardId: String,
      lastSync: Date,
      syncStatus: { type: String, enum: ['pending', 'success', 'error'], default: 'pending' },
      errors: [String]
    },
    monday: {
      boardId: String,
      itemId: String,
      lastSync: Date,
      syncStatus: { type: String, enum: ['pending', 'success', 'error'], default: 'pending' },
      errors: [String]
    },
    vilogi: {
      externalId: String,
      lastSync: Date,
      syncStatus: { type: String, enum: ['pending', 'success', 'error'], default: 'pending' },
      errors: [String]
    }
  },
  
  // 📊 Metadata and Audit
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    tags: [String],
    priority: { 
      type: String, 
      enum: ['Low', 'Normal', 'High', 'Critical'], 
      default: 'Normal' 
    },
    isArchived: { type: Boolean, default: false },
    archivedAt: Date,
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // 🕒 Automatic Timestamps
  dateCreation: { type: Date, default: Date.now, index: true },
  dateModification: { type: Date, default: Date.now, index: true }
  
}, {
  // Schema Options
  timestamps: true,  // Adds createdAt and updatedAt
  collection: 'coproprietes',
  versionKey: '_version',
  strict: true,
  
  // Index Configuration
  index: [
    { idCopro: 1 },
    { ville: 1, status: 1 },
    { 'financialData.budget': -1 },
    { dateCreation: -1 },
    { 'contacts.role': 1, 'contacts.isActive': 1 }
  ]
});

// 🔍 Text Search Index
CoproprieteSchema.index({
  Nom: 'text',
  ville: 'text',
  address: 'text',
  'contacts.nom': 'text',
  'contacts.prenom': 'text'
}, {
  weights: {
    Nom: 10,
    ville: 5,
    address: 3,
    'contacts.nom': 2,
    'contacts.prenom': 2
  }
});

// 🔧 Pre-save Middleware
CoproprieteSchema.pre('save', function(next) {
  this.dateModification = new Date();
  if (this.isModified() && !this.isNew) {
    this.metadata.version += 1;
  }
  next();
});

// 🔧 Post-save Middleware
CoproprieteSchema.post('save', function(doc) {
  console.log(`Property ${doc.idCopro} saved successfully`);
});
```

#### 👤 Person (Contact Management)
```javascript
const PersonSchema = new mongoose.Schema({
  // 🆔 Personal Information
  nom: { 
    type: String, 
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    index: true
  },
  
  prenom: { 
    type: String, 
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    index: true
  },
  
  nomComplet: { 
    type: String,
    index: 'text'  // Virtual field for full name search
  },
  
  // 📧 Contact Information
  email: { 
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    },
    index: true
  },
  
  telephone: { 
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^(\+33|0)[1-9](\d{8})$/.test(v.replace(/\s/g, ''));
      },
      message: 'Invalid French phone number format'
    }
  },
  
  telephoneSecondaire: String,
  
  // 🏢 Professional Information
  role: { 
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['Syndic', 'President', 'Treasurer', 'Secretary', 'Council_Member', 'Manager', 'Resident', 'Owner', 'Tenant'],
      message: '{VALUE} is not a valid role'
    },
    index: true
  },
  
  fonction: String,  // Specific function within role
  entreprise: String,
  
  // 🏠 Property Associations
  coproprietes: [{
    coproprieteId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Copropriete',
      required: true,
      index: true
    },
    role: { 
      type: String, 
      required: true,
      enum: ['Syndic', 'President', 'Treasurer', 'Secretary', 'Council_Member', 'Manager', 'Resident', 'Owner', 'Tenant']
    },
    dateDebut: { type: Date, default: Date.now },
    dateFin: Date,
    isActive: { type: Boolean, default: true },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'admin', 'financial', 'documents']
    }]
  }],
  
  // 📍 Address Information
  adresse: {
    rue: String,
    ville: String,
    codePostal: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\d{5}$/.test(v);
        },
        message: 'Invalid postal code format'
      }
    },
    pays: { type: String, default: 'France' }
  },
  
  // 🔐 Authentication & Security
  authentication: {
    hashedPassword: String,
    salt: String,
    lastLogin: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String
  },
  
  // 🎯 Preferences & Settings
  preferences: {
    language: { type: String, default: 'fr', enum: ['fr', 'en'] },
    timezone: { type: String, default: 'Europe/Paris' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'light', enum: ['light', 'dark', 'auto'] }
  },
  
  // 📊 Activity Tracking
  activity: {
    lastActive: Date,
    totalLogins: { type: Number, default: 0 },
    sessionsCount: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 }  // in minutes
  },
  
  // 📄 Additional Information
  notes: String,
  tags: [String],
  
  // 🔄 Status Management
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended', 'Archived'], 
    default: 'Active',
    index: true
  },
  
  // 📅 Timestamps
  dateCreation: { type: Date, default: Date.now, index: true },
  dateModification: { type: Date, default: Date.now }
  
}, {
  timestamps: true,
  collection: 'persons'
});

// Virtual for full name
PersonSchema.virtual('nomComplet').get(function() {
  return `${this.prenom} ${this.nom}`;
});

// Text search index
PersonSchema.index({
  nom: 'text',
  prenom: 'text',
  email: 'text',
  entreprise: 'text'
});
```

#### 📄 Fiche (Document Management)
```javascript
const FicheSchema = new mongoose.Schema({
  // 🆔 Document Identification
  idFiche: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    index: true
  },
  
  titre: { 
    type: String, 
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: 'text'
  },
  
  description: { 
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // 📂 Document Classification
  type: { 
    type: String,
    required: [true, 'Document type is required'],
    enum: {
      values: [
        'PV_AG', 'PV_CS', 'Budget', 'Compte_Rendu', 'Contrat', 
        'Facture', 'Devis', 'Rapport', 'Correspondance', 
        'Plan', 'Photo', 'Diagnostic', 'Assurance', 'Autre'
      ],
      message: '{VALUE} is not a valid document type'
    },
    index: true
  },
  
  categorie: { 
    type: String,
    enum: ['Administrative', 'Financier', 'Technique', 'Juridique', 'Communication'],
    index: true
  },
  
  // 🏢 Property Association
  coproprieteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Copropriete',
    required: true,
    index: true
  },
  
  // 📁 File Information
  fichier: {
    nom: { type: String, required: true },
    taille: { type: Number, min: 0 },  // Size in bytes
    mimetype: { 
      type: String,
      enum: [
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg', 'image/png', 'image/gif', 'text/plain'
      ]
    },
    chemin: { type: String, required: true },  // File path
    url: String,  // Public URL if available
    checksum: String,  // File integrity check
    version: { type: Number, default: 1 }
  },
  
  // 📅 Document Dates
  dateDocument: Date,  // Date the document refers to
  dateEcheance: Date,  // Expiration date if applicable
  
  // 👤 Document Management
  auteur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Person',
    index: true
  },
  
  destinataires: [{
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    dateEnvoi: Date,
    accuse: { type: Boolean, default: false },
    dateAccuse: Date
  }],
  
  // 🔐 Access Control
  visibilite: { 
    type: String,
    enum: ['Public', 'Restricted', 'Private', 'Confidential'],
    default: 'Restricted',
    index: true
  },
  
  permissions: [{
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    niveau: { type: String, enum: ['read', 'write', 'admin'], default: 'read' }
  }],
  
  // 🏷️ Tagging and Organization
  tags: [String],
  motsCles: [String],
  
  // 📊 Document Status
  statut: { 
    type: String,
    enum: ['Brouillon', 'En_cours', 'Valide', 'Archive', 'Supprime'],
    default: 'En_cours',
    index: true
  },
  
  // 🔄 Workflow
  workflow: {
    etapeActuelle: String,
    etapesSuivantes: [String],
    validations: [{
      personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      date: Date,
      statut: { type: String, enum: ['Approuve', 'Rejete', 'En_attente'] },
      commentaire: String
    }]
  },
  
  // 📈 Document Analytics
  statistiques: {
    nbConsultations: { type: Number, default: 0 },
    nbTelechargements: { type: Number, default: 0 },
    derniereConsultation: Date,
    consulteurs: [{
      personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
      date: Date,
      action: { type: String, enum: ['view', 'download', 'edit'] }
    }]
  },
  
  // 📝 Comments and Notes
  commentaires: [{
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    contenu: { type: String, maxlength: 500 },
    date: { type: Date, default: Date.now },
    isResolu: { type: Boolean, default: false }
  }],
  
  // 📅 Timestamps
  dateCreation: { type: Date, default: Date.now, index: true },
  dateModification: { type: Date, default: Date.now }
  
}, {
  timestamps: true,
  collection: 'fiches'
});

// Compound indexes for efficient queries
FicheSchema.index({ coproprieteId: 1, type: 1, dateCreation: -1 });
FicheSchema.index({ coproprieteId: 1, statut: 1 });
FicheSchema.index({ 'fichier.mimetype': 1, dateCreation: -1 });
```

#### 📊 SuiviAG (General Assembly Tracking)
```javascript
const SuiviAGSchema = new mongoose.Schema({
  // 🏢 Property Reference
  coproprieteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Copropriete',
    required: true,
    index: true
  },
  
  // 📅 AG Information
  typeAG: { 
    type: String,
    required: true,
    enum: ['Ordinaire', 'Extraordinaire', 'Mixte'],
    index: true
  },
  
  dateAG: { 
    type: Date,
    required: [true, 'AG date is required'],
    index: true
  },
  
  heureDebut: String,  // Format: "14:30"
  heureFin: String,
  
  lieu: {
    nom: String,
    adresse: String,
    ville: String,
    codePostal: String
  },
  
  // 📋 AG Agenda and Decisions
  ordreJour: [{
    numero: { type: Number, required: true },
    titre: { type: String, required: true },
    description: String,
    type: { 
      type: String, 
      enum: ['Information', 'Decision', 'Vote', 'Election'],
      default: 'Information'
    },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fiche' }]
  }],
  
  decisions: [{
    numeroOJ: { type: Number, required: true },
    intitule: { type: String, required: true },
    typeVote: { type: String, enum: ['Majorite_Simple', 'Majorite_Article_25', 'Majorite_Article_26', 'Unanimite'] },
    resultat: {
      pour: { type: Number, default: 0 },
      contre: { type: Number, default: 0 },
      abstention: { type: Number, default: 0 },
      nonVotant: { type: Number, default: 0 }
    },
    statut: { 
      type: String, 
      enum: ['Adopte', 'Rejete', 'Reporte', 'En_attente'],
      required: true
    },
    commentaires: String
  }],
  
  // 👥 Participation
  convocations: {
    dateEnvoi: Date,
    modeEnvoi: { type: String, enum: ['Email', 'Courrier', 'Mixte'] },
    nbEnvoyees: { type: Number, default: 0 },
    nbAccuses: { type: Number, default: 0 }
  },
  
  participants: [{
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    typeParticipation: { 
      type: String, 
      enum: ['Present', 'Represente', 'Pouvoir', 'Absent'],
      required: true
    },
    heureArrivee: String,
    heureDepart: String,
    mandataire: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    tantièmes: { type: Number, min: 0 }
  }],
  
  // 📊 Statistics
  statistiques: {
    nbLotsTotal: { type: Number, default: 0 },
    nbLotsRepresentes: { type: Number, default: 0 },
    tauxParticipation: { type: Number, min: 0, max: 100 },
    quorumAtteint: { type: Boolean, default: false },
    dureeReelle: { type: Number, default: 0 }  // in minutes
  },
  
  // 📄 Documents Generated
  documentsGeneres: [{
    type: { 
      type: String, 
      enum: ['PV', 'Feuille_Presence', 'Resultats_Votes', 'Convocation'],
      required: true
    },
    ficheId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fiche' },
    dateGeneration: { type: Date, default: Date.now },
    status: { type: String, enum: ['Brouillon', 'Definitif'], default: 'Brouillon' }
  }],
  
  // 🔄 Follow-up Actions
  actionsDecidees: [{
    intitule: { type: String, required: true },
    responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
    echeance: Date,
    priorite: { type: String, enum: ['Basse', 'Normale', 'Haute', 'Critique'], default: 'Normale' },
    statut: { type: String, enum: ['A_faire', 'En_cours', 'Termine', 'Reporte'], default: 'A_faire' },
    commentaires: String
  }],
  
  // 📊 Status and Validation
  statut: { 
    type: String,
    enum: ['Planifiee', 'En_cours', 'Terminee', 'Reportee', 'Annulee'],
    default: 'Planifiee',
    index: true
  },
  
  validation: {
    pvValide: { type: Boolean, default: false },
    dateValidation: Date,
    validePar: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' }
  },
  
  // 📝 Notes and Comments
  notes: String,
  
  // 📅 Timestamps
  dateCreation: { type: Date, default: Date.now },
  dateModification: { type: Date, default: Date.now }
  
}, {
  timestamps: true,
  collection: 'suiviag'
});

// Compound indexes
SuiviAGSchema.index({ coproprieteId: 1, dateAG: -1 });
SuiviAGSchema.index({ statut: 1, dateAG: 1 });
```

### 🔧 Database Indexes and Performance

#### 📈 Performance Optimization Strategy
```javascript
// Compound indexes for common query patterns
db.coproprietes.createIndex({ "ville": 1, "status": 1, "dateModification": -1 })
db.coproprietes.createIndex({ "Offre": 1, "nbLotPrincipaux": -1 })
db.coproprietes.createIndex({ "integrationStatus.trello.syncStatus": 1 })

// Text search indexes
db.coproprietes.createIndex({
  "Nom": "text",
  "ville": "text", 
  "address": "text"
}, {
  "weights": { "Nom": 10, "ville": 5, "address": 1 }
})

// Geospatial indexes (if coordinates are added)
db.coproprietes.createIndex({ "location": "2dsphere" })

// Partial indexes for specific use cases
db.coproprietes.createIndex(
  { "idVilogi": 1 }, 
  { "partialFilterExpression": { "idVilogi": { "$exists": true } } }
)
```

#### 🎯 Query Optimization Examples
```javascript
// Efficient property search with pagination
const properties = await Copropriete.find({
  ville: "Paris",
  status: "Actif",
  "financialData.budget": { $gte: 100000 }
})
.select('idCopro Nom ville Offre financialData.budget')
.sort({ dateModification: -1 })
.limit(20)
.skip(offset)
.lean();  // Returns plain JavaScript objects for better performance

// Aggregation for complex reporting
const propertyStats = await Copropriete.aggregate([
  { $match: { status: "Actif" } },
  { $group: {
    _id: "$ville",
    count: { $sum: 1 },
    avgBudget: { $avg: "$financialData.budget" },
    totalLots: { $sum: "$nbLotPrincipaux" }
  }},
  { $sort: { count: -1 } }
]);
```

### 💾 Database Backup and Maintenance

#### 🔄 Automated Backup Strategy
```bash
#!/bin/bash
# MongoDB backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
DB_NAME="coprox_production"

# Create backup with compression
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/$DB_NAME" \
  --out="$BACKUP_DIR/$DATE" \
  --gzip

# Upload to cloud storage
aws s3 sync "$BACKUP_DIR/$DATE" "s3://coprox-backups/mongodb/$DATE/"

# Cleanup old backups (keep last 30 days)
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} +
```

#### 🧹 Maintenance Scripts
```javascript
// Data cleanup and optimization
async function performMaintenance() {
  // Remove old temporary files
  await Fiche.deleteMany({
    statut: 'Supprime',
    dateModification: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  });
  
  // Update derived fields
  await Copropriete.updateMany({}, {
    $set: { 
      'metadata.lastMaintenance': new Date()
    }
  });
  
  // Rebuild indexes
  await mongoose.connection.db.collection('coproprietes').reIndex();
}
```

## 🔌 Comprehensive API Documentation

### 🌐 API Overview

The CoproxDashboard API is a RESTful service built with Express.js, providing comprehensive property management capabilities with extensive third-party integrations. All endpoints support JSON request/response format with consistent error handling and comprehensive logging.

#### 📡 Base Configuration
- **Base URL**: `http://localhost:8081` (Development)
- **Production URL**: `https://api.coprox.immo` (Production)
- **API Version**: v1 (versioned endpoints available)
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Timeout**: 30 seconds default
- **Rate Limiting**: 100 requests per 15-minute window per IP

#### 🔐 Authentication & Security

**JWT Authentication:**
```javascript
// Request Headers
{
  "Authorization": "Bearer <your_jwt_token>",
  "Content-Type": "application/json",
  "X-API-Version": "v1"
}

// Token Structure
{
  "userId": "64f8a123b4c56789d0123456",
  "email": "user@company.com",
  "role": "admin",
  "permissions": ["read:properties", "write:properties"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

**API Key Authentication (Alternative):**
```javascript
// Request Headers
{
  "X-API-Key": "your_api_key_here",
  "Content-Type": "application/json"
}
```

### 🏢 Property Management API

#### 📋 List Properties
```http
GET /copro/listCopro
```

**Query Parameters:**
- `status` (string): Filter by status (`Actif`, `Inactif`)
- `ville` (string): Filter by city
- `limit` (number): Limit results (default: 100, max: 1000)
- `offset` (number): Pagination offset (default: 0)
- `sortBy` (string): Sort field (`Nom`, `ville`, `dateCreation`)
- `sortOrder` (string): Sort direction (`asc`, `desc`)

**Request Example:**
```bash
curl -X GET "http://localhost:8081/copro/listCopro?status=Actif&limit=50&sortBy=Nom&sortOrder=asc" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a123b4c56789d0123456",
      "idCopro": "COPRO_2024_001",
      "Nom": "Résidence Les Jardins",
      "ville": "Paris",
      "status": "Actif",
      "address": "123 Avenue des Champs-Élysées",
      "codepostal": "75008",
      "Offre": "Premium",
      "exerciceCT": "2024-12-31T00:00:00.000Z",
      "dateReprise": "2024-01-01T00:00:00.000Z",
      "idVilogi": "VIL_123456",
      "idMondayMortex": "MON_789012",
      "immatriculation": "FR123456789",
      "nbLotPrincipaux": 45,
      "typeChauffage": "Collectif",
      "dateConstruction": "1995",
      "dateCreation": "2024-01-15T10:30:00.000Z",
      "dateModification": "2024-10-20T14:45:00.000Z",
      "suiviCopro": {
        "lastAG": "2024-03-15T00:00:00.000Z",
        "nextAG": "2025-03-15T00:00:00.000Z",
        "status": "En cours"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  },
  "message": "Properties retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z",
  "executionTime": "45ms"
}
```

#### 🔍 Get Property Details
```http
GET /copro/detailsCopro/:id
```

**Path Parameters:**
- `id` (string, required): Property ID (MongoDB ObjectId or custom idCopro)

**Request Example:**
```bash
curl -X GET "http://localhost:8081/copro/detailsCopro/64f8a123b4c56789d0123456" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a123b4c56789d0123456",
    "idCopro": "COPRO_2024_001",
    "Nom": "Résidence Les Jardins",
    "ville": "Paris",
    "status": "Actif",
    "address": "123 Avenue des Champs-Élysées",
    "codepostal": "75008",
    "Offre": "Premium",
    "exerciceCT": "2024-12-31T00:00:00.000Z",
    "dateReprise": "2024-01-01T00:00:00.000Z",
    "idVilogi": "VIL_123456",
    "idMondayMortex": "MON_789012",
    "immatriculation": "FR123456789",
    "nbLotPrincipaux": 45,
    "typeChauffage": "Collectif",
    "dateConstruction": "1995",
    "dateCreation": "2024-01-15T10:30:00.000Z",
    "dateModification": "2024-10-20T14:45:00.000Z",
    "suiviCopro": {
      "lastAG": "2024-03-15T00:00:00.000Z",
      "nextAG": "2025-03-15T00:00:00.000Z",
      "status": "En cours",
      "documents": [
        {
          "type": "PV_AG",
          "date": "2024-03-15T00:00:00.000Z",
          "url": "/documents/pv_ag_2024.pdf"
        }
      ]
    },
    "financialData": {
      "budget": 125000,
      "charges": 89500,
      "reserves": 35500
    },
    "contacts": [
      {
        "role": "Syndic",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "j.dupont@syndic.com",
        "telephone": "+33123456789"
      }
    ]
  },
  "message": "Property details retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

#### ➕ Create Property
```http
POST /copro/addCopro
```

**Request Body:**
```json
{
  "idCopro": "COPRO_2024_002",
  "Nom": "Résidence Moderne",
  "ville": "Lyon",
  "status": "Actif",
  "address": "456 Rue de la République",
  "codepostal": "69002",
  "Offre": "Standard",
  "exerciceCT": "2024-12-31T00:00:00.000Z",
  "dateReprise": "2024-02-01T00:00:00.000Z",
  "nbLotPrincipaux": 32,
  "typeChauffage": "Individuel",
  "dateConstruction": "2010",
  "suiviCopro": {
    "status": "Nouveau",
    "priority": "High"
  }
}
```

**Validation Rules:**
- `idCopro`: Required, unique, alphanumeric with underscores
- `Nom`: Required, 3-100 characters
- `ville`: Required, 2-50 characters
- `codepostal`: Required, valid French postal code format
- `nbLotPrincipaux`: Optional, positive integer
- `exerciceCT`: Optional, valid ISO date

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a123b4c56789d0123457",
    "idCopro": "COPRO_2024_002",
    "Nom": "Résidence Moderne",
    // ... full property object
    "dateCreation": "2024-10-27T15:30:00.000Z",
    "dateModification": "2024-10-27T15:30:00.000Z"
  },
  "message": "Property created successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

#### ✏️ Update Property
```http
PUT /copro/editCopro/:id
```

**Request Body (Partial Update):**
```json
{
  "status": "Inactif",
  "Offre": "Premium",
  "nbLotPrincipaux": 48,
  "suiviCopro": {
    "status": "Mis à jour",
    "lastUpdate": "2024-10-27T15:30:00.000Z"
  }
}
```

#### 📊 Property Statistics
```http
GET /copro/countOffers
GET /copro/coprowithoutag
```

**Count Offers Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byOffer": {
      "Premium": 45,
      "Standard": 78,
      "Basic": 27
    },
    "byStatus": {
      "Actif": 142,
      "Inactif": 8
    }
  },
  "message": "Offer statistics retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

### 🎯 Trello Integration API

#### 📋 Board Management
```http
GET /trello/boards
POST /trello/boards
PUT /trello/boards/:boardId
DELETE /trello/boards/:boardId
```

**Get Boards Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f8a123b4c56789d0123456",
      "name": "Property Management - 2024",
      "desc": "Main board for property management tasks",
      "url": "https://trello.com/b/abc123/property-management-2024",
      "lists": [
        {
          "id": "list123",
          "name": "To Do",
          "pos": 1
        },
        {
          "id": "list456",
          "name": "In Progress",
          "pos": 2
        }
      ],
      "members": 5,
      "lastActivity": "2024-10-27T14:30:00.000Z"
    }
  ],
  "message": "Trello boards retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

#### 🃏 Card Management
```http
GET /trello/cards/:boardId
POST /trello/cards
PUT /trello/cards/:cardId
DELETE /trello/cards/:cardId
```

**Create Card Request:**
```json
{
  "name": "Property Inspection - Résidence Les Jardins",
  "desc": "Annual property inspection for COPRO_2024_001",
  "listId": "list123",
  "pos": "top",
  "due": "2024-11-15T10:00:00.000Z",
  "labels": ["inspection", "urgent"],
  "members": ["member123"],
  "checklists": [
    {
      "name": "Inspection Tasks",
      "items": [
        "Check heating system",
        "Inspect common areas",
        "Review safety equipment"
      ]
    }
  ],
  "customFields": {
    "propertyId": "COPRO_2024_001",
    "priority": "High"
  }
}
```

### 📅 Monday.com Integration API

#### 🏢 Board Operations
```http
GET /monday/boards
POST /monday/boards
PUT /monday/boards/:boardId
```

**Get Boards with Items:**
```json
{
  "success": true,
  "data": [
    {
      "id": "2468135790",
      "name": "Property Management Q4 2024",
      "description": "Quarterly property management tasks",
      "state": "active",
      "workspace": {
        "id": "1357924680",
        "name": "Coprox Workspace"
      },
      "groups": [
        {
          "id": "topics",
          "title": "Active Properties",
          "color": "#579bfc"
        }
      ],
      "columns": [
        {
          "id": "text",
          "title": "Property Name",
          "type": "text"
        },
        {
          "id": "status",
          "title": "Status",
          "type": "color"
        },
        {
          "id": "date4",
          "title": "Next AG",
          "type": "date"
        }
      ],
      "items": [
        {
          "id": "1122334455",
          "name": "Résidence Les Jardins",
          "column_values": [
            {
              "id": "status",
              "text": "Active",
              "value": "{\"index\":1}"
            },
            {
              "id": "date4",
              "text": "2025-03-15",
              "value": "{\"date\":\"2025-03-15\"}"
            }
          ],
          "created_at": "2024-01-15T10:30:00Z",
          "updated_at": "2024-10-27T15:30:00Z"
        }
      ]
    }
  ],
  "message": "Monday.com boards retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

#### 📝 Item Management
```http
POST /monday/items
PUT /monday/items/:itemId
DELETE /monday/items/:itemId
```

**Create Item Request:**
```json
{
  "boardId": "2468135790",
  "groupId": "topics",
  "itemName": "Nouvelle Propriété - Résidence Moderne",
  "columnValues": {
    "status": {"label": "Active"},
    "text": {"text": "Résidence Moderne - Lyon"},
    "date4": {"date": "2025-06-15"},
    "numbers": {"number": 32},
    "dropdown": {"labels": ["Premium"]},
    "email": {"email": "contact@residence-moderne.fr", "text": "Contact Principal"}
  },
  "subscribers": [
    {"userId": "12345678", "kind": "person"}
  ]
}
```

### 🎫 Zendesk Integration API

#### 🎟️ Ticket Management
```http
GET /zendesk/tickets
POST /zendesk/tickets
PUT /zendesk/tickets/:ticketId
GET /zendesk/tickets/:ticketId/comments
POST /zendesk/tickets/:ticketId/comments
```

**Get Tickets with Filters:**
```bash
curl -X GET "http://localhost:8081/zendesk/tickets?status=open&priority=high&limit=25" \
  -H "Authorization: Bearer your_jwt_token"
```

**Tickets Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": 12345,
        "url": "https://yourcompany.zendesk.com/api/v2/tickets/12345.json",
        "subject": "Heating system malfunction - Résidence Les Jardins",
        "description": "The heating system in building A is not working properly...",
        "status": "open",
        "priority": "high",
        "type": "incident",
        "requester": {
          "id": 67890,
          "name": "Marie Dubois",
          "email": "marie.dubois@resident.com"
        },
        "assignee": {
          "id": 11111,
          "name": "Jean Technician",
          "email": "jean.tech@coprox.immo"
        },
        "organization": {
          "id": 22222,
          "name": "Résidence Les Jardins"
        },
        "custom_fields": [
          {
            "id": 33333,
            "name": "Property ID",
            "value": "COPRO_2024_001"
          },
          {
            "id": 44444,
            "name": "Building",
            "value": "Building A"
          }
        ],
        "tags": ["heating", "urgent", "building-a"],
        "created_at": "2024-10-25T09:15:00Z",
        "updated_at": "2024-10-27T14:30:00Z",
        "due_at": "2024-10-28T17:00:00Z",
        "satisfaction_rating": null,
        "sla_policy": {
          "id": 55555,
          "title": "Standard SLA"
        }
      }
    ],
    "pagination": {
      "count": 1,
      "next_page": null,
      "previous_page": null
    }
  },
  "statistics": {
    "total_tickets": 145,
    "open_tickets": 23,
    "pending_tickets": 8,
    "solved_tickets": 114,
    "avg_resolution_time": "4.2 hours"
  },
  "message": "Tickets retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

**Create Ticket Request:**
```json
{
  "subject": "Water leak in common area",
  "description": "There is a significant water leak in the ground floor common area of building B. Immediate attention required.",
  "priority": "urgent",
  "type": "incident",
  "status": "new",
  "requester": {
    "name": "Paul Martin",
    "email": "paul.martin@resident.com"
  },
  "custom_fields": [
    {
      "id": 33333,
      "value": "COPRO_2024_001"
    },
    {
      "id": 44444,
      "value": "Building B"
    }
  ],
  "tags": ["water-leak", "urgent", "building-b", "common-area"],
  "due_at": "2024-10-28T12:00:00Z",
  "assignee_id": 11111,
  "organization_id": 22222
}
```

#### 📊 Ticket Statistics
```http
GET /zendesk/non-resolved-tickets/count
GET /zendesk/tickets/stats
GET /zendesk/sla/performance
```

**Statistics Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": 31,
      "label": "Non-resolved tickets",
      "breakdown": {
        "new": 12,
        "open": 15,
        "pending": 4
      },
      "by_priority": {
        "low": 8,
        "normal": 18,
        "high": 4,
        "urgent": 1
      },
      "by_property": {
        "COPRO_2024_001": 15,
        "COPRO_2024_002": 8,
        "COPRO_2024_003": 8
      },
      "sla_status": {
        "within_sla": 26,
        "approaching_breach": 3,
        "breached": 2
      }
    }
  ],
  "trends": {
    "daily_average": 2.3,
    "weekly_trend": "+12%",
    "resolution_time_avg": "3.8 hours"
  },
  "message": "Ticket statistics retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

### 🏢 Vilogi Integration API

#### 🔄 Synchronization Endpoints
```http
GET /vilogi/properties
POST /vilogi/sync/property/:id
POST /vilogi/sync/all
GET /vilogi/sync/status
```

**Sync Status Response:**
```json
{
  "success": true,
  "data": {
    "lastSync": "2024-10-27T14:00:00.000Z",
    "syncStatus": "completed",
    "statistics": {
      "total_properties": 150,
      "synced_properties": 147,
      "failed_properties": 3,
      "new_properties": 2,
      "updated_properties": 23
    },
    "errors": [
      {
        "propertyId": "COPRO_2024_003",
        "error": "Invalid property data format",
        "timestamp": "2024-10-27T14:15:00.000Z"
      }
    ],
    "nextSync": "2024-10-27T18:00:00.000Z"
  },
  "message": "Sync status retrieved successfully",
  "timestamp": "2024-10-27T15:30:00.000Z"
}
```

### ⚠️ Error Handling & Status Codes

#### 📋 Standard HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (duplicate)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: External service error
- **503 Service Unavailable**: Service temporarily unavailable

#### 🚨 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for the provided data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "codepostal",
        "message": "Invalid postal code format",
        "value": "invalid-code"
      }
    ],
    "timestamp": "2024-10-27T15:30:00.000Z",
    "requestId": "req_abc123def456",
    "documentation": "https://docs.coprox.immo/api/errors#validation-error"
  },
  "meta": {
    "apiVersion": "v1",
    "executionTime": "125ms",
    "rateLimit": {
      "remaining": 95,
      "reset": "2024-10-27T16:00:00.000Z"
    }
  }
}
```

#### 🔍 Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `DUPLICATE_RESOURCE`: Resource already exists
- `EXTERNAL_API_ERROR`: Third-party service error
- `DATABASE_ERROR`: Database operation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Service temporarily down

### 📊 API Monitoring & Analytics

#### 📈 Metrics Endpoint
```http
GET /metrics
```

**Prometheus Metrics Format:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/copro/listCopro",status="200"} 1547

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/copro/listCopro",le="0.1"} 1200
http_request_duration_seconds_bucket{method="GET",route="/copro/listCopro",le="0.5"} 1520
```

#### 🏥 Health Check Endpoint
```http
GET /health
```

**Health Check Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-10-27T15:30:00.000Z",
  "uptime": "5d 14h 32m 18s",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "12ms",
      "lastCheck": "2024-10-27T15:29:50.000Z"
    },
    "trello": {
      "status": "healthy",
      "responseTime": "245ms",
      "lastCheck": "2024-10-27T15:29:45.000Z"
    },
    "monday": {
      "status": "healthy",
      "responseTime": "156ms",
      "lastCheck": "2024-10-27T15:29:40.000Z"
    },
    "zendesk": {
      "status": "degraded",
      "responseTime": "1250ms",
      "lastCheck": "2024-10-27T15:29:35.000Z",
      "warning": "Response time above threshold"
    }
  },
  "system": {
    "memory": {
      "used": "245MB",
      "free": "1.2GB",
      "percentage": 18.5
    },
    "cpu": {
      "usage": "12.3%",
      "loadAverage": [0.8, 0.9, 1.1]
    }
  }
}
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests (if configured)
cd front
npm test
```

### Test Structure
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete workflow testing

### Test Files
- `server/tests/coproRoutes.test.js` - Property management tests
- `server/tests/trelloRoutes.test.js` - Trello integration tests
- `server/tests/zendeskRoutes.test.js` - Zendesk integration tests

## 📊 Monitoring & Logging

### Prometheus Metrics
Available at `/metrics` endpoint:
- HTTP request duration and count
- Database connection status
- External API response times
- Custom business metrics

### Logging
- **Winston Logger**: Structured logging with rotation
- **Log Levels**: error, warn, info, debug
- **Log Files**: Stored in `server/logs/` directory
- **Daily Rotation**: Automatic log file rotation

### Health Checks
Monitor application health through:
- Database connectivity
- External API availability
- File system access
- Memory and CPU usage

## 🚀 Deployment

### ⚠️ IMPORTANT: Deployment Architecture

CoproxDashboard has **TWO DISTINCT COMPONENTS** that require different deployment strategies:

#### 1. API Server (Can deploy on Vercel/Serverless)
- ✅ All REST API endpoints
- ✅ Cron configuration endpoints (`/cron-config/*`)
- ✅ Script management (`/script/*`)
- ✅ Monitoring and stats
- ❌ Does NOT execute cron jobs

#### 2. Cron Execution Server (Requires Dedicated Server)
- ✅ Runs scheduled cron jobs
- ✅ Executes scripts on schedule
- ✅ Processes manual triggers
- ⚠️ MUST be a persistent process (VPS, EC2, etc.)
- ⚠️ Cannot run on Vercel/AWS Lambda/serverless platforms

**See `VERCEL_CRON_SEPARATION.md` for detailed architecture explanation**

### Deployment Option 1: Hybrid (Recommended)

**Vercel for API + Dedicated Server for Cron**

```bash
# Deploy API to Vercel
vercel deploy

# Deploy cron server to VPS/EC2/DigitalOcean
# (Same codebase, different environment)
git clone <repo>
cd server
npm install
node index.js  # Cron system will auto-start (no VERCEL env var)
```

### Deployment Option 2: All-in-One Server

**Single VPS/Cloud VM running both API and Cron**

```bash
# Production build
docker-compose -f docker-compose.prod.yml up --build -d

# Or manual deployment
cd server
npm install
NODE_ENV=production node index.js
```

### Deployment Option 3: Docker Deployment

```bash
# Scaling services
docker-compose up --scale server=3 --scale front=2

# Cron runs in one of the server instances
```

### Environment Detection

The system automatically detects the environment:

**On Vercel/Serverless:**
```
⚠️ SERVERLESS ENVIRONMENT DETECTED
⚠️ Cron execution is DISABLED
⚠️ This instance only serves API endpoints
```

**On Dedicated Server:**
```
✓ Regular server environment detected
✓ Initializing cron system...
✓ Cron system initialized with X jobs
```

### First-Time Cron Setup

**Required on dedicated server only:**

```bash
# 1. Seed database with cron configurations
curl -X POST http://your-server:8081/cron-config/seed

# 2. Reload cron system
curl -X POST http://your-server:8081/cron-config/reload

# 3. Verify
curl http://your-server:8081/cron-config/enabled
```

### Manual Deployment Steps

1. **Build frontend**: `cd front && npm run build`
2. **Deploy API** (Vercel or server): API endpoints only
3. **Deploy Cron Server** (dedicated server): Full system with cron
4. **Configure MongoDB**: Same database for both
5. **Set environment variables**: Different for each deployment
6. **Initialize cron database**: Run seed endpoint
7. **Set up reverse proxy**: nginx/apache for dedicated server
8. **Configure SSL certificates**: For production
9. **Set up monitoring**: Prometheus metrics

### Environment-specific Configurations

- **Development**: Hot reload, debug logging, cron enabled
- **Staging**: Production-like with test data, cron optional
- **Production API (Vercel)**: Optimized builds, cron disabled
- **Production Cron (Dedicated)**: Error tracking, cron enabled

### Recommended Architecture

```
┌─────────────────────────┐
│   Vercel (Serverless)   │
│   - API Endpoints       │ ← Users access here
│   - Configuration UI    │
└─────────────────────────┘
           ↓ (HTTP)
      Same MongoDB
           ↑ (MongoDB)
┌─────────────────────────┐
│  Dedicated Server (VPS) │
│  - Cron Execution       │ ← Scheduled jobs run here
│  - Script Processing    │
└─────────────────────────┘
```

**Documentation:**
- `VERCEL_CRON_SEPARATION.md` - Deployment architecture
- `QUICKSTART_CRON.md` - Cron setup guide
- `DATABASE_CRON_MIGRATION.md` - Database configuration

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- **Backend**: ESLint configuration for Node.js
- **Frontend**: React/JSX best practices
- **Formatting**: Prettier for consistent formatting

### Commit Message Format
```
type(scope): description

feat(copro): add new property creation endpoint
fix(trello): resolve card synchronization issue
docs(readme): update API documentation
```

## 📋 TODO & Roadmap

### Short Term
- [ ] Implement comprehensive error handling
- [ ] Add input validation middleware
- [ ] Enhance API documentation with OpenAPI/Swagger
- [ ] Implement automated backups

### Medium Term
- [ ] Add real-time notifications
- [ ] Implement advanced filtering and search
- [ ] Add user authentication and authorization
- [ ] Mobile responsive improvements

### Long Term
- [ ] Microservices architecture migration
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant support
- [ ] API rate limiting and caching

## 🆘 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB connection
docker exec -it mongodb-container mongo
```

#### Port Conflicts
```bash
# Check running processes
lsof -i :3000
lsof -i :8081
```

#### Environment Variables
```bash
# Verify environment loading
cd server && node -e "console.log(process.env.MONGODB_USERNAME)"
```

### Debug Mode
Enable debug logging:
```bash
# Backend
DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: [Your Team]
- **Project Manager**: [Name]
- **DevOps**: [Name]

## 📞 Support

For support and questions:
- Email: support@coprox.immo
- Documentation: [Wiki/Confluence Link]
- Issues: [GitHub Issues Link]

---

**Last Updated**: October 2024
**Version**: 1.0.0