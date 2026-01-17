# Firebase Deployment Script
# This script builds and deploys the application to Firebase Hosting

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Firebase Hosting Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "✓ Firebase CLI found (version: $firebaseVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install Firebase CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Firebase CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 1: Checking Firebase login..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "Please login to Firebase..." -ForegroundColor Yellow
    firebase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Firebase login failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Already logged in to Firebase" -ForegroundColor Green
    Write-Host "  Account: $($firebaseUser | Select-String -Pattern '@' | Select-Object -First 1)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 2: Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your application is live at:" -ForegroundColor Yellow
Write-Host "  https://billing-software-prod.web.app" -ForegroundColor Cyan
Write-Host "  https://billing-software-prod.firebaseapp.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Update .firebaserc if your project ID is different" -ForegroundColor Gray
Write-Host ""

