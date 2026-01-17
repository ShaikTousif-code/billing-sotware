# Firebase Hosting Deployment Guide

## Prerequisites

1. **Firebase Account**: Sign up at https://firebase.google.com (use: shaik.taj48@gmail.com)
2. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

## Initial Setup (One-time)

### 1. Login to Firebase

```bash
firebase login
```

This will open a browser for authentication. Use: **shaik.taj48@gmail.com**

### 2. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" or "Create a project"
3. Project name: `billing-software-prod` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 3. Initialize Firebase Hosting

```bash
cd BillingUI
firebase init hosting
```

When prompted:
- **Select existing project**: Choose your Firebase project
- **Public directory**: `dist`
- **Single-page app**: `Yes` (for React Router)
- **Set up automatic builds**: `No` (we'll build manually)
- **Overwrite index.html**: `No` (we have our own)

### 4. Update Project ID (if different)

If your Firebase project ID is different, update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Deployment Steps

### Step 1: Build Production Bundle

```bash
cd BillingUI
npm run build
```

This creates an optimized production build in the `dist/` folder using `.env.production`.

### Step 2: Deploy to Firebase

```bash
firebase deploy --only hosting
```

### Step 3: Verify Deployment

After deployment, Firebase will provide a URL like:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Quick Deploy Script

Create a deploy script in `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

Then deploy with:
```bash
npm run deploy
```

## Environment Configuration

The production build uses `.env.production` which is configured with:
- **API URL**: `https://smartbilling-api-enazaxcsb6frejhq.centralindia-01.azurewebsites.net`

## Custom Domain (Optional)

### 1. Add Custom Domain in Firebase Console

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `billing.yourdomain.com`)
4. Follow DNS configuration instructions

### 2. SSL Certificate

Firebase automatically provisions SSL certificates for custom domains.

## Firebase Configuration Files

### `firebase.json`
- Configures hosting settings
- Sets `dist` as public directory
- Configures SPA routing (all routes → index.html)
- Sets cache headers for optimal performance

### `.firebaserc`
- Maps project aliases to Firebase project IDs
- Default project: `billing-software-prod`

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Fails

1. **Check Firebase login:**
   ```bash
   firebase login --reauth
   ```

2. **Verify project ID:**
   ```bash
   firebase projects:list
   ```

3. **Check Firebase CLI version:**
   ```bash
   firebase --version
   # Update if needed: npm install -g firebase-tools@latest
   ```

### API Not Working

1. **Check CORS**: Ensure Azure API allows Firebase domain
2. **Check API URL**: Verify `.env.production` has correct URL
3. **Check Network**: Open DevTools → Network tab to see requests

### 404 Errors on Routes

- Ensure `firebase.json` has the rewrite rule for SPA routing
- Verify `dist/index.html` exists after build

## Continuous Deployment (Optional)

### GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: billing-software-prod
```

## Firebase Hosting Features

- **Free SSL**: Automatic HTTPS
- **CDN**: Global content delivery
- **Custom Domain**: Support for custom domains
- **Rollback**: Easy rollback to previous versions
- **Preview Channels**: Preview deployments before going live

## Cost

Firebase Hosting is **FREE** for:
- 10 GB storage
- 360 MB/day data transfer
- Unlimited requests

## Next Steps

1. ✅ Firebase configuration files created
2. ⏭️ Install Firebase CLI: `npm install -g firebase-tools`
3. ⏭️ Login: `firebase login`
4. ⏭️ Create Firebase project in console
5. ⏭️ Initialize: `firebase init hosting`
6. ⏭️ Build: `npm run build`
7. ⏭️ Deploy: `firebase deploy --only hosting`

## Support

- Firebase Documentation: https://firebase.google.com/docs/hosting
- Firebase Console: https://console.firebase.google.com

