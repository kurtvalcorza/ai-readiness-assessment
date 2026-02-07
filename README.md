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
- **Testing**: Vitest with React Testing Library (>80% coverage)
- **Validation**: Zod for runtime type validation
- **Security**: Content Security Policy, rate limiting, input validation
- **Deployment**: Vercel with optional Vercel KV for distributed rate limiting
- **Data Storage**: Google Sheets via Apps Script webhook
- **Architecture**: Custom hooks, service layer, utility functions

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

2. Go to **Extensions** → **Apps Script** and paste the webhook code from [DEPLOYMENT.md](./DEPLOYMENT.md#create-a-google-apps-script-webhook)

3. Deploy as **Web app** (Execute as: Me, Access: Anyone)
4. Copy the Web App URL and add to `.env.local` as `GOOGLE_SHEETS_WEBHOOK_URL`

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Architecture

This application follows a clean architecture pattern with clear separation of concerns:

- **Presentation Layer**: React components focused on UI rendering
- **Business Logic Layer**: Custom hooks and service functions
- **API Layer**: Thin controllers that delegate to services
- **Utilities Layer**: Shared utilities, constants, and validation

### Design Patterns

- **Custom Hooks**: Encapsulate complex state management and side effects
- **Service Layer**: Framework-agnostic business logic for testability
- **Utility Functions**: Consistent response formatting and error handling
- **Type Safety**: Runtime validation with Zod and compile-time TypeScript

## Project Structure

```
ai-readiness-assessment/
├── app/
│   ├── api/
│   │   ├── chat/          # Chat API endpoint with AI streaming
│   │   ├── submit/        # Submission API for Google Sheets
│   │   └── csp-report/    # CSP violation reporting
│   ├── layout.tsx         # Root layout with error boundaries
│   ├── page.tsx           # Main chat interface (<200 lines)
│   └── globals.css        # Global styles
├── components/
│   ├── AssessmentComplete.tsx  # Completion screen with downloads
│   ├── ChatHeader.tsx         # Header component
│   ├── ChatInput.tsx          # Input with validation
│   ├── ChatMessage.tsx        # Message display
│   ├── ChatMessageList.tsx    # Message list container
│   ├── ErrorAlert.tsx         # Error notifications
│   ├── ErrorBoundary.tsx      # Error boundary components
│   └── LoadingIndicator.tsx   # Loading animation
├── hooks/
│   ├── useAssessmentLogic.ts  # Assessment state & completion logic
│   ├── useChatScroll.ts       # Auto-scroll behavior
│   └── useConsent.ts          # Consent banner management
├── services/
│   ├── chatService.ts         # Chat validation & message prep
│   └── submissionService.ts   # Assessment submission logic
├── lib/
│   ├── api-utils.ts       # Response formatting utilities
│   ├── constants/
│   │   ├── parsing.ts     # Report parsing patterns
│   │   ├── security.ts    # Rate limits & injection patterns
│   │   └── validation.ts  # PII patterns & validation rules
│   ├── env.ts            # Environment validation with Zod
│   ├── rate-limit.ts     # Rate limiting (Vercel KV + in-memory)
│   ├── report-parser.ts  # Assessment report parsing
│   ├── schemas.ts        # Zod schemas for validation
│   ├── systemPrompt.ts   # AI system prompt & assessment logic
│   ├── types.ts          # TypeScript definitions
│   ├── utils.ts          # Utility functions
│   └── validation.ts     # Security and data validation
├── tests/
│   ├── components/       # Component tests
│   ├── hooks/            # Hook tests
│   ├── integration/      # End-to-end flow tests
│   ├── services/         # Service layer tests
│   └── api/              # API route tests
├── public/               # Static assets
├── .env.example          # Environment variables template
├── ARCHITECTURE.md       # Detailed architecture documentation
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

## Development Guide

### Adding New Features

1. **New API Endpoint**: Create route handler in `app/api/`, use `createJsonResponse` and `createErrorResponse` from `lib/api-utils.ts`
2. **New Business Logic**: Add service functions in `services/`, keep them framework-agnostic
3. **New Component**: Create in `components/`, add tests in `tests/components/`
4. **New Hook**: Create in `hooks/`, add tests in `tests/hooks/`
5. **New Constants**: Add to appropriate file in `lib/constants/`

### Testing Guidelines

- **Unit Tests**: Test services and hooks in isolation
- **Component Tests**: Use React Testing Library, test user interactions
- **Integration Tests**: Test complete user flows end-to-end
- **Coverage Target**: Maintain >80% coverage for new code

Run tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

### Code Organization Principles

- **Components**: Focus on rendering, delegate logic to hooks
- **Hooks**: Manage state and side effects, return clear interfaces
- **Services**: Pure functions for business logic, no framework dependencies
- **API Routes**: Thin controllers that validate input and call services

### Key Files

- `app/page.tsx` - Main chat interface (<200 lines, uses custom hooks)
- `hooks/useAssessmentLogic.ts` - Assessment state management and completion detection
- `services/chatService.ts` - Chat validation and message preparation
- `services/submissionService.ts` - Assessment submission and formatting
- `lib/api-utils.ts` - Consistent response formatting for API routes
- `lib/schemas.ts` - Zod schemas for runtime validation
- `lib/constants/` - Organized constants by domain (security, validation, parsing)
- `tests/` - Comprehensive test suite with >80% coverage
- `middleware.ts` - Security headers and Content Security Policy

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License

## Support

For questions or issues, please open an issue on the repository.
