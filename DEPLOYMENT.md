# Deployment Guide

This guide covers deploying the AI Readiness Assessment app to Vercel and setting up Google Sheets integration.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A Google account for Google Sheets
3. Your Google Generative AI API key

## Step 1: Set up Google Sheets Integration

### Create a Google Sheet

1. Go to https://sheets.google.com
2. Create a new spreadsheet named "AI Assessment Responses"
3. Add the following headers in row 1:
   - A1: Timestamp
   - B1: Organization
   - C1: Domain
   - D1: Readiness Level
   - E1: Primary Solution
   - F1: Secondary Solution
   - G1: Next Steps
   - H1: Conversation History

### Create a Google Apps Script Webhook

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any existing code and paste this:

```javascript
/**
 * Shared secret for HMAC-SHA256 signature verification.
 * Must match the WEBHOOK_SIGNING_SECRET env var in your Next.js app.
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const SIGNING_SECRET = 'YOUR_SECRET_HERE';

/** Maximum allowed age of a request (5 minutes) to prevent replay attacks */
const MAX_TIMESTAMP_DRIFT_MS = 300000;

function doPost(e) {
  try {
    // Verify HMAC signature if signing secret is configured
    if (SIGNING_SECRET && SIGNING_SECRET !== 'YOUR_SECRET_HERE') {
      const signature = e.parameter['X-Webhook-Signature']
        || (e.postData && e.postData.headers && e.postData.headers['X-Webhook-Signature'])
        || getHeaderValue(e, 'X-Webhook-Signature');
      const timestamp = e.parameter['X-Webhook-Timestamp']
        || (e.postData && e.postData.headers && e.postData.headers['X-Webhook-Timestamp'])
        || getHeaderValue(e, 'X-Webhook-Timestamp');

      if (!signature || !timestamp) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Missing signature' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Reject stale requests
      const requestAge = Date.now() - Number(timestamp);
      if (isNaN(requestAge) || requestAge > MAX_TIMESTAMP_DRIFT_MS || requestAge < -MAX_TIMESTAMP_DRIFT_MS) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Request expired' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Verify HMAC-SHA256 signature
      const body = e.postData.contents;
      const expectedSignature = computeHmacSha256(timestamp + '.' + body, SIGNING_SECRET);
      if (signature !== expectedSignature) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid signature' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp,
      data.organization,
      data.domain,
      data.readinessLevel,
      data.primarySolution,
      data.secondarySolution,
      data.nextSteps,
      data.conversationHistory
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Helper: extract header from the request event */
function getHeaderValue(e, headerName) {
  try {
    if (e.headers && e.headers[headerName]) return e.headers[headerName];
    // Apps Script passes custom headers via the request parameter for web apps
    if (e.parameter && e.parameter[headerName]) return e.parameter[headerName];
  } catch (_) {}
  return null;
}

/** Compute HMAC-SHA256 and return hex string */
function computeHmacSha256(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);
  return signature.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}
```

> **Note:** Replace `YOUR_SECRET_HERE` with the same value you set for `WEBHOOK_SIGNING_SECRET` in your Vercel environment variables. If you leave it as `YOUR_SECRET_HERE`, signature verification is skipped (backwards compatible).

3. Click **Deploy** → **New deployment**
4. Choose type: **Web app**
5. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**
7. **Copy the Web App URL** - you'll need this for Vercel

## Step 2: Deploy to Vercel

### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ai-survey-app.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add Environment Variables:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key
   - `GOOGLE_SHEETS_WEBHOOK_URL`: The Web App URL from Step 1
   - `WEBHOOK_SIGNING_SECRET`: The same secret you set in your Apps Script (optional but recommended)

6. Click **Deploy**

### Option B: Deploy using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables:
   ```bash
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY
   vercel env add GOOGLE_SHEETS_WEBHOOK_URL
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `ai-assessment.dost.gov.ph`)
3. Follow Vercel's instructions to update your DNS records

## Step 4: Test the Deployment

1. Visit your deployed URL
2. Complete a test assessment
3. Check your Google Sheet - you should see the response appear
4. Try downloading the Markdown report

## Environment Variables Summary

Your `.env.local` file should contain:

```
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/...
```

These same variables must be added to Vercel's environment settings.

## Monitoring and Analytics

### View Responses
- All responses are automatically saved to your Google Sheet
- You can create charts and pivot tables directly in Google Sheets
- Export to CSV for further analysis

### View Logs
- Check Vercel dashboard for deployment logs
- Monitor function execution times
- Set up alerts for errors

## Troubleshooting

### Assessment not submitting to Google Sheets
1. Check Vercel logs for errors
2. Verify the webhook URL is correct
3. Ensure the Apps Script is deployed as a web app with "Anyone" access
4. Test the webhook URL directly with curl

### Slow response times
1. Check Google AI API quota
2. Consider upgrading Vercel plan for more function execution time
3. Monitor in Vercel's Analytics dashboard

### Build failures
1. Check all dependencies are in package.json
2. Ensure Node.js version compatibility (18.x or higher)
3. Review build logs in Vercel dashboard

## Security Considerations

1. **API Key Protection**: Never commit `.env.local` to git
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **Data Privacy**: Inform users about data collection
4. **HTTPS**: Vercel provides HTTPS by default

## Updating the Deployment

To update your live app:

1. Make changes locally
2. Commit to git: `git commit -am "Your changes"`
3. Push to GitHub: `git push`
4. Vercel will automatically redeploy

Or use Vercel CLI:
```bash
vercel --prod
```

## Support

For issues related to:
- **Deployment**: Check Vercel docs at https://vercel.com/docs
- **Google Sheets**: Check Apps Script docs at https://developers.google.com/apps-script
- **API Issues**: Check Google AI docs at https://ai.google.dev

## Next Steps

After deployment:
1. Share the URL with your stakeholders
2. Monitor response collection
3. Set up regular data exports
4. Consider adding email notifications for new responses
5. Create a dashboard for visualizing assessment trends
