# Security Measures

This document outlines the security measures implemented in the AI Readiness Assessment application to protect against abuse, data breaches, and malicious attacks.

## Overview

The application implements multiple layers of security controls at both the frontend and backend to ensure safe operation and protect user data.

**Recent Security Enhancements (February 2026):**
- ✅ Privacy consent banner with user control
- ✅ Hardened Content Security Policy (CSP) with nonce-based scripts
- ✅ Environment-based security configuration
- ✅ CSP violation reporting
- ✅ Fixed CSP regression (removed unsafe-inline/unsafe-eval in production)
- ✅ Updated Next.js to 16.1.6 (patched DoS vulnerabilities)

---

## 1. Privacy & Consent Management

### User Consent Banner
- **Implementation**: `components/ConsentBanner.tsx`, `lib/consent.ts`
- **Behavior**:
  - Displays on first visit with clear privacy notice
  - User can accept or decline data collection
  - Choice stored in localStorage
  - Consent required for Google Sheets submission
- **User Control**:
  - Accept: Assessment data saved to Google Sheets
  - Decline: Assessment works, but data not saved (PDF download still available)
  - Preference persists across sessions

### Data Collection Transparency
- Clear explanation of what data is collected
- User consent required before submission
- PII sanitization before storage
- Option to decline without losing functionality

---

## 2. Content Security Policy (CSP)

### Environment-Based Configuration
- **Development Mode**: Relaxed CSP for hot reload and dev tools
  - Allows `'unsafe-eval'` and `'unsafe-inline'` for development
  - Wildcard domains for testing
- **Production Mode**: Strict CSP for maximum security
  - Nonce-based inline scripts only
  - No `'unsafe-eval'` or `'unsafe-inline'`
  - Specific domains only (no wildcards)

### CSP Directives (Production)
```
default-src 'self';
script-src 'self' 'nonce-{random}' https://va.vercel-scripts.com https://vitals.vercel-insights.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' blob: data: https://fonts.gstatic.com;
font-src 'self' https://fonts.gstatic.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self' https://acabai-ph.vercel.app https://master.d3bx5uqqofxvve.amplifyapp.com https://kurt.valcorza.com;
connect-src 'self' https://generativelanguage.googleapis.com https://script.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com;
worker-src 'self' blob:;
upgrade-insecure-requests;
block-all-mixed-content;
report-uri /api/csp-report;
```

### Nonce-Based Script Execution
- Unique cryptographic nonce generated per request
- Only scripts with valid nonce can execute
- Prevents XSS attacks via inline script injection
- Next.js automatically applies nonce to framework scripts

### CSP Violation Reporting
- **Endpoint**: `/api/csp-report`
- **Purpose**: Logs all CSP violations for monitoring
- **Integration**: Ready for Sentry or other monitoring services
- **Location**: `app/api/csp-report/route.ts`

---

## 3. Session Management

### Assessment Completion Control
- **Issue Addressed**: Users could continue conversations after assessment completion, potentially consuming API resources unnecessarily
- **Solution**:
  - Input form is disabled once assessment is complete
  - Users cannot submit additional messages after receiving their report
  - Only "Download Report" and "Start New Assessment" options available post-completion
- **Location**: `app/page.tsx`

---

## 4. Input Validation

### Frontend Validation

#### Character Limit Enforcement
- **Maximum Input Length**: 2,000 characters per message
- **Implementation**:
  - Client-side validation with `maxLength` attribute
  - Real-time character counter displayed to users
  - Submit button disabled when limit exceeded
- **Location**: `app/page.tsx:11-12, 240-243`

#### Content Quality Validation
- **Protection Against**: Spam, gibberish, and low-quality input
- **Mechanism**: Detects extremely repetitive content (< 5 unique characters in 100+ char messages)
- **Location**: `app/page.tsx:67-71`

### Backend Validation

#### Server-Side Input Validation
- **Message Length**: Enforces 2,000 character limit on server
- **Message Count**: Maximum 50 messages per conversation
- **Repetitive Content Detection**: Same algorithm as frontend
- **Prompt Injection Detection**: Monitors for suspicious patterns:
  - "ignore previous instructions"
  - "disregard all instructions"
  - "system: you are..."
  - `<script>` tags
- **Location**: `app/api/chat/route.ts:39-91`

#### Field Size Validation
- **Organization/Domain Fields**: Maximum 500 characters
- **Prevents**: Database overflow and DoS attacks via large payloads
- **Location**: `app/api/submit/route.ts:77-82`

---

## 3. Rate Limiting

### Chat API Rate Limiting
- **Limit**: 30 requests per minute per IP address
- **Window**: 60 seconds (1 minute)
- **Response**: HTTP 429 (Too Many Requests) with `Retry-After: 60` header
- **Implementation**: In-memory tracking with automatic cleanup every 5 minutes
- **Location**: `app/api/chat/route.ts:9-46`

### Submission API Rate Limiting
- **Limit**: 5 submissions per 5 minutes per IP address
- **Window**: 300 seconds (5 minutes)
- **Response**: HTTP 429 with `Retry-After: 300` header
- **Purpose**: Prevents spam submissions to Google Sheets
- **Location**: `app/api/submit/route.ts:19-51`

### Rate Limiting Mechanism
- Uses IP address from `x-forwarded-for` header (Vercel provides this)
- Gracefully degrades to 'unknown' if IP unavailable
- Automatic cleanup of expired rate limit records
- No external dependencies (Redis, etc.) required

---

## 4. Data Sanitization

### Conversation History Sanitization
Before storing conversation data in Google Sheets, the following sanitization is applied:

#### PII Redaction
- **Email Addresses**: Replaced with `[EMAIL_REDACTED]`
  - Pattern: `[\w.%+-]+@[\w.-]+\.[A-Z]{2,}`
