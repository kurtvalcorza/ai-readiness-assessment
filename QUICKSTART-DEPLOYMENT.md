# Quick Start: Deploy to Vercel in 10 Minutes

This guide will get your AI Readiness Assessment app live on the internet in about 10 minutes.

## What You'll Need

- [ ] GitHub account (free: https://github.com/signup)
- [ ] Vercel account (free: https://vercel.com/signup)
- [ ] Google Generative AI API Key
- [ ] Google account (for collecting responses)

## Step 1: Push Code to GitHub (2 minutes)

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `ai-readiness-assessment`
   - Make it **Public** or **Private**
   - **Don't** initialize with README (we already have one)
   - Click **Create repository**

2. Push your code (run these commands in your project folder):

```bash
git init
git add .
git commit -m "Initial commit: AI Readiness Assessment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-readiness-assessment.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Set Up Google Sheets (3 minutes)

1. **Create the spreadsheet**:
   - Go to https://sheets.google.com/create
   - Name it "AI Assessment Responses"
   - Add these headers in row 1:
     ```
     A1: Timestamp
     B1: Organization
     C1: Domain
     D1: Readiness Level
     E1: Primary Solution
     F1: Secondary Solution
     G1: Next Steps
     H1: Conversation History
     ```

2. **Create the webhook**:
   - Click **Extensions** → **Apps Script**
   - Delete existing code, paste this:

```javascript
function doPost(e) {
  try {
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
```

3. **Deploy the script**:
   - Click **Deploy** → **New deployment**
   - Click gear icon ⚙️ → Select **Web app**
   - Set "Execute as" to **Me**
   - Set "Who has access" to **Anyone**
   - Click **Deploy**
   - Click **Authorize access** and grant permissions
   - **Copy the Web App URL** (looks like `https://script.google.com/macros/s/...`)

## Step 3: Deploy to Vercel (5 minutes)

1. **Import project**:
   - Go to https://vercel.com/new
   - Click **Import Git Repository**
   - Select your `ai-survey-app` repository
   - Click **Import**

2. **Configure environment variables**:
   Before clicking Deploy, click **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Your Google AI API key |
   | `GOOGLE_SHEETS_WEBHOOK_URL` | The Web App URL from Step 2 |

3. **Deploy**:
   - Click **Deploy**
   - Wait 2-3 minutes for build to complete
   - Click **Visit** to see your live app!

## Step 4: Test It! (2 minutes)

1. Visit your deployed URL (looks like `https://ai-survey-app-xxx.vercel.app`)
2. Complete a test assessment
3. Check your Google Sheet - the response should appear!
4. Try downloading the Markdown report

## What's Next?

### Add a Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your domain (e.g., `ai-assessment.dost.gov.ph`)
3. Follow DNS configuration instructions

### Monitor Responses

- View all responses in your Google Sheet
- Create charts and pivot tables for analysis
- Export to CSV or Excel

### Update Your Deployment

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel automatically redeploys!

## Troubleshooting

### "Missing API key" error
- Check environment variables in Vercel dashboard
- Make sure variable names match exactly
- Redeploy after adding variables

### Responses not appearing in Google Sheet
- Test the webhook URL directly
- Check Apps Script is deployed with "Anyone" access
- View Vercel logs for submission errors

### Slow AI responses
- Check Google AI API quota
- Consider upgrading API plan for higher rate limits

## Security Tips

- Never commit `.env.local` to Git
- Rotate API keys regularly
- Monitor usage in Google Cloud Console
- Add rate limiting for production use

## Support

Need help? Check:
- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel docs: https://vercel.com/docs
- Google Apps Script: https://developers.google.com/apps-script

## Costs

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Google AI API**: Pay per request (very affordable for this use case)
- **Google Sheets**: Free (up to 5 million cells)

Your app is now live! Share the URL with stakeholders. 🎉
