# Vercel Cron Job Setup - Summary

## Files Created

### 1. `vercel.json` - Vercel Configuration
```json
{
  "crons": [
    {
      "path": "/api/sinco",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
**Purpose**: Configures Vercel to run your `/api/sinco` endpoint every 10 minutes automatically.

### 2. `DEPLOYMENT_GUIDE.md` - Complete Deployment Instructions
**Purpose**: Comprehensive guide with step-by-step instructions for deploying to Vercel, setting up environment variables, and troubleshooting.

### 3. `deploy.bat` - Windows Deployment Script
**Purpose**: Automated deployment script for Windows users. Double-click to run or execute from command prompt.

### 4. `deploy.sh` - Unix/Linux/Mac Deployment Script
**Purpose**: Automated deployment script for Unix-based systems.

## Quick Start

### For Windows Users:
1. Double-click `deploy.bat` or run from command prompt:
   ```cmd
   cd conaltura
   deploy.bat
   ```

### For Mac/Linux Users:
1. Run the shell script:
   ```bash
   cd conaltura
   ./deploy.sh
   ```

### Manual Deployment:
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

## Environment Variables Required

After deployment, add these in Vercel Dashboard → Settings → Environment Variables:

- `SINCO_AUTH_URL`
- `SINCO_VISIT_URL`
- `HUBSPOT_URL`
- `SINCO_USERNAME`
- `SINCO_PASSWORD`
- `HUBSPOT_API_KEY`

## Cron Job Details

- **Frequency**: Every 10 minutes
- **Schedule**: `*/10 * * * *` (cron format)
- **Endpoint**: `/api/sinco`
- **Function**: Syncs contacts from HubSpot to Sinco

## Verification Steps

1. Deploy to Vercel
2. Add environment variables
3. Check Vercel Dashboard → Functions → Cron Jobs
4. Monitor execution logs
5. Test manually: `https://your-app.vercel.app/api/sinco`

## Important Notes

- **Free Tier Limit**: 100 cron job executions per month
- **Execution Time**: Maximum 10 seconds (free tier)
- **Timezone**: Cron jobs run in UTC
- **Monitoring**: Use Vercel Functions tab for logs and monitoring

Your API function will now automatically execute every 10 minutes, syncing contacts with "Cotización Enviada" status from HubSpot to Sinco.
