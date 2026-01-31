# Iframe Embedding Configuration

This document explains how the AI Readiness Assessment app is configured to be embedded as an iframe in other applications, specifically the ACABAI-PH website.

## Problem

When we initially implemented Content Security Policy (CSP) headers for security, we used:
- `X-Frame-Options: DENY` 
- `frame-ancestors 'none'`

These settings prevented the app from being embedded in iframes, causing the "refused to connect" error when the ACABAI-PH website tried to load the assessment tool.

## Solution

### CSP Configuration
Updated the CSP `frame-ancestors` directive to allow embedding from trusted domains:

```
frame-ancestors 'self' https://*.vercel.app https://*.netlify.app https://*.github.io https://*.pages.dev https://localhost:* http://localhost:*
```

### X-Frame-Options Removal
Removed the `X-Frame-Options` header entirely to let the CSP `frame-ancestors` directive handle iframe embedding control. This is the modern approach recommended by security experts.

### Trusted Domains
The current configuration allows embedding from:
- Same origin (`'self'`)
- Vercel deployments (`*.vercel.app`)
- Netlify deployments (`*.netlify.app`) 
- GitHub Pages (`*.github.io`)
- Cloudflare Pages (`*.pages.dev`)
- Local development (`localhost:*`)

## Security Considerations

### Why This Is Safe
1. **Specific Domain Patterns**: We only allow embedding from known hosting platforms
2. **No Wildcard Domains**: We don't use `*` which would allow any domain
3. **HTTPS Enforcement**: All production domains require HTTPS
4. **CSP Protection**: Other CSP directives still protect against XSS and other attacks

### What's Protected
- Script injection attacks (via `script-src`)
- Style injection attacks (via `style-src`)
- Data exfiltration (via `connect-src`)
- Clickjacking from untrusted domains (via `frame-ancestors`)

## Usage in ACABAI-PH

The ACABAI-PH website embeds the assessment tool using:

```html
<iframe src="https://ai-readiness-assessment-eta.vercel.app/" class="assessment-iframe"></iframe>
```

This iframe loads in a modal dialog when users click the "AI Readiness Assessment" button.

## Testing Iframe Embedding

### Local Testing
1. Start the AI readiness assessment app: `npm run dev`
2. Create a simple HTML file with an iframe pointing to `http://localhost:3000`
3. Verify the app loads without "refused to connect" errors

### Production Testing
1. Deploy the app to Vercel
2. Test embedding from the ACABAI-PH website
3. Check browser console for CSP violations

### Browser Developer Tools
1. Open the embedding page (ACABAI-PH)
2. Check Console tab for CSP or frame-related errors
3. Check Network tab to see if iframe requests are blocked

## Troubleshooting

### Common Issues

**"Refused to connect" Error**
- Check if the parent domain is included in `frame-ancestors`
- Verify no conflicting `X-Frame-Options` header is set
- Ensure HTTPS is used for production domains

**CSP Violations**
- Check browser console for specific CSP violation messages
- Verify the parent domain matches the allowed patterns
- Test with a minimal iframe example

**Mixed Content Warnings**
- Ensure both parent and iframe use HTTPS in production
- Check that all resources (fonts, scripts) use HTTPS

### Adding New Domains

To allow embedding from a new domain:

1. Add the domain pattern to `frame-ancestors` in `middleware.ts`
2. Test the embedding thoroughly
3. Monitor for any security issues

Example:
```typescript
frame-ancestors 'self' https://*.vercel.app https://your-new-domain.com
```

## Security Monitoring

### What to Monitor
- CSP violation reports (if CSP reporting is enabled)
- Unusual traffic patterns to the iframe endpoint
- Failed iframe loading attempts

### Recommended Monitoring
1. Set up CSP violation reporting
2. Monitor server logs for unusual referrer patterns
3. Track iframe loading success rates

## Future Improvements

### Potential Enhancements
1. **Dynamic Domain Validation**: Check referrer header and allow/deny dynamically
2. **CSP Reporting**: Implement CSP violation reporting endpoint
3. **Domain Whitelist**: Maintain a configurable list of allowed parent domains
4. **Authentication**: Add optional authentication for iframe embedding

### Security Hardening
1. **Referrer Validation**: Validate the referrer header matches allowed domains
2. **Origin Checking**: Implement server-side origin validation
3. **Rate Limiting**: Apply stricter rate limiting for iframe requests
4. **Audit Logging**: Log all iframe embedding attempts

## References

- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [OWASP: Clickjacking Defense](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)