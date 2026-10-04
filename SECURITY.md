# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Interview AI, please send an e-mail to security@interviewai.io or report via private security advisories. All security vulnerabilities will be promptly addressed.

### Security Best Practices
- Treat all candidate uploads (PDF, DOCX) as untrusted input. Validate signatures and sanitize XML/HTML.
- External URLs must be validated with SSRF protection.
- Authenticate all protected endpoints with JWT bearer verification.
- Prevent IDOR by always validating session and resource ownership against `req.user.id`.
