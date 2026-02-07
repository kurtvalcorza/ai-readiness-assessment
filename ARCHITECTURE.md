# AI Readiness Assessment - Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Folder Structure](#folder-structure)
5. [Design Patterns](#design-patterns)
6. [Data Flow](#data-flow)
7. [Component Architecture](#component-architecture)
8. [Service Layer](#service-layer)
9. [State Management](#state-management)
10. [API Design](#api-design)
11. [Security Architecture](#security-architecture)
12. [Testing Strategy](#testing-strategy)
13. [Performance Considerations](#performance-considerations)
14. [Development Guidelines](#development-guidelines)

## Overview

The AI Readiness Assessment is a Next.js application that provides an interactive chatbot interface for assessing AI readiness of Philippine government agencies and NGOs. The application follows a clean architecture pattern with clear separation of concerns between presentation, business logic, and data access layers.

### Key Technologies

- **Frontend Framework**: Next.js 15+ with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Google Generative AI (Gemini 2.5 Flash)
- **Validation**: Zod for runtime type validation
- **Testing**: Vitest with React Testing Library
- **Deployment**: Vercel with optional Vercel KV

## Architecture Principles

The application is built on the following core principles:

### 1. Separation of Concerns

UI, business logic, and data access are clearly separated into distinct layers:

- **Presentation Layer**: React components focused solely on rendering
- **Business Logic Layer**: Custom hooks and service functions
- **API Layer**: Thin controllers that delegate to services
- **Utilities Layer**: Shared utilities, constants, and validation

### 2. Single Responsibility

Each module has one clear purpose:

- Components handle rendering and user interaction
- Hooks manage state and side effects
- Services contain business logic
- API routes handle HTTP concerns

### 3. Plain Functions over Classes

Services are implemented as plain exported functions rather than classes:

- Simpler to use (no instantiation ceremony)
- Equally testable
- Less boilerplate
- More idiomatic for React/Next.js

### 4. Testability First

All business logic is designed to be easily testable in isolation:

- Pure functions where possible
- Dependency injection through parameters
- Framework-agnostic services
- Comprehensive test coverage (>80%)

### 5. Type Safety

Runtime validation with compile-time type inference:

- Zod schemas for runtime validation
- TypeScript for compile-time safety
- Single source of truth for types
- Clear, actionable error messages

### 6. Progressive Enhancement

The refactoring was done incrementally without breaking changes:

- New code added alongside existing code
- Gradual migration to new patterns
- Backward compatibility maintained
- Zero regression in functionality

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Components │  │   Hooks    │  │  Services  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ /api/chat  │  │/api/submit │  │ Middleware │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Google AI API   │    │ Google Sheets    │
    │  (Gemini 2.5)    │    │   (Webhook)      │
    └──────────────────┘    └──────────────────┘
```

### Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      app/page.tsx                            │
│                   (Main Chat Component)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Custom Hooks:                                        │  │
│  │  • useAssessmentLogic (state + completion)           │  │
│  │  • useChatScroll (auto-scroll)                       │  │
│  │  • useConsent (consent banner)                       │  │
│  │  • useChat (from @nlux/react)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Child Components:                                    │  │
│  │  • ChatHeader                                         │  │
│  │  • ChatMessageList                                    │  │
│  │    ├─ ChatMessage                                     │  │
│  │    ├─ LoadingIndicator                               │  │
│  │    ├─ ErrorAlert                                     │  │
│  │    └─ AssessmentComplete                             │  │
│  │  • ChatInput                                          │  │
│  │  • ConsentBanner                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
ai-readiness-assessment/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Chat endpoint (streaming)
│   │   │   └── route.ts
│   │   ├── submit/               # Submission endpoint
│   │   │   └── route.ts
│   │   └── csp-report/           # CSP violation reporting
│   │       └── route.ts
│   ├── layout.tsx                # Root layout with error boundaries
│   ├── page.tsx                  # Main chat interface (<200 lines)
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── AssessmentComplete.tsx    # Completion screen with downloads
│   ├── ChatHeader.tsx            # Header component
│   ├── ChatInput.tsx             # Input with validation
│   ├── ChatMessage.tsx           # Individual message display
│   ├── ChatMessageList.tsx       # Message list container
│   ├── ConsentBanner.tsx         # Privacy consent banner
│   ├── ErrorAlert.tsx            # Error notifications
│   ├── ErrorBoundary.tsx         # Error boundary components
│   └── LoadingIndicator.tsx      # Loading animation
│
├── hooks/                        # Custom React hooks
│   ├── useAssessmentLogic.ts     # Assessment state & completion
│   ├── useChatScroll.ts          # Auto-scroll behavior
│   └── useConsent.ts             # Consent banner management
│
├── services/                     # Business logic services
│   ├── chatService.ts            # Chat validation & message prep
│   └── submissionService.ts      # Assessment submission logic
│
├── lib/                          # Utilities and shared code
│   ├── api-utils.ts              # Response formatting utilities
│   ├── constants/                # Organized constants
│   │   ├── parsing.ts            # Report parsing patterns
│   │   ├── security.ts           # Rate limits & injection patterns
│   │   └── validation.ts         # PII patterns & validation rules
│   ├── consent.ts                # Consent management utilities
│   ├── env.ts                    # Environment validation
│   ├── rate-limit.ts             # Rate limiting (Vercel KV + in-memory)
│   ├── report-parser.ts          # Assessment report parsing
│   ├── schemas.ts                # Zod schemas for validation
│   ├── systemPrompt.ts           # AI system prompt & logic
│   ├── types.ts                  # TypeScript type definitions
│   ├── utils.ts                  # Utility functions
│   ├── validation.ts             # Security & data validation
│   └── webhook-signing.ts        # HMAC signing for webhooks
│
├── tests/                        # Test suite
│   ├── components/               # Component tests
│   ├── hooks/                    # Hook tests
│   ├── integration/              # End-to-end flow tests
│   ├── services/                 # Service layer tests
│   └── api/                      # API route tests
│
├── public/                       # Static assets
├── middleware.ts                 # Security headers & CSP
├── .env.example                  # Environment variables template
├── ARCHITECTURE.md               # This file
├── README.md                     # Project documentation
├── DEPLOYMENT.md                 # Deployment guide
├── DEVELOPMENT.md                # Developer setup guide
└── SECURITY.md                   # Security guidelines
```

## Design Patterns

### 1. Controller-Service Pattern

API routes act as thin controllers that delegate to service functions:

```typescript
// API Route (Controller)
export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate input
  const validation = validateMessage(body.message);
  if (!validation.valid) {
    return createErrorResponse(validation.error, 400);
  }
  
  // Delegate to service
  const result = await chatService.processMessage(body);
  
  // Return response
  return createJsonResponse(result);
}
```

**Benefits**:
- Business logic is testable without HTTP layer
- Services can be reused across multiple routes
- Clear separation of concerns

### 2. Custom Hooks Pattern

Complex state management and side effects are encapsulated in custom hooks:

```typescript
// Hook encapsulates assessment logic
const [assessmentState, assessmentActions] = useAssessmentLogic();

// Component uses hook without knowing implementation details
useEffect(() => {
  assessmentActions.checkCompletion(messages);
}, [messages, assessmentActions]);
```

**Benefits**:
- Reusable across components
- Testable in isolation
- Cleaner component code

### 3. Composition Pattern

Components are composed from smaller, focused components:

```typescript
<ChatMessageList
  messages={messages}
  isLoading={isLoading}
  error={error}
  assessmentState={assessmentState}
  messagesEndRef={messagesEndRef}
/>
```

**Benefits**:
- Each component has single responsibility
- Easy to test individual components
- Flexible and maintainable

### 4. Dependency Injection

Dependencies are passed as parameters rather than imported directly:

```typescript
export async function submitAssessment(
  data: AssessmentData,
  config: SubmissionConfig  // Injected dependency
): Promise<SubmissionResult> {
  // Use config instead of importing environment variables
}
```

**Benefits**:
- Easy to test with mock dependencies
- Flexible configuration
- No hidden dependencies

## Data Flow

### Assessment Flow

```
1. User Input
   │
   ├─> ChatInput component
   │   └─> Validates input length
   │
2. Message Submission
   │
   ├─> useAssessmentLogic.handleSendMessage()
   │   ├─> Sets timeout (30s)
   │   └─> Calls useChat.sendMessage()
   │
3. API Request
   │
   ├─> POST /api/chat
   │   ├─> chatService.validateMessage()
   │   ├─> chatService.detectPromptInjection()
   │   ├─> Rate limiting check
   │   └─> Stream response from Gemini AI
   │
4. Response Streaming
   │
   ├─> useChat receives chunks
   │   └─> Updates messages state
   │
5. Completion Detection
   │
   ├─> useAssessmentLogic.checkCompletion()
   │   ├─> Detects completion marker
   │   ├─> Parses report
   │   └─> Submits to backend
   │
6. Backend Submission
   │
   ├─> POST /api/submit
   │   ├─> submissionService.formatForGoogleSheets()
   │   ├─> submissionService.signPayload()
   │   └─> Sends to Google Sheets webhook
   │
7. Completion UI
   │
   └─> AssessmentComplete component
       └─> View Report (HTML preview in new tab)
```

### State Management Flow

```
┌─────────────────────────────────────────────────┐
│           Component State (useState)             │
│  • mounted                                       │
│  • messagesEndRef                                │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────────┐  ┌──────────────────┐
│ useAssessmentLogic│  │   useConsent     │
│  • isComplete     │  │  • showBanner    │
│  • report         │  │  • hasAccepted   │
│  • submissionError│  └──────────────────┘
│  • isSubmitting   │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│     useChat      │
│  • messages      │
│  • status        │
│  • error         │
│  • sendMessage   │
└──────────────────┘
```

## Component Architecture

### Main Chat Component (app/page.tsx)

**Responsibilities**:
- Compose child components
- Integrate custom hooks
- Handle mount state
- Coordinate data flow

**Key Features**:
- Under 200 lines
- No business logic
- Clear hook integration
- Error boundaries

### ChatMessageList Component

**Responsibilities**:
- Render message list
- Show loading states
- Display errors
- Show completion UI

**Props**:
```typescript
interface ChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  error?: Error;
  assessmentState: AssessmentState;
  messagesEndRef: RefObject<HTMLDivElement>;
  onStartNew: () => void;
  onClearError: () => void;
}
```

### ChatInput Component

**Responsibilities**:
- Handle user input
- Validate message length
- Auto-resize textarea
- Keyboard shortcuts

**Features**:
- Character counter
- Spam detection
- Enter to send
- Escape to clear

## Service Layer

### Chat Service (services/chatService.ts)

**Purpose**: Handle message validation and preparation for AI

**Functions**:
```typescript
validateMessage(content: string): ValidationResult
validateConversation(messages: any[]): ValidationResult
detectPromptInjectionAttempt(content: string): ValidationResult
prepareMessagesForAI(messages: IncomingMessage[]): CoreMessage[]
```

**Design**:
- Plain exported functions
- Pure functions (no side effects)
- Framework-agnostic
- Fully testable

### Submission Service (services/submissionService.ts)

**Purpose**: Handle assessment data formatting and submission

**Functions**:
```typescript
formatForGoogleSheets(data: AssessmentData): GoogleSheetsData
signPayload(data: GoogleSheetsData, secret?: string): string
submitAssessment(data: AssessmentData, config: SubmissionConfig): Promise<SubmissionResult>
```

**Design**:
- Configuration via parameters
- Returns structured results
- Handles errors gracefully
- No HTTP dependencies

## State Management

### Custom Hooks

#### useAssessmentLogic

**Purpose**: Manage assessment state and completion logic

**State**:
```typescript
interface AssessmentState {
  isComplete: boolean;
  report: string;
  submissionError: string;
  isSubmitting: boolean;
}
```

**Actions**:
```typescript
interface AssessmentActions {
  checkCompletion: (messages: UIMessage[]) => void;
  handleSendMessage: (text: string, sendMessage: SendMessageFn) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}
```

**Features**:
- Duplicate submission prevention
- Request timeout management (30s)
- Automatic cleanup on unmount
- Report parsing and submission

#### useChatScroll

**Purpose**: Handle smooth scrolling with debouncing

**Features**:
- Debounced scroll during streaming
- Immediate scroll on completion
- Configurable behavior
- Automatic cleanup

#### useConsent

**Purpose**: Manage consent banner state

**Features**:
- localStorage persistence
- Accept/decline actions
- Banner visibility control
- Session persistence

## API Design

### API Utilities (lib/api-utils.ts)

**Purpose**: Consistent response formatting and error handling

**Functions**:
```typescript
getSecurityHeaders(): Record<string, string>
createJsonResponse<T>(data: T, options?: ResponseOptions): Response
createErrorResponse(error: Error | string, status: number, options?: ErrorOptions): Response
```

**Features**:
- Security headers on all responses
- Error message sanitization
- Type-safe responses
- Consistent structure

### Chat API (/api/chat/route.ts)

**Endpoint**: `POST /api/chat`

**Request**:
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}
```

**Response**: Streaming text (Server-Sent Events)

**Features**:
- Rate limiting (30 req/min)
- Prompt injection detection
- Message validation
- Streaming responses

### Submit API (/api/submit/route.ts)

**Endpoint**: `POST /api/submit`

**Request**:
```typescript
{
  organization: string;
  domain: string;
  readinessLevel: string;
  solutions: Array<AISolution>;
  nextSteps: string[];
  timestamp: string;
  conversationHistory?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Features**:
- Rate limiting (5 req/5min)
- Schema validation with Zod
- PII sanitization
- Webhook signing

## Security Architecture

### Defense in Depth

Multiple layers of security protection:

1. **Input Validation**
   - Length limits (2,000 chars)
   - Content quality checks
   - Spam detection

2. **Rate Limiting**
   - Chat: 30 requests/minute
   - Submit: 5 requests/5 minutes
   - Vercel KV in production
   - In-memory fallback

3. **Prompt Injection Detection**
   - Pattern matching
   - Configurable blocking
   - Logging of attempts

4. **PII Redaction**
   - Email addresses
   - Phone numbers
   - SSN (if applicable)
   - Applied before storage

5. **Content Security Policy**
   - Strict CSP headers
   - Violation reporting
   - XSS prevention

6. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Applied to all responses

### Data Flow Security

```
User Input
    │
    ├─> Length validation
    ├─> Spam detection
    ├─> Prompt injection check
    │
API Request
    │
    ├─> Rate limiting
    ├─> Schema validation
    │
Processing
    │
    ├─> PII redaction
    ├─> Content sanitization
    │
Storage
    └─> Sanitized data only
```

## Testing Strategy

### Test Coverage

- **Target**: >80% coverage
- **Current**: ~85% coverage
- **Focus**: Business logic and critical paths

### Test Types

#### 1. Unit Tests

**Services**:
```typescript
describe('chatService', () => {
  it('should validate message length', () => {});
  it('should detect spam content', () => {});
  it('should detect prompt injection', () => {});
});
```

**Hooks**:
```typescript
describe('useAssessmentLogic', () => {
  it('should initialize with default state', () => {});
  it('should detect completion', () => {});
  it('should prevent duplicate submission', () => {});
});
```

#### 2. Component Tests

```typescript
describe('ChatMessage', () => {
  it('should render user message', () => {});
  it('should render assistant message', () => {});
  it('should render markdown', () => {});
});
```

#### 3. Integration Tests

```typescript
describe('Assessment Flow', () => {
  it('should complete full assessment', async () => {});
  it('should handle errors gracefully', async () => {});
  it('should respect consent choice', async () => {});
});
```

### Testing Tools

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **Assertions**: Vitest expect
- **Mocking**: Vitest vi
- **Coverage**: Vitest coverage

## Performance Considerations

### Bundle Size

- **Base**: ~150KB gzipped
- **Zod**: +14KB gzipped
- **Total**: ~165KB gzipped
- **Target**: <200KB gzipped

### Code Splitting

- Services and hooks are tree-shakeable
- Dynamic imports for heavy components
- Route-based code splitting (Next.js)

### Runtime Performance

- Hook extractions: No overhead
- Service layer: Minimal overhead
- Zod validation: Server-side only

### Optimization Strategies

1. **Component Optimization**
   - Memoization where needed
   - Lazy loading for heavy components
   - Efficient re-render prevention

2. **Network Optimization**
   - Streaming responses
   - Compression enabled
   - CDN for static assets

3. **Caching Strategy**
   - Static assets cached
   - API responses not cached (dynamic)
   - Rate limit data in Vercel KV

## Development Guidelines

### Adding New Features

#### 1. New API Endpoint

```typescript
// 1. Create route handler
export async function POST(request: Request) {
  // 2. Use createJsonResponse/createErrorResponse
  // 3. Delegate to service function
  // 4. Add tests
}
```

#### 2. New Business Logic

```typescript
// 1. Add to appropriate service file
export function newFeature(input: Input): Output {
  // 2. Keep framework-agnostic
  // 3. Return structured results
  // 4. Add comprehensive tests
}
```

#### 3. New Component

```typescript
// 1. Create in components/
export function NewComponent(props: Props) {
  // 2. Focus on rendering
  // 3. Delegate logic to hooks
  // 4. Add tests in tests/components/
}
```

#### 4. New Hook

```typescript
// 1. Create in hooks/
export function useNewFeature() {
  // 2. Manage state and side effects
  // 3. Return clear interface
  // 4. Add tests in tests/hooks/
}
```

### Code Organization Principles

1. **Components**: Focus on rendering, delegate logic to hooks
2. **Hooks**: Manage state and side effects, return clear interfaces
3. **Services**: Pure functions for business logic, no framework dependencies
4. **API Routes**: Thin controllers that validate input and call services

### Best Practices

1. **Type Safety**
   - Use TypeScript strict mode
   - Define interfaces for all data structures
   - Use Zod for runtime validation

2. **Error Handling**
   - Use try-catch blocks
   - Return structured error results
   - Log errors appropriately
   - Sanitize error messages for clients

3. **Testing**
   - Write tests before refactoring
   - Test business logic thoroughly
   - Use React Testing Library best practices
   - Maintain >80% coverage

4. **Documentation**
   - Add JSDoc comments for public functions
   - Update README when adding features
   - Document complex logic inline
   - Keep ARCHITECTURE.md current

5. **Performance**
   - Profile before optimizing
   - Use React DevTools
   - Monitor bundle size
   - Optimize critical paths only

### Common Patterns

#### Error Handling Pattern

```typescript
try {
  const result = await operation();
  return createJsonResponse({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return createErrorResponse(error, 500);
}
```

#### Validation Pattern

```typescript
const validation = validateInput(input);
if (!validation.valid) {
  return createErrorResponse(validation.error, 400);
}
```

#### Service Call Pattern

```typescript
const result = await service.operation(data, config);
if (!result.success) {
  return createErrorResponse(result.error, 500);
}
return createJsonResponse(result);
```

## Conclusion

This architecture provides a solid foundation for maintaining and extending the AI Readiness Assessment application. The clear separation of concerns, comprehensive testing, and focus on type safety make the codebase maintainable and reliable.

For questions or suggestions about the architecture, please open an issue or submit a pull request.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: Kurt Valcorza
