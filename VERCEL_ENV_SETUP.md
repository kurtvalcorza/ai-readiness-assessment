# Vercel Environment Variables Setup

## Issue
The Google Sheets integration is not working in Vercel because the `GOOGLE_SHEETS_WEBHOOK_URL` environment variable is missing.

## Solution

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your `ai-readiness-assessment` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Missing Environment Variable

Add the following environment variable:

**Variable Name:** `GOOGLE_SHEETS_WEBHOOK_URL`

**Value:** 
```
[Copy from your .env.local file]
```

**Environments:** Select all three:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 3: Verify Existing Variables

Make sure you also have:

**Variable Name:** `GOOGLE_GENERATIVE_AI_API_KEY`
**Value:** `[Copy from your .env.local file]`
**Environments:** All three (Production, Preview, Development)

### Step 4: Redeploy

After adding the environment variables:
1. Go to the **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

### Step 5: Test

1. Visit your Vercel deployment URL
2. Complete a test assessment
3. Check your Google Sheet - the entry should now appear

## AWS Amplify Setup

For AWS Amplify, you need to add the same environment variables:

1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables** in the left menu
4. Add:
   - `GOOGLE_GENERATIVE_AI_API_KEY` = `[Copy from your .env.local file]`
   - `GOOGLE_SHEETS_WEBHOOK_URL` = `[Copy from your .env.local file]`
5. Redeploy the app

## Verification

After redeployment, test both platforms:

### Vercel Test
```bash
curl -X POST https://your-vercel-url.vercel.app/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Test Org",
    "domain": "Test Domain",
    "readinessLevel": "High",
    "solutions": [{"priority":"Primary","category":"Test","group":"Test","fit":"High","rationale":"Test"}],
    "nextSteps": ["Test step"],
    "timestamp": "2024-01-01T00:00:00.000Z",
    "conversationHistory": "Test"
  }'
```

Expected response: `{"success":true,"message":"Assessment submitted successfully"}`

### AWS Amplify Test
Same curl command but with your AWS Amplify URL.

## Troubleshooting

If Google Sheets still doesn't receive data:

1. **Check Google Apps Script Deployment:**
   - Open your Google Sheet
   - Go to Extensions → Apps Script
   - Click Deploy → Manage deployments
   - Verify "Who has access" is set to **Anyone**

2. **Test the webhook directly:**
   ```bash
   curl -X POST "[YOUR_WEBHOOK_URL_FROM_.env.local]" \
     -H "Content-Type: application/json" \
     -d '{
       "timestamp": "2024-01-01T00:00:00.000Z",
       "organization": "Test",
       "domain": "Test",
       "readinessLevel": "High",
       "primarySolution": "Test",
       "secondarySolution": "Test",
       "nextSteps": "Test",
       "conversationHistory": "Test"
     }'
   ```

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for errors in the `/api/submit` endpoint

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Complete an assessment
   - Check the `/api/submit` request and response
