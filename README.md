# SSO Paradise Supply Chain — Frontend

The independent, Persian RTL **Next.js frontend** for [SSO Paradise Supply Chain (Go)](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go). It preserves the pages, visual assets and interaction patterns of the original `web` application while keeping the Go API in a separate repository.

> This repository contains the user interface, not the identity provider's authoritative credential, token, session or database logic. Run the sibling Go service for end-to-end development.

## Contents

- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Features and security boundaries](#features-and-security-boundaries)
- [Development and validation](#development-and-validation)
- [Docker and deployment](#docker-and-deployment)
- [Related backend documentation](#related-backend-documentation)
- [Contributing and security](#contributing-and-security)

## Architecture

```text
Browser (Persian / RTL)
    |
    v
Next.js frontend :3000
    | same-origin /api/*, /oauth/* and signed verification requests
    v
Go SSO API :8080
    |-- MySQL (authoritative credentials, sessions, expiry and revocation)
    |-- Redis (optional cache)
    |-- SMTP / development file mail (worker for asynchronous delivery)
    `-- OAuth, wallet and Laravel compatibility integrations
```

The frontend proxies requests to the Go service to preserve the browser-facing origin and cookies. It can be built independently, but functional login, registration and browser integration tests require the backend. Do not store authentication tokens in browser `localStorage`.

## Technology

| Component | Version / role |
| --- | --- |
| Next.js | 16.3.8 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.x |
| Tailwind CSS | 4.3.3 |
| WalletConnect Ethereum Provider | 2.23.10 |
| Playwright | Browser / end-to-end tests |
| Prettier | Formatting |

Refer to `package.json` and `package-lock.json` for the authoritative installed versions.

## Requirements

- Node.js **22.12+** and npm (use `npm ci` for reproducible installation).
- A running [Go backend](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go) for functional flows.
- For full backend/browser integration tests: the Go toolchain specified in the backend `go.mod`, MySQL **8.0.13+ or 9.x**, and a disposable test database. Redis is optional.

## Quick start

Clone both repositories as siblings:

```bash
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go.git
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front.git
```

### 1. Start the backend

Configure `SSO-Paradise-Supply-Chain-Go/.env` using its `.env.example`. Select a **separate Go database**; do not point migrations at a live Laravel database. Set `PUBLIC_URL=http://127.0.0.1:3000` to match the browser origin used below. From the backend directory:

```bash
go run ./cmd/migrate
go run ./cmd/api
```

Check `http://127.0.0.1:8080/healthz`. Development email defaults to local files under `var/mail`; for asynchronous SMTP delivery also run `go run ./cmd/worker`. Consult the backend README and production runbook before enabling staging or production.

### 2. Start the frontend

From the frontend directory:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

In PowerShell, replace the copy command with `Copy-Item .env.example .env.local`. Set the frontend `.env.local` `PUBLIC_URL=http://127.0.0.1:3000` and open **http://127.0.0.1:3000/login**. The frontend's `API_ORIGIN` defaults to `http://127.0.0.1:8080`. Keep the backend `PUBLIC_URL` consistent with the actual browser origin; `localhost` and `127.0.0.1` are not interchangeable for origin-sensitive flows.

## Configuration

Use `.env.example` as the canonical frontend template:

| Variable | Purpose |
| --- | --- |
| `API_ORIGIN` | Reachable Go API origin for server-side proxying; default `http://127.0.0.1:8080` |
| `PUBLIC_URL` | Exact browser-facing frontend origin; align with the backend's `PUBLIC_URL` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project identifier exposed to the client; use an authorized project ID |

Do not commit `.env.local`, passwords, private keys, production credentials, real user data or test-generated secrets. `NEXT_PUBLIC_*` values are public by design. Backend-only configuration (MySQL, Redis, mail, OAuth keys, Laravel import) belongs in the backend repository.

## Features and security boundaries

The frontend provides Persian RTL account flows for registration, email/username login, remember-me, password confirmation/reset/change, signed email verification, profile editing, avatar/private-document uploads, MetaMask/WalletConnect sign-in and wallet linking, and OAuth authorization/consent. The backend implements and enforces the corresponding identity and authorization rules.

- External/public OAuth clients initially require consent via `/authorize`. Like Laravel Passport, eligible confidential first-party clients and users with active access tokens for the same client covering the requested scopes skip this screen; `prompt=consent` forces confirmation. The OAuth password grant is disabled.
- Login preserves the backend's local OAuth `return_to` request in tab session storage, including across registration, wallet login and email verification. Only a same-origin `/oauth/authorize` path is accepted; the backend validates the client callback again before issuing a code. This supports separate API and frontend domains without sharing backend flash cookies.
- Signed verification links and session/cookie rules are validated by the backend. Do not bypass these flows in UI code.
- Verification email is manually requested, with a 60-second cooldown retained across reloads.
- Personal documents accept JPEG, PNG and WebP up to **2 MiB each**; avatars are limited to **1 MiB**. Client-side checks complement, never replace, server-side validation.
- Do not log access/refresh tokens, cookies, wallet signatures, nonces, credentials or private documents. Do not persist tokens in `localStorage`.
- Preserve same-origin proxy behavior and cookie handling when changing Next.js rewrites, headers or deployment topology.

## Development and validation

```bash
npm run dev        # local development
npm run typecheck  # TypeScript checks
npm run build      # production build
npm run start      # serve a production build
npm test           # Playwright browser tests
```

Browser tests start a separate Go checkout, use a disposable MySQL test database and synthetic mail/key files. By default, the backend is expected at `../SSO-Paradise-Supply-Chain-Go`; override with `SSO_BACKEND_DIR`. Use `PLAYWRIGHT_CHANNEL=chrome` to run against installed Chrome, or install Playwright Chromium. Do **not** point tests at production or a shared database.

For backend changes, also run from the sibling repository:

```bash
go test ./...
go vet ./...
go build ./cmd/api
```

The browser layout checks include widths of **390**, **768** and **1440** pixels. Verify RTL layout, keyboard access, loading/error states, form validation and responsive behavior for UI changes. Run `npx prettier --check .` where formatting checks are applicable; use `npx prettier --write <changed-files>` to format only files you changed.

## Docker and deployment

Build from this frontend repository root, providing `API_ORIGIN`, `PUBLIC_URL` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` as build arguments according to `Dockerfile` and your deployment environment. The app serves port **3000** and needs network access to the Go API. Next.js captures the proxy destination and HTTPS header policy **at build time**: rebuild the image when these values change. HTTPS `PUBLIC_URL` enables HSTS.

Use the provided `docker-compose.yml` as a starting point and consult the backend's `compose.yaml`, `compose.dokploy.yaml` and production runbook for full-stack deployment. Production uses HTTPS by default; the explicit HTTP-only option is described below. Keep stable securely provisioned keys, TLS SMTP and the backend worker where asynchronous mail is enabled. Never use development-generated keys or fixture accounts in production.

### HTTP-only production

For HTTP-only production, keep `NODE_ENV=production`, set `PUBLIC_URL=http://dev-accounts.irpsc.com` and `API_ORIGIN=http://apidev-accounts.irpsc.com`, and rebuild the frontend. The backend must keep `APP_ENV=production` and explicitly set `ALLOW_INSECURE_HTTP=true` with the same HTTP PUBLIC_URL. Disable HTTPS redirects and HSTS at the deployment proxy; browser HSTS already stored or inherited from a parent domain can still force HTTPS. HTTP does not encrypt passwords or session cookies. SMTP TLS and external-service HTTPS remain independently configured.

## Related backend documentation

- [Backend repository and setup](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go)
- [Backend documentation directory](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go/tree/main/docs) — migration/import, feature audit, schema dictionary, local/CI setup, production runbook and test data.
- [Backend environment template](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go/blob/main/.env.example)

Backend responsibilities include versioned migrations, Laravel-compatible import, OAuth client management, durable mail delivery, cleanup jobs and authoritative MySQL persistence. Read its migration guide before importing any Laravel data: imports require an empty target and must leave the source read-only.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md) before submitting changes. Report suspected vulnerabilities privately using GitHub's repository security-reporting mechanism if enabled, or contact the maintainers privately; do not publish exploit details in a public issue.

## License

Distributed under the [MIT License](LICENSE).
