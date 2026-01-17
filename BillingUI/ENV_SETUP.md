# Environment Variables Setup

## Required Environment Files

Create the following files in the `BillingUI` directory:

### `.env` (Development)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT=30000

# Application Configuration
VITE_APP_NAME=Billing Software
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
```

### `.env.production` (Production)
```env
# Production API Configuration
VITE_API_BASE_URL=https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net
VITE_API_TIMEOUT=30000

# Application Configuration
VITE_APP_NAME=Billing Software
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

**Current Production API URL:** `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net`

## Quick Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your configuration

3. Restart the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_API_BASE_URL` - Base URL for the API server (default: http://localhost:5000)
- `VITE_API_TIMEOUT` - Request timeout in milliseconds (default: 30000)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version
- `VITE_ENABLE_ANALYTICS` - Enable analytics tracking
- `VITE_ENABLE_ERROR_REPORTING` - Enable error reporting

**Note:** All Vite environment variables must be prefixed with `VITE_` to be accessible in the application.

