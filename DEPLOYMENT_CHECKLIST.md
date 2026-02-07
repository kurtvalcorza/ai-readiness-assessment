# Deployment Checklist - Fix Chatbot & Google Sheets Issues

## ✅ Code Changes (COMPLETED)
- [x] Enhanced completion detection in `lib/report-parser.ts`
- [x] Improved AI instructions in `lib/systemPrompt.ts`
- [x] Build successful with no errors
- [x] Changes committed and pushed to GitHub

## 🔧 Vercel Configuration (ACTION REQUIRED)

### Step 1: Add Environment Variable
1. Go to https://vercel.com/dashboard
2. Find and select your `ai-readiness-assessment` project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. Click **Add New**
6. Enter:
   - **Key:** `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value:** `[Copy from your .env.local file]`
   - **Environments:** Check all three boxes:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
7. Click **Save**

### Step 2: Verify Existing Variable
While you're in Environment Variables, verify this exists:
- **Key:** `GOOGLE_GENERATIVE_AI_API_KEY`
- **Value:** Should be set (starts with `AIza...`)
- **Environments:** All three checked

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment (should be the one that just auto-deployed from your git push)
3. Wait for it to complete, or
4. Click the three dots (...) → **Redeploy** if needed

## 🔧 AWS Amplify Configuration (ACTION REQUIRED)

### Step 1: Add Environment Variables
1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Select your `ai-readiness-assessment` app
3. Click **Environment variables** in left menu
4. Click **Manage variables**
5. Add these two variables:

**Variable 1:**
- **Key:** `GOOGLE_GENERATIVE_AI_API_KEY`
- **Value:** `[Your Google AI API Key from .env.local]`

**Variable 2:**
- **Key:** `GOOGLE_SHEETS_WEBHOOK_URL`
- **Value:** `[Your Google Sheets Webhook URL from .env.local]`

6. Click **Save**

### Step 2: Redeploy
1. Go to your app's main page in Amplify Console
2. The latest commit should trigger auto-deployment
3. Wait for build to complete (usually 3-5 minutes)
4. Or manually trigger: Click **Redeploy this version** on latest deployment

## 🧪 Testing (DO THIS AFTER DEPLOYMENT)

### Test 1: AWS Amplify - Completion Detection
1. Visit your AWS Amplify URL
2. Complete a full assessment (answer all questions)
3. **Expected:** Assessment completion screen appears with download buttons
4. **Previously:** Got stuck on "Waiting for response..."
5. ✅ **Pass:** Completion screen shows
6. ❌ **Fail:** Still stuck → Check browser console (F12) for errors

### Test 2: Vercel - Google Sheets Integration
1. Visit your Vercel URL
2. Complete a test assessment
3. **Expected:** New row appears in your Google Sheet
4. **Previously:** No entry was created
5. ✅ **Pass:** Entry appears in Google Sheet
6. ❌ **Fail:** No entry → Check Vercel logs (Dashboard → Logs)

### Test 3: AWS Amplify - Google Sheets Integration
1. Visit your AWS Amplify URL
2. Complete another test assessment
3. **Expected:** New row appears in your Google Sheet
4. ✅ **Pass:** Entry appears in Google Sheet
5. ❌ **Fail:** No entry → Check Amplify logs

## 🔍 Troubleshooting

### If completion detection still fails:
1. Open browser console (F12)
2. Look for errors in Console tab
3. Check Network tab for failed API calls
4. Verify the AI response includes completion phrases

### If Google Sheets still doesn't receive data:
1. **Test the webhook directly:**
   ```bash
   curl -X POST "[YOUR_WEBHOOK_URL]" \
     -H "Content-Type: application/json" \
     -d '{"timestamp":"2024-01-01T00:00:00.000Z","organization":"Test","domain":"Test","readinessLevel":"High","primarySolution":"Test","secondarySolution":"Test","nextSteps":"Test","conversationHistory":"Test"}'
   ```
   Expected: `{"success":true}`

2. **Check Google Apps Script:**
   - Open your Google Sheet
   - Go to Extensions → Apps Script
   - Click Deploy → Manage deployments
   - Verify "Who has access" = **Anyone**
   - If not, redeploy with correct settings

3. **Check platform logs:**
   - **Vercel:** Dashboard → Your Project → Logs → Filter by `/api/submit`
   - **Amplify:** Console → Your App → Monitoring → Logs

## 📊 Success Criteria

All of these should work after deployment:

- [ ] AWS Amplify: Chatbot completes and shows download buttons
- [ ] AWS Amplify: Google Sheets receives entries
- [ ] Vercel: Chatbot completes and shows download buttons
- [ ] Vercel: Google Sheets receives entries
- [ ] No errors in browser console
- [ ] No errors in platform logs
- [ ] All download formats work (MD, HTML, PDF)

## 📝 Quick Reference

**Find your credentials in:** `.env.local` file (not committed to git)

- `GOOGLE_SHEETS_WEBHOOK_URL` - Your Google Apps Script webhook URL
- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google AI API key

**Vercel Dashboard:**
https://vercel.com/dashboard

**AWS Amplify Console:**
https://console.aws.amazon.com/amplify/

## 🎯 Summary

**What was fixed:**
1. **Chatbot stuck issue:** Added fallback completion detection that doesn't rely solely on the AI marker
2. **Google Sheets issue:** Documented that environment variables need to be added to both platforms

**What you need to do:**
1. Add `GOOGLE_SHEETS_WEBHOOK_URL` to Vercel environment variables
2. Add both environment variables to AWS Amplify
3. Wait for auto-deployment or manually redeploy
4. Test both platforms

**Estimated time:** 10-15 minutes for configuration + 5-10 minutes for deployment + 5 minutes for testing

---

**Need help?** Check `VERCEL_ENV_SETUP.md` for detailed instructions or `FIXES_APPLIED.md` for technical details.
