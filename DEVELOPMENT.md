# Development Guide

## Project Structure

```
ai-readiness-assessment/
├── app/
│   ├── api/
│   │   ├── chat/         # Chat API endpoint with AI streaming
│   │   └── submit/       # Assessment submission endpoint
│   ├── layout.tsx        # Root layout with analytics
│   └── page.tsx          # Main chat interface
├── components/
│   ├── AssessmentComplete.tsx  # Completion screen with downloads
│   ├── ChatHeader.tsx         # Header component
│   ├── ChatInput.tsx          # Input component with validation
│   ├── ChatMessage.tsx        # Message display component
│   ├── ErrorAlert.tsx         # Error notification component
│   └── LoadingIndicator.tsx   # Loading animation
├── lib/
│   ├── constants.ts       # Application constants and patterns
│   ├── env.ts            # Environment validation
│   ├── rate-limit.ts     # Rate limiting (Vercel KV + in-memory)
│   ├── report-parser.ts  # Assessment report parsing
│   ├── systemPrompt.ts   # AI system prompt
│   ├── types.ts          # TypeScript type definitions
│   └── validation.ts     # Security and data validation
└── package.json
```

## Architecture

### Frontend (Next.js App Router)

- **React Components**: Modular, reusable UI components with TypeScript
- **AI SDK**: Vercel AI SDK for streaming chat responses
- **Tailwind CSS**: Utility-first styling with responsive design
- **Accessibility**: WCAG 2.1 compliant with ARIA labels and keyboard navigation

### Backend (API Routes)

- **Chat API** (`/api/chat`):
  - Streams responses from Google Gemini AI
  - Rate limiting: 30 requests per minute per IP
  - Content validation and prompt injection detection
  - Message length and count limits

- **Submit API** (`/api/submit`):
  - Submits assessments to Google Sheets webhook
  - Rate limiting: 5 submissions per 5 minutes per IP
  - Data structure validation
  - PII sanitization before storage

### Security Features

1. **Rate Limiting**:
   - Production: Vercel KV (Redis-based, distributed)
   - Development: In-memory fallback
   - Automatic cleanup of old entries
   - Configurable limits per endpoint

2. **Input Validation**:
   - Maximum message length (2000 characters)
   - Maximum conversation size (50 messages)
   - Spam detection (unique character analysis)
   - Prompt injection pattern detection

3. **Data Sanitization**:
   - PII redaction (email, phone, SSN)
   - Conversation history truncation
   - Field length limits
   - Structure validation

## Environment Variables

### Required

- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Optional

- `GOOGLE_SHEETS_WEBHOOK_URL`: Webhook URL for Google Sheets integration
- `KV_REST_API_URL`: Vercel KV REST API URL (for production rate limiting)
- `KV_REST_API_TOKEN`: Vercel KV REST API token (for production rate limiting)

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Rate Limiting Setup

### Development (In-Memory)

No configuration needed. The app automatically uses in-memory rate limiting in development.

### Production (Vercel KV)

1. **Create Vercel KV database**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage
   - Create a new KV database

2. **Link to project**:
   ```bash
   vercel link
   vercel env pull
   ```

3. **Deploy**:
   ```bash
   vercel deploy
   ```

The app will automatically detect KV credentials and use distributed rate limiting.

## Testing

### Manual Testing Checklist

- [ ] Chat interaction works correctly
- [ ] Messages display with proper formatting
- [ ] Rate limiting triggers after threshold
- [ ] Assessment completion detected
- [ ] Report download (Markdown) works
- [ ] Report download (PDF) works
- [ ] New assessment reset works
- [ ] Mobile responsive design
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

### Security Testing

- [ ] Prompt injection attempts are logged
- [ ] Long messages are rejected
- [ ] Too many messages are rejected
- [ ] Rate limit blocks excessive requests
- [ ] PII is redacted in stored data

## Code Quality Standards

### TypeScript

- ✅ Strict mode enabled
- ✅ No `any` types (except controlled legacy code)
- ✅ Explicit return types on functions
- ✅ Interface definitions for all data structures

### Components

- ✅ Functional components with hooks
- ✅ Props interfaces defined
- ✅ JSDoc comments on exported functions
- ✅ Accessibility attributes (ARIA, roles)

### Security

- ✅ Input validation on all user data
- ✅ Rate limiting on all API routes
- ✅ PII sanitization before storage
- ✅ Content Security Policy headers
- ✅ HTTPS only in production

### Performance

- ✅ Code splitting with dynamic imports
- ✅ Lazy loading for PDF generation
- ✅ Efficient re-renders with proper dependencies
- ✅ Cleanup in useEffect hooks

## Deployment

### Vercel (Recommended)

```bash
vercel deploy --prod
```

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in your platform

3. Start the server:
   ```bash
   npm start
   ```

## Monitoring

### Logs

- Check Vercel dashboard for runtime logs
- Monitor rate limiting warnings
- Review prompt injection detection logs

### Analytics

- Vercel Analytics enabled by default
- Tracks page views and user interactions
- Privacy-friendly (no cookies)

## Troubleshooting

### Rate Limiting Not Working

**Issue**: Rate limits not enforced across multiple server instances

**Solution**: Configure Vercel KV:
```bash
# Check if KV is configured
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN

# If empty, link your project
vercel link
vercel env pull
```

### Build Errors

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Check types
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### PDF Generation Fails

**Issue**: PDF download shows error

**Solution**:
- Check browser console for errors
- Ensure html2pdf.js is installed
- Try Markdown download as fallback

## Contributing

1. Follow the existing code style
2. Add JSDoc comments to new functions
3. Update TypeScript types
4. Test accessibility with keyboard navigation
5. Run build before committing

## License

Private project - All rights reserved
