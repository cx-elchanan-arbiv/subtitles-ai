# Security Policy

## Reporting a Vulnerability

**We take security seriously.** If you discover a security vulnerability in SubsTranslator, please help us protect our users by reporting it responsibly.

### 🔒 How to Report

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues privately:

1. **Via GitHub Security Advisories** (Preferred):
   - Go to the [Security tab](https://github.com/cx-elchanan-arbiv/subtitles-ai/security/advisories)
   - Click "Report a vulnerability"
   - Fill in the details

2. **Via Email**:
   - Send an email to: **security@subtitles-ai.io**
   - Include detailed information about the vulnerability
   - Include steps to reproduce if possible

### What to Include

When reporting a security issue, please include:

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Affected versions** (if known)
- **Suggested fix** (if you have one)
- Your **contact information** for follow-up

### What to Expect

- **Acknowledgment**: We'll acknowledge your report within 48 hours
- **Updates**: We'll keep you informed of our progress
- **Timeline**: We aim to release a fix within 30 days for critical issues
- **Credit**: We'll credit you in the security advisory (if you wish)

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Yes             |
| < 1.0   | ❌ No (development) |

## Security Best Practices

### For Users

When deploying SubsTranslator:

1. **Keep API keys secret**:
   - Never commit `.env` files with real keys
   - Use environment variables in production
   - Rotate keys regularly

2. **Use secure connections**:
   - Always use HTTPS in production
   - Configure proper CORS settings
   - Use secure WebSocket connections (WSS)

3. **Keep dependencies updated**:
   - Regularly run `npm audit` and `pip-audit`
   - Update Docker images regularly
   - Monitor security advisories

4. **Limit access**:
   - Use Firebase authentication
   - Implement rate limiting (included via Redis)
   - Monitor API usage

### For Developers

When contributing:

1. **Never commit secrets**:
   - Check files before committing
   - Use `.env.example` for templates
   - Review git history before pushing

2. **Validate inputs**:
   - Always validate user inputs
   - Sanitize file paths
   - Check file types and sizes

3. **Use security tools**:
   - Run `bandit` for Python security checks
   - Use `npm audit` for Node.js
   - Enable Dependabot alerts

4. **Follow secure coding practices**:
   - Avoid SQL injection (we use ORM)
   - Prevent XSS attacks
   - Implement CSRF protection

## Known Security Considerations

### API Keys

SubsTranslator requires several API keys:
- **OpenAI API Key**: Keep this secure; it costs money if leaked
- **Firebase Keys**: Client-side keys are public but restricted by Firebase rules
- **Redis Password**: Required for production deployments

### File Upload

- Maximum file size: 500MB (configurable)
- Allowed formats: video files only (validated)
- Files are automatically cleaned up after processing
- Path traversal protection is implemented

### Dependencies

We regularly monitor and update our dependencies for security vulnerabilities. Key dependencies include:

- **Backend**: Flask, Celery, OpenAI SDK, Google AI SDK
- **Frontend**: React, Firebase SDK
- **Infrastructure**: Docker, Nginx, Redis

## Security Updates

Security updates will be:
- Released as soon as possible
- Announced in GitHub Security Advisories
- Tagged with version numbers
- Documented in CHANGELOG

## Acknowledgments

We thank the following security researchers for responsibly disclosing vulnerabilities:

_(None yet - be the first!)_

---

**Thank you for helping keep SubsTranslator and its users safe! 🔒**
