# AI Readiness Assessment

A self-service chatbot for assessing AI readiness of Philippine government agencies and NGOs.

## Features

- **Interactive Assessment**: 12-question guided interview across 6 key areas
- **AI-Powered**: Uses Google's Gemini 2.5 Flash for intelligent conversations
- **Automatic Report Generation**: Creates customized assessment reports with readiness levels
- **Multiple Download Formats**: Markdown and HTML reports with print-to-PDF capability
- **Session Management**: Conversations automatically end after report generation
- **Data Collection**: Automatically saves responses to Google Sheets with full solution details
- **Security Guardrails**: Comprehensive input validation, rate limiting, and PII redaction
- **Error Handling**: React error boundaries with graceful fallback UI
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: WCAG 2.1 compliant with full keyboard navigation
- **Production Ready**: Comprehensive testing suite and security headers

## Tech Stack

- **Frontend**: Next.js 15+ with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with responsive design
- **AI**: Google Generative AI (Gemini 2.5 Flash) with streaming responses
- **UI Components**: Lucide React icons, ReactMarkdown, custom components
- **Testing**: Vitest with React Testing Library
- **Security**: Content Security Policy, rate limiting, input validation
- **Deployment**: Vercel with optional Vercel KV for distributed rate limiting
- **Data Storage**: Google Sheets via Apps Script webhook

## Quick Start

### Development

1. Clone or download this repository

