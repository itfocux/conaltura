#!/bin/bash

# Vercel Deployment Script for Conaltura
echo "🚀 Starting Vercel deployment for Conaltura..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. This file is required for cron jobs."
    exit 1
fi

echo "✅ Configuration files found"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "🔐 Logging into Vercel..."
vercel login

echo "🏗️  Building and deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Navigate to Settings → Environment Variables"
echo "3. Add your environment variables:"
echo "   - SINCO_AUTH_URL"
echo "   - SINCO_VISIT_URL"
echo "   - HUBSPOT_URL"
echo "   - SINCO_USERNAME"
echo "   - SINCO_PASSWORD"
echo "   - HUBSPOT_API_KEY"
echo "4. Check the Functions tab to verify your cron job is active"
echo ""
echo "🎉 Your API will now run every 10 minutes automatically!"
