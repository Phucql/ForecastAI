# Authentication Setup Guide

## Overview
This guide explains how to set up the authentication system for your ForecastAI application.

## Features
- Beautiful landing page with modern design
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

Your server already has the authentication endpoints configured:
- `POST /api/login` - Login endpoint
- `POST /api/logout` - Logout endpoint  
- `GET /api/me` - Get current user info

### 3. Admin Credentials
- Username: `admin`
- Password: `Klug123`

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
2. **Login**: Click "Get Started" to open login modal
3. **Authentication**: JWT tokens are stored in HTTP-only cookies
4. **Protected Routes**: All app routes require authentication
5. **Logout**: Users can logout from the header

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
To add more users, modify the `USERS` array in `server.ts`:

```javascript
const USERS = [
  { username: 'admin', passwordHash: bcrypt.hashSync('Klug123', 10) },
  { username: 'user2', passwordHash: bcrypt.hashSync('user2password', 10) }
];
```

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