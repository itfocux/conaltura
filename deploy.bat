@echo off
echo 🚀 Starting Vercel deployment for Conaltura...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Make sure you're in the project root directory.
    pause
    exit /b 1
)

REM Check if vercel.json exists
if not exist "vercel.json" (
    echo ❌ Error: vercel.json not found. This file is required for cron jobs.
    pause
    exit /b 1
)

echo ✅ Configuration files found

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Vercel CLI not found. Installing...
    npm install -g vercel
)

echo 🔐 Logging into Vercel...
vercel login

echo 🏗️  Building and deploying to production...
vercel --prod

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Navigate to Settings → Environment Variables
echo 3. Add your environment variables:
echo    - SINCO_AUTH_URL
echo    - SINCO_VISIT_URL
echo    - HUBSPOT_URL
echo    - SINCO_USERNAME
echo    - SINCO_PASSWORD
echo    - HUBSPOT_API_KEY
echo 4. Check the Functions tab to verify your cron job is active
echo.
echo 🎉 Your API will now run every 10 minutes automatically!
pause
