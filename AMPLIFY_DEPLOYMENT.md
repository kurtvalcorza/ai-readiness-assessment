# AWS Amplify Deployment Guide

This guide covers deploying the AI Readiness Assessment application to AWS Amplify.

## Prerequisites

- AWS Account with Amplify access
- GitHub/GitLab repository with your code
- Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Deployment Steps

### 1. Connect Repository to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your Git provider (GitHub, GitLab, etc.)
4. Select this repository
5. Choose the branch to deploy (usually `main` or `master`)

### 2. Configure Build Settings

AWS Amplify should automatically detect the `amplify.yml` file. If not, use these settings:

**Build Settings:**
- **Build command**: `npm run build`
- **Base directory**: (leave empty)
- **Artifact base directory**: `.next`
- **Artifact files**: `**/*`

**Important:** Make sure to set the **artifacts baseDirectory** to `.next` in the Amplify console if it's not automatically detected from the `amplify.yml` file.

**Manual Configuration (if amplify.yml is not detected):**
1. Go to App Settings → Build settings
2. Edit the build specification
3. Ensure the artifacts section includes:
   ```yaml
   artifacts:
     baseDirectory: .next
     files:
       - '**/*'
   ```

### 3. Environment Variables

In the Amplify console, go to App Settings → Environment Variables and add:

**Required:**
- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key

**Optional:**
- `GOOGLE_SHEETS_WEBHOOK_URL`: Your Google Sheets webhook URL (if using)

### 4. Deploy

Click "Save and deploy" to start the deployment process.

## Expected Behavior

### ✅ What Will Work
- Static site generation and client-side functionality
- Next.js App Router with server-side rendering
- API routes (`/api/chat` and `/api/submit`) as serverless functions
- Environment variable configuration
- Build process and caching

### ⚠️ Rate Limiting Considerations
- In-memory rate limiting will reset with each serverless function cold start
- This provides basic protection but isn't persistent across requests
- Consider upgrading to DynamoDB-based rate limiting if needed

### 🔧 Monitoring
- Check Amplify build logs for any issues
- Monitor function execution in CloudWatch
- Test API endpoints after deployment

## Post-Deployment Testing

1. **Basic functionality**: Test the chat interface
2. **API endpoints**: Verify `/api/chat` responds correctly
3. **Form submission**: Test the assessment submission (if Google Sheets configured)
4. **Performance**: Check loading times and responsiveness

## Troubleshooting

### Build Failures
- Check build logs in Amplify console
- Verify all dependencies are in `package.json`
- Ensure environment variables are set correctly

### API Issues
- Check CloudWatch logs for serverless function errors
- Verify Google AI API key is valid and has quota
- Test API endpoints directly via browser dev tools

### Performance Issues
- Monitor function cold start times
- Consider implementing connection pooling if needed
- Use CloudFront caching for static assets (enabled by default)

## Future Optimizations

If you encounter limitations with the current setup:

1. **Persistent Rate Limiting**: Implement DynamoDB-based rate limiting
2. **Caching**: Add Redis for session/response caching
3. **Monitoring**: Set up CloudWatch alarms for errors/performance
4. **CDN**: Optimize CloudFront configuration for your use case

The current setup should work well for most use cases. Monitor performance and optimize as needed based on actual usage patterns.