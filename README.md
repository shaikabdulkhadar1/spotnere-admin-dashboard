# Spotnere Admin Panel

A comprehensive admin panel application for managing venues, customers, and business operations for the Spotnere platform. Built with modern web technologies, this application provides an intuitive interface for administrators to manage listings, customers, and view analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development](#development)
- [License](#license)

## 🎯 Overview

Spotnere Admin Panel is a full-stack web application designed to provide administrators with powerful tools to manage venue listings, customer data, and monitor business metrics. The application features a modern, responsive UI built with React and TypeScript, backed by a robust FastAPI server that integrates seamlessly with Supabase for database operations and authentication.

## ✨ Features

### 🔐 Authentication & Authorization

- Secure user authentication using Supabase Auth
- Role-based access control (RBAC) system
- Protected routes with session management
- JWT token refresh mechanism
- User registration and login functionality

### 📊 Dashboard

- Real-time statistics overview
- Total customers count
- Average rating metrics
- Interactive charts and visualizations
- Customer insights with pie charts
- Sales analytics with line charts
- Skeleton loaders for better UX

### 📍 Listings Management

- Comprehensive listing table with search and filters
- Add new venue listings with detailed information
- Edit existing listings with full form validation
- Delete listings with confirmation dialogs
- Toggle listing visibility (show/hide)
- Category and country-based filtering
- Pagination for large datasets
- Banner image upload to Supabase Storage
- Dynamic location dropdowns (Country, State, City)
- Operating hours management (day-by-day form)
- Amenities and tags management

### 👥 Customer Management

- Complete customer data table with all user fields
- Search functionality across multiple fields
- Status and country filtering
- Horizontal scrolling for wide tables
- Customer details including:
  - Personal information (name, email, phone)
  - Address details (address, city, state, country, postal code)
  - Booking information
  - Account status
  - Registration dates

### 🎨 User Interface

- Modern, clean design with Shadcn UI components
- Fully responsive layout
- Dark/light mode support (via theme system)
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and skeleton screens
- Empty states with helpful messages
- Accessible components following WCAG guidelines

### 🔧 Technical Features

- Type-safe development with TypeScript
- RESTful API architecture
- CORS configuration for cross-origin requests
- Environment-based configuration
- Error handling and validation
- Image upload and storage management
- Real-time data synchronization

## 🛠 Tech Stack

### Frontend

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **UI Library**: Shadcn UI (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Context API
- **Data Fetching**: TanStack React Query 5.83.0
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.462.0
- **Form Handling**: React Hook Form 7.61.1
- **Validation**: Zod 3.25.76
- **Animations**: Framer Motion 12.23.24
- **Notifications**: Sonner 1.7.4
- **Backend Integration**: Supabase JS 2.81.1

### Backend

- **Framework**: FastAPI 0.115.0
- **Language**: Python 3.13
- **Server**: Uvicorn 0.32.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Validation**: Pydantic 2.9.2
- **Environment**: python-dotenv 1.0.1
- **Email Validation**: email-validator 2.1.1

### Infrastructure

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **API**: RESTful API with FastAPI
- **CORS**: Configured for development and production

## 📁 Project Structure

```
spotnere-admin/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   └── README.md              # Backend-specific documentation
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminTopbar.tsx
│   │   │   ├── EditPlaceModal.tsx
│   │   │   ├── AddPlaceModal.tsx
│   │   │   ├── BannerImageUpload.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React Context providers
│   │   │   ├── AdminContext.tsx
│   │   │   └── AccessControlContext.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Listing.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Login.tsx
│   │   │   └── NotFound.tsx
│   │   ├── lib/              # Utility functions
│   │   │   ├── supabase.ts
│   │   │   └── utils.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Application entry point
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   └── tsconfig.json         # TypeScript configuration
│
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/bun
- **Python** 3.13+
- **Supabase** account and project
- **Git** for version control

### Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the backend directory:

   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=8000
   HOST=0.0.0.0
   ```

5. **Run the backend server:**

   ```bash
   python main.py
   ```

   Or using uvicorn directly:

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the frontend directory:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_BUCKET_NAME=your_bucket_name
   VITE_COUNTRIES_API=https://countriesnow.space/api/v0.1
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

   The application will be available at `http://localhost:8080` or `http://localhost:5173`

## 📚 API Documentation

### Base URL

```
http://localhost:8000
```

### Available Endpoints

#### Health Check

- `GET /` - Root endpoint
- `GET /health` - Health check endpoint

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

#### Places/Listings

- `GET /api/places` - Get all places
- `GET /api/places/{place_id}` - Get place by ID
- `POST /api/places` - Create new place
- `PUT /api/places/{place_id}` - Update place
- `PATCH /api/places/{place_id}/toggle-visibility` - Toggle place visibility
- `DELETE /api/places/{place_id}` - Delete place
- `GET /api/places/count` - Get total places count
- `GET /api/places/countries/count` - Get countries count
- `GET /api/places/rating/average` - Get average rating

#### Customers

- `GET /api/customers` - Get all customers
- `GET /api/users/count` - Get total users count

### Interactive API Documentation

Once the backend server is running, you can access:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 💻 Development

### Backend Development

- The backend uses FastAPI with automatic API documentation
- Code changes are automatically reloaded when using `--reload` flag
- All endpoints are type-validated using Pydantic models
- Error handling is implemented throughout the application

### Frontend Development

- Hot module replacement (HMR) is enabled for fast development
- TypeScript provides type safety across the application
- ESLint is configured for code quality
- Components are organized in a modular structure

### Code Style

- **Backend**: Follows PEP 8 Python style guide
- **Frontend**: Uses ESLint and Prettier for code formatting
- TypeScript strict mode is enabled

## 🔒 Security Features

- JWT-based authentication with token refresh
- Password hashing (handled by Supabase Auth)
- CORS configuration for secure cross-origin requests
- Protected routes with authentication checks
- Role-based access control (RBAC)
- Input validation on both client and server side

## 📝 Environment Variables

### Backend (.env)

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=8000
HOST=0.0.0.0
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_BUCKET_NAME=your_bucket_name
VITE_COUNTRIES_API=https://countriesnow.space/api/v0.1
```

## 🧪 Testing

The application includes error handling and validation throughout. For production deployment, consider adding:

- Unit tests for backend endpoints
- Integration tests for API workflows
- Frontend component tests
- End-to-end (E2E) tests

## 🚢 Deployment

### Backend Deployment

- Can be deployed on platforms like:
  - Heroku
  - Railway
  - Render
  - AWS EC2
  - Google Cloud Run
  - DigitalOcean App Platform

### Frontend Deployment

- Can be deployed on platforms like:
  - Vercel
  - Netlify
  - AWS S3 + CloudFront
  - GitHub Pages
  - Firebase Hosting

### Production Considerations

- Update CORS origins to include production domain
- Use environment variables for all sensitive data
- Enable HTTPS
- Set up proper error logging and monitoring
- Configure rate limiting
- Set up database backups

## 🤝 Contributing

This is a private project. For contributions or questions, please contact the developer.

## 📄 License

Copyright © 2024 Shaik Abdul Khadar. All rights reserved.

This project and its source code are proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without the express written permission of Shaik Abdul Khadar.

---

**Developer**: Shaik Abdul Khadar  
**Project**: Spotnere Admin Panel  
**Version**: 1.0.0
