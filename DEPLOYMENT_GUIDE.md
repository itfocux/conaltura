# Vercel Deployment Guide with Cron Jobs

This guide will help you deploy your Next.js application to Vercel with automated cron job execution.

## Prerequisites

1. A Vercel account (free tier supports cron jobs)
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Configuration Files

### vercel.json
The `vercel.json` file has been configured with a cron job that will execute your `/api/sinco` endpoint every 10 minutes:

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

**Schedule Format**: The cron schedule `*/10 * * * *` means:
- `*/10` - Every 10 minutes
- `*` - Every hour
- `*` - Every day of the month
- `*` - Every month
- `*` - Every day of the week

## Deployment Steps

### 1. Push Your Code to Git Repository
Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Add Vercel cron job configuration"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   cd conaltura
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Configure your project settings
5. Click "Deploy"

### 3. Environment Variables Setup

You need to configure the following environment variables in Vercel:

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:

```
SINCO_AUTH_URL=your_sinco_auth_url
SINCO_VISIT_URL=your_sinco_visit_url
HUBSPOT_URL=your_hubspot_url
SINCO_USERNAME=your_sinco_username
SINCO_PASSWORD=your_sinco_password
HUBSPOT_API_KEY=your_hubspot_api_key
```

**Important**: Make sure to set these for all environments (Production, Preview, Development) as needed.

### 4. Verify Cron Job Setup

After deployment:

1. Go to your Vercel project dashboard
2. Navigate to "Functions" tab
3. You should see your cron job listed under "Cron Jobs"
4. The status should show as "Active"

## Testing Your Deployment

### Manual Test
You can manually test your API endpoint by visiting:
```
https://your-project-name.vercel.app/api/sinco
```

### Monitor Cron Job Execution
1. Go to Vercel dashboard → Your project → Functions
2. Click on your cron job to see execution logs
3. Monitor the "Invocations" to ensure it's running every 10 minutes

## Cron Job Limitations

### Vercel Free Tier:
- 100 cron job invocations per month
- Maximum execution time: 10 seconds

### Vercel Pro Tier:
- 1,000 cron job invocations per month
- Maximum execution time: 60 seconds

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Set**
   - Ensure all required environment variables are configured in Vercel dashboard
   - Redeploy after adding environment variables

2. **Cron Job Not Executing**
   - Check the Functions tab in Vercel dashboard
   - Verify the cron schedule format
   - Check function logs for errors

3. **API Timeout**
   - Optimize your API function to run within time limits
   - Consider breaking down large operations into smaller chunks

### Monitoring and Logs

- Use Vercel's built-in monitoring in the Functions tab
- Add console.log statements in your API function for debugging
- Consider using external monitoring services for production

## Alternative Cron Schedules

If you need different schedules, here are some examples:

```json
{
  "crons": [
    {
      "path": "/api/sinco",
      "schedule": "0 */1 * * *"    // Every hour
    },
    {
      "path": "/api/sinco",
      "schedule": "0 9 * * *"      // Daily at 9 AM
    },
    {
      "path": "/api/sinco",
      "schedule": "*/5 * * * *"     // Every 5 minutes
    },
    {
      "path": "/api/sinco",
      "schedule": "0 */2 * * *"     // Every 2 hours
    }
  ]
}
```

## Next Steps

1. Deploy your application to Vercel
2. Configure environment variables
3. Monitor the cron job execution
4. Test the API endpoint manually to ensure it works correctly
5. Check logs regularly to ensure smooth operation

Your API function will now automatically execute every 10 minutes, syncing contacts from HubSpot to Sinco as configured in your code.
