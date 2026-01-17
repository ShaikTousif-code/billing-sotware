# Production Deployment Guide

## Production Environment Configuration

The production environment is configured using `.env.production` file.

### Current Production API URL

**API Base URL:** `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net`

### Environment Variables

The `.env.production` file contains:

```env
VITE_API_BASE_URL=https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net
VITE_API_TIMEOUT=30000
VITE_APP_NAME=Billing Software
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## Building for Production

### 1. Build the Application

```bash
cd BillingUI
npm install
npm run build
```

This will:
- Use `.env.production` automatically
- Create optimized production build in `dist/` folder
- Bundle all assets and optimize for production

### 2. Verify API Configuration

After building, verify that the API URL is correctly embedded:

1. Open `dist/index.html` (or check the built files)
2. Search for the API URL to confirm it's using the production endpoint
3. Test the build locally:
   ```bash
   npm run preview
   ```

### 3. Deploy to Hosting

#### Option A: Azure Static Web Apps

1. **Create Static Web App:**
   ```bash
   az staticwebapp create \
     --name billing-ui \
     --resource-group billing-software-rg \
     --location centralindia \
     --sku Free
   ```

2. **Deploy:**
   ```bash
   az staticwebapp deploy \
     --name billing-ui \
     --resource-group billing-software-rg \
     --app-location "BillingUI" \
     --output-location "dist"
   ```

#### Option B: Manual Deployment

1. Upload the contents of `dist/` folder to your web server
2. Configure your web server to serve `index.html` for all routes (SPA routing)
3. Ensure HTTPS is enabled

#### Option C: Netlify/Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in the platform settings

## API Configuration

The frontend is configured to use the production API at:
- **Base URL:** `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net`
- **API Endpoint:** `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net/api`

### CORS Configuration

Ensure the API has CORS configured to allow requests from your frontend domain:

1. Go to Azure Portal → Your App Service → **CORS**
2. Add your frontend domain(s):
   - `https://your-frontend-domain.com`
   - `https://www.your-frontend-domain.com`

Or set in API's `appsettings.Production.json`:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend-domain.com",
      "https://www.your-frontend-domain.com"
    ]
  }
}
```

## Testing Production Build

### Local Preview

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` (or the port shown) to test the production build locally.

### Verify API Connection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try logging in or making any API call
4. Verify requests are going to: `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net/api/...`

## Troubleshooting

### API Requests Failing

1. **Check CORS:** Ensure API allows your frontend domain
2. **Check API URL:** Verify `.env.production` has correct URL
3. **Check Network:** Open DevTools → Network tab to see actual requests
4. **Check Console:** Look for CORS or connection errors

### Build Issues

1. **Clear cache:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Check environment variables:**
   ```bash
   # Verify .env.production exists
   cat .env.production
   ```

### Environment Variables Not Working

- Ensure variables start with `VITE_` prefix
- Restart dev server after changing `.env` files
- Rebuild after changing `.env.production`

## Updating Production API URL

If you need to change the production API URL:

1. Edit `.env.production`:
   ```env
   VITE_API_BASE_URL=https://new-api-url.com
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Redeploy the `dist/` folder

## Security Notes

- Never commit `.env.production` with sensitive data (it's in `.gitignore`)
- Use environment variables in your hosting platform when possible
- Ensure HTTPS is enabled for both frontend and API
- Configure CORS properly to prevent unauthorized access

## Next Steps

1. ✅ Production environment configured
2. ✅ API URL set to Azure App Service
3. ⏭️ Build production bundle
4. ⏭️ Deploy to hosting platform
5. ⏭️ Configure CORS on API
6. ⏭️ Test end-to-end