- **Phone Numbers**: Replaced with `[PHONE_REDACTED]`
  - Pattern: `\d{3}[-.]?\d{3}[-.]?\d{4}`
- **Location**: `app/page.tsx:155-165`

#### Message Truncation
- **Per-Message Limit**: 500 characters
- **Longer messages**: Truncated with `...[truncated]` suffix
- **Total History Limit**: 50,000 bytes
- **Purpose**: Prevents storage abuse and reduces sensitive data exposure

#### Implementation Details
- Creates simplified conversation structure with only role and sanitized content
- Removes all metadata and non-text content
- Fails gracefully with error message if sanitization fails
- **Location**: `app/page.tsx:152-178`

---

## 5. Data Extraction & Parsing

### Solutions Table Parsing
- **Method**: Regex-based markdown table parsing
- **Extracted Fields**: Priority, Group, Category, Fit, Rationale
- **Validation**: Checks for minimum required columns (5)
- **Location**: `app/page.tsx:106-122`

### Next Steps Parsing
- **Method**: Regex-based numbered list extraction
- **Pattern**: `\d+\.\s+(.+)`
- **Location**: `app/page.tsx:124-133`

### Defensive Programming
- All extractions use optional chaining (`?.`) and fallbacks (`|| 'Unknown'`)
- Invalid or missing data doesn't break the submission
- **Location**: `app/page.tsx:94-144`

---

## 6. Error Handling

### Client-Side Error Handling
- User-friendly error messages displayed in UI
- Errors don't expose internal system details
- Clear guidance provided for resolution (e.g., "Message too long")
- **Location**: `app/page.tsx:206-210, 257-261`

### Server-Side Error Handling
- All API endpoints wrapped in try-catch blocks
- Generic error messages returned to client
- Detailed errors logged server-side only
- HTTP status codes used correctly (400, 429, 500)
- **Location**: `app/api/chat/route.ts:92-100`, `app/api/submit/route.ts:121-129`

---

## 7. Content Security

### Markdown Rendering Safety
- **Library**: `react-markdown` with `remark-gfm`
- **Built-in Protection**: Automatically sanitizes HTML and prevents XSS
- **No Raw HTML**: Only markdown features allowed
- **Location**: `app/page.tsx:152-157`

### React's Built-in XSS Protection
- All user input rendered through React components
- Automatic HTML escaping
- No `dangerouslySetInnerHTML` used

---

## 8. Environment Security

### API Key Protection
- Google AI API key stored in environment variables
- Never committed to git (`.env.local` in `.gitignore`)
- Validation on startup with helpful error messages
- **Location**: `lib/env.ts`

### Vercel Deployment Security
- HTTPS enforced by default
- Environment variables encrypted at rest
- Webhook URLs not exposed to client
- **Documentation**: `DEPLOYMENT.md:176-181`

---

## 9. Google Sheets Integration Security

### Webhook Security Considerations
- Webhook URL should be treated as sensitive
- Consider using Google Apps Script authorization
- Optional feature (app works without it)
- Sanitized data sent (no raw user input)
- **Location**: `app/api/submit/route.ts:58-91`

### Data Privacy
- Conversation history sanitized before storage
- PII redacted automatically
- Users should be informed about data collection
- Consider adding privacy policy and consent mechanisms

---

## 10. Known Limitations & Future Improvements

### Current Limitations
1. **Rate Limiting**: In-memory storage, resets on server restart
2. **IP-Based**: Can be bypassed with VPN/proxies (acceptable for low-stakes app)
3. **PII Detection**: Basic regex patterns, may miss complex PII
4. **No Authentication**: Anyone can use the assessment tool
5. **Prompt Injection**: Detection only, not blocking (to avoid false positives)

### Recommended Future Enhancements
1. **Persistent Rate Limiting**: Use Redis or similar for cross-instance rate limiting
2. **Advanced PII Detection**: Use ML-based entity recognition
3. **CAPTCHA**: Add reCAPTCHA for submission to prevent bot abuse
4. **Authentication**: Optional user accounts for tracking assessments
5. **Audit Logging**: Log all submissions with metadata for security monitoring
6. **Content Security Policy (CSP)**: Add CSP headers to prevent inline scripts
7. **Webhook Security**: Implement HMAC signature verification for Google Sheets webhook
8. **Data Retention Policy**: Automatic deletion of old conversation data
9. **User Consent**: Add privacy policy and explicit consent before data collection
10. **API Key Rotation**: Regular rotation schedule for Google AI API key

---

## Security Checklist for Deployment

- [ ] Environment variables configured correctly
- [ ] `.env.local` not committed to git
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Google Sheets webhook URL kept confidential
- [ ] Rate limiting tested and working
- [ ] Input validation tested with edge cases
- [ ] Error messages don't leak sensitive information
- [ ] PII redaction tested with sample data
- [ ] Users informed about data collection
- [ ] Monitoring and logging enabled for security events

---

## Incident Response

If you suspect a security issue:

1. **Do Not** disable the application immediately (may alert attackers)
2. **Review Logs**: Check server logs for unusual patterns
3. **Check Rate Limits**: Verify if rate limiting is triggering
4. **Review Google Sheets**: Check for suspicious submissions
5. **Rotate Keys**: If compromise suspected, rotate Google AI API key
6. **Update Webhook**: Generate new Google Sheets webhook URL if exposed
7. **Document**: Record the incident and response actions taken

---

## Questions or Concerns?

For security-related questions or to report a vulnerability, please contact the repository maintainer.

**Note**: This is a self-service assessment tool for educational/organizational use. It should not be used to collect or store highly sensitive personal information.
