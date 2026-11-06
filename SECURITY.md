# Security Policy

Security is critical to **SSO Paradise Supply Chain**. This repository contains the Next.js frontend for the separate [Go identity and API service](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go). A vulnerability in either repository may affect the complete authentication flow.

## Supported versions

This project currently develops on `main` and does not publish a documented versioned security-support schedule. Security fixes are targeted at the latest maintained code on `main`. Older commits, forks, unpublished deployments, and third-party modifications are not guaranteed to receive backports. This statement is not a guarantee of a response or remediation deadline.

## Reporting a vulnerability

**Do not disclose suspected vulnerabilities in public GitHub Issues, Discussions, pull requests, or comments.**

Use GitHub's private vulnerability reporting feature for this frontend, if enabled:

- [Frontend security advisories](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/security/advisories)

For an issue in the Go service, use its [security advisories page](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go/security/advisories), if private reporting is enabled. For a cross-repository issue, explain that both maintainers/repositories need coordinated remediation in your private report. If private reporting is unavailable, contact the repository maintainers through an established **private** organizational channel; do not open a public issue to request a contact address while including exploit details. No public security email address or fixed SLA is asserted here.

Please include, where possible:

- A concise description and potential impact, including affected frontend/backend flows.
- The affected commit, deployment environment, routes, and relevant configuration (redacted).
- Reproduction steps and a minimal proof of concept using synthetic accounts and data.
- Whether authentication, authorization, OAuth2/PKCE, session handling, signed links, wallets, uploads, or proxy behavior is involved.
- Suggested mitigation, if known, and a safe way to contact you privately.

Never include passwords, private keys, access/refresh tokens, session cookies, recovery codes, production database dumps, real identity documents, or personal data in a report. Redact logs and screenshots.

## Disclosure and response

Maintainers should privately acknowledge and triage reports as capacity permits, request clarification when necessary, assess impact across both repositories, and coordinate a fix, verification, release, and disclosure. No specific acknowledgement or fix time is promised. Please allow maintainers a reasonable opportunity to investigate before public disclosure. If you believe users face imminent harm, state that clearly in the private report.

## Security expectations for contributors

- Keep credentials, signing keys, wallet secrets, and server-only configuration out of Git, client bundles, screenshots, and CI logs. `NEXT_PUBLIC_*` values are public by design; never place secrets there.
- Preserve same-origin proxy and cookie behavior; review changes to `/api/*`, `/oauth/*`, authorization redirects, `PUBLIC_URL`, `API_ORIGIN`, and forwarded headers with the Go service.
- Do not store access or refresh tokens in `localStorage` or expose them in URLs, telemetry, or logs.
- Preserve CSRF/origin checks, secure cookie attributes, consent decisions, PKCE/state validation, session expiry, revocation, and refresh-token rotation; the Go service remains authoritative for these controls.
- Validate and constrain redirect destinations and untrusted input. Never render untrusted HTML without an explicit security review.
- Preserve upload restrictions and avoid logging personal documents or account-recovery material.
- Use HTTPS in deployed environments; review CSP, HSTS, caching, and security-header changes against actual deployment topology.
- Keep dependencies maintained and review lockfile changes. Do not suppress audit findings without documented justification.
- Run `npm run typecheck`, `npm run build`, and relevant tests before merging security-sensitive changes. Coordinate end-to-end tests with the sibling Go repository.
- Use synthetic test accounts and disposable databases. Never test against production accounts, wallets, or data without explicit authorization.

## Scope and safe testing

Only test systems and accounts you own or are explicitly authorized to assess. Avoid denial-of-service tests, destructive operations, social engineering, privacy intrusion, persistence, and access to other users' data. Stop and report privately if you encounter sensitive information. This policy does not grant permission to test any public deployment.

## Related documentation

- [README](README.md)
- [Contributing guidelines](CONTRIBUTING.md)
- [Go backend](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go)