2. **Important**: Move to a local drive (e.g., `C:\Projects\`)
   - Running from Google Drive is slow due to file locking

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create `.env.local` file:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url_here
   ```

5. Run development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Google Sheets Setup (Optional - for collecting responses)

1. Create a Google Sheet with these headers in Row 1:
   - **Column A**: Timestamp
   - **Column B**: Organization
   - **Column C**: Domain
   - **Column D**: Readiness Level
   - **Column E**: Primary Solution (automatically extracted from report)
   - **Column F**: Secondary Solution (automatically extracted from report)
   - **Column G**: Next Steps (automatically extracted from report)
   - **Column H**: Conversation History (sanitized with PII redacted)

2. Go to **Extensions** → **Apps Script** and paste this code:

```javascript
/**
 * Shared secret for HMAC-SHA256 verification (must match WEBHOOK_SIGNING_SECRET).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Leave as 'YOUR_SECRET_HERE' to skip verification (not recommended for production).
 */
const SIGNING_SECRET = 'YOUR_SECRET_HERE';
const MAX_TIMESTAMP_DRIFT_MS = 300000; // 5 minutes

function doPost(e) {
  try {
    // Verify HMAC signature if configured
    if (SIGNING_SECRET && SIGNING_SECRET !== 'YOUR_SECRET_HERE') {
      const signature = getHeaderValue(e, 'X-Webhook-Signature');
      const timestamp = getHeaderValue(e, 'X-Webhook-Timestamp');
      if (!signature || !timestamp) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Missing signature' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const requestAge = Date.now() - Number(timestamp);
      if (isNaN(requestAge) || Math.abs(requestAge) > MAX_TIMESTAMP_DRIFT_MS) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Request expired' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      const expected = computeHmacSha256(timestamp + '.' + e.postData.contents, SIGNING_SECRET);
      if (signature !== expected) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid signature' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp, data.organization, data.domain, data.readinessLevel,
      data.primarySolution, data.secondarySolution, data.nextSteps, data.conversationHistory
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getHeaderValue(e, name) {
  if (e.parameter && e.parameter[name]) return e.parameter[name];
  if (e.headers && e.headers[name]) return e.headers[name];
  return null;
}

function computeHmacSha256(message, secret) {
  return Utilities.computeHmacSha256Signature(message, secret)
    .map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}
```

3. Deploy as **Web app** (Execute as: Me, Access: Anyone)
4. Copy the Web App URL and add to `.env.local` as `GOOGLE_SHEETS_WEBHOOK_URL`

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
ai-readiness-assessment/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoint with AI streaming
│   │   └── submit/        # Submission API for Google Sheets
│   ├── layout.tsx         # Root layout with error boundaries
│   ├── page.tsx           # Main chat interface
│   └── globals.css        # Global styles
├── components/
│   ├── AssessmentComplete.tsx  # Completion screen with downloads
│   ├── ChatHeader.tsx         # Header component
│   ├── ChatInput.tsx          # Input with validation
│   ├── ChatMessage.tsx        # Message display
│   ├── ErrorAlert.tsx         # Error notifications
│   ├── ErrorBoundary.tsx      # Error boundary components
│   └── LoadingIndicator.tsx   # Loading animation
├── lib/
│   ├── constants.ts       # Application constants
│   ├── env.ts            # Environment validation
│   ├── rate-limit.ts     # Rate limiting (Vercel KV + in-memory)
│   ├── report-parser.ts  # Assessment report parsing
│   ├── systemPrompt.ts   # AI system prompt & assessment logic
│   ├── types.ts          # TypeScript definitions
│   ├── utils.ts          # Utility functions
│   ├── validation.ts     # Security and data validation
│   └── webhook-signing.ts # HMAC-SHA256 webhook signing
├── tests/                # Comprehensive test suite
├── public/               # Static assets
├── .env.example          # Environment variables template
├── DEPLOYMENT.md         # Deployment guide
├── DEVELOPMENT.md        # Developer setup guide
├── SECURITY.md           # Security guidelines
└── package.json          # Dependencies
```

## How It Works

1. **User visits the app** - Greeted by the AI assistant
2. **Interactive interview** - 12 questions across 6 sections:
   - Agency Context
   - Domain Classification
   - Pain Points
   - Data & Systems
   - Readiness Signals
   - Interest & Constraints
3. **AI generates report** - Customized assessment with readiness level and recommendations
4. **Data saved** - Response automatically sent to Google Sheets with full details:
   - Organization, Domain, Readiness Level
   - Primary and Secondary AI solutions
   - Next steps for implementation
   - Sanitized conversation history (with PII redacted)
5. **Session ends** - Input form disabled, preventing further conversation
6. **Download available** - User can download Markdown report or start a new assessment

## Assessment Output

The tool provides:
- **Readiness Classification**: High/Medium/Low
- **AI Solution Recommendations**: Prioritized list of suitable AI solutions
- **Next Steps**: Actionable recommendations for AI adoption

## Security Features

This application implements multiple layers of security to protect against abuse and data breaches:

- **Input Validation**: 2,000 character limit per message, content quality checks
- **Rate Limiting**:
  - 30 requests per minute for chat API
  - 5 submissions per 5 minutes for data submission
- **PII Redaction**: Automatic redaction of emails and phone numbers from stored data
- **Session Control**: Input disabled after assessment completion
- **Prompt Injection Detection**: Monitors for suspicious patterns
- **Data Sanitization**: Conversation history sanitized before storage

For detailed security information, see [SECURITY.md](./SECURITY.md)

## Environment Variables

**Required:**
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI API key

**Optional (for enhanced features):**
- `GOOGLE_SHEETS_WEBHOOK_URL` - Google Apps Script webhook URL (for data collection)
- `KV_REST_API_URL` - Vercel KV URL (for distributed rate limiting in production)
- `KV_REST_API_TOKEN` - Vercel KV token (for distributed rate limiting in production)

**Development vs Production:**
- Development: Uses in-memory rate limiting
- Production: Automatically uses Vercel KV if configured, falls back to in-memory

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

## Key Files

- `app/page.tsx` - Main chat interface with error boundaries
- `app/api/chat/route.ts` - Chat API handler with AI streaming and rate limiting
- `app/api/submit/route.ts` - Submission handler for Google Sheets integration
- `components/` - Modular React components with TypeScript
- `lib/systemPrompt.ts` - AI system prompt with questionnaire logic
- `lib/validation.ts` - Security validation and PII redaction
- `lib/rate-limit.ts` - Production-ready rate limiting (Vercel KV + in-memory)
- `lib/types.ts` - Comprehensive TypeScript type definitions
- `tests/` - Complete test suite for components and API routes
- `middleware.ts` - Security headers and Content Security Policy

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For questions or issues, please open an issue on the repository.
