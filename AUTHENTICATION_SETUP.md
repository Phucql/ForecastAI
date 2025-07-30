# Authentication Setup Guide

## Overview
This guide explains how to set up the authentication system for your ForecastAI application.

## Features
- Beautiful landing page with modern design
- Email-based user registration and login
- Secure login/logout functionality
- Protected routes
- JWT-based authentication
- Responsive design

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Base URL - Update this to your Render backend URL
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com

# For local development, use:
# VITE_API_BASE_URL=http://localhost:3001
```

### 2. Backend Configuration

Your server has the authentication endpoints configured:
- `POST /api/signup` - User registration endpoint
- `POST /api/login` - Login endpoint
- `POST /api/logout` - Logout endpoint  
- `GET /api/me` - Get current user info

### 3. User Registration

Users can now sign up using their email address. The system includes:
- Email validation
- Password requirements (minimum 6 characters)
- Username creation
- Automatic login after successful signup

### 4. Deployment

#### Frontend (Netlify)
1. Build your project: `npm run build`
2. Deploy to Netlify
3. Set environment variable `VITE_API_BASE_URL` in Netlify dashboard

#### Backend (Render)
1. Deploy your server to Render
2. Set environment variables in Render dashboard
3. Update `VITE_API_BASE_URL` in your frontend to point to your Render URL

### 5. CORS Configuration

The server is configured to allow requests from:
- `https://foodforecastai.netlify.app` (your Netlify domain)
- `http://localhost:5173` (local development)

## File Structure

```
src/
├── components/
│   ├── AuthProvider.tsx      # Authentication context
│   ├── LoginForm.tsx         # Login form component
│   ├── LoginPage.tsx         # Login page with landing page
│   ├── LandingPage.tsx       # Beautiful landing page
│   ├── ProtectedRoute.tsx    # Route protection
│   ├── AppRouter.tsx         # Main routing logic
│   └── MainApp.tsx          # Main app with header
├── main.tsx                 # Entry point with AuthProvider
└── App.tsx                  # Your existing app component
```

## How It Works

1. **Landing Page**: Users see a beautiful landing page when not authenticated
2. **Registration/Login**: Click "Get Started" to open login/signup modal
3. **Signup**: Users can create accounts with email, username, and password
4. **Login**: Existing users can sign in with email and password
5. **Authentication**: JWT tokens are stored in HTTP-only cookies
6. **Protected Routes**: All app routes require authentication
7. **Logout**: Users can logout from the header

## Security Features

- HTTP-only cookies for token storage
- Secure flag for HTTPS
- SameSite cookie policy
- CORS protection
- JWT token expiration (1 day)

## Customization

### Styling
The components use Tailwind CSS. You can customize colors, spacing, and layout by modifying the className attributes.

### User Management
The system now uses email-based registration. Users are stored in memory (replace with database in production):

```javascript
const USERS: { email: string; passwordHash: string; username: string }[] = [];
```

For production, integrate with your PostgreSQL database to persist user data.

### Database Integration
For production, replace the in-memory user array with database queries in the login endpoint.

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your Render backend URL is in the CORS origins list
2. **Login Fails**: Check that `VITE_API_BASE_URL` is correctly set
3. **Cookies Not Set**: Ensure you're using HTTPS in production
4. **Redirect Loop**: Check that authentication state is properly managed

### Debug Mode
Add console logs to debug authentication flow:

```javascript
// In AuthProvider.tsx
console.log('User state:', user);
console.log('Loading state:', isLoading);
``` 