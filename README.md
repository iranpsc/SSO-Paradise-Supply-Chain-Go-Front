# Paradise Supply Chain SSO — Web Frontend

This repository contains the independent browser application for the Paradise Supply Chain single sign-on (SSO) service. It provides the Persian, right-to-left user experience for the Go identity API: sign-in, registration, account management, wallet authentication, email verification, and OAuth consent.

The frontend is a separate service from the API. It does not own user credentials, issue OAuth tokens, or connect directly to MySQL. It obtains the current account and performs authentication actions through the Go backend. The backend repository is [SSO-Paradise-Supply-Chain-Go](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go).

## Contents

- [What the application does](#what-the-application-does)
- [How SSO works](#how-sso-works)
- [Technology stack](#technology-stack)
- [Repositories and prerequisites](#repositories-and-prerequisites)
- [Local development](#local-development)
- [Configuration reference](#configuration-reference)
- [Tests and quality checks](#tests-and-quality-checks)
- [Production build and deployment](#production-build-and-deployment)
- [Security and compatibility notes](#security-and-compatibility-notes)
- [Related repositories](#related-repositories)

## What the application does

- Provides Persian RTL login and registration pages, password recovery, verification, and account screens.
- Offers account and personal-information management, wallet linking, and session controls.
- Supports MetaMask and WalletConnect entry points using server-issued wallet challenges; the API verifies signatures and consumes nonces.
- Presents OAuth consent when the backend requires it and resumes an authorization request after the user signs in.
- Preserves browser-facing routes used by the earlier Laravel application where the Go backend implements the corresponding compatibility contract.
- Redirects an authenticated visitor from the root page to the account dashboard and an unauthenticated visitor to the sign-in page, after checking the API session.

The frontend is a presentation and browser-integration layer. Authentication decisions, password verification, authorization-code creation, token validation, consent policy, persistence, and revocation remain responsibilities of the Go API.

## How SSO works

1. A user opens a client application and chooses its SSO sign-in option. The client redirects the browser to the Go API's OAuth authorization endpoint with a registered callback, `state`, scopes, and PKCE parameters when required.
2. The API sends an unauthenticated visitor to this frontend while preserving the pending authorization request. The frontend calls the API through its same-origin proxy, so the browser does not need to call a cross-origin API directly for ordinary account actions.
3. After the user signs in, this application checks the account state and resumes the validated authorization request. If the API requires consent, the frontend displays the decision screen.
4. The API redirects the browser to the exact registered callback with a one-time authorization code. The client validates `state`, exchanges the code (and PKCE verifier, where applicable), and creates its own local session.

Signing in to the central SSO establishes a session with the identity service. It does not automatically sign the user into every client application; each client must complete and validate its own OAuth callback.

## Technology stack

| Area | Technology |
| --- | --- |
| Web framework | Next.js 16 App Router |
| UI runtime | React 19 and TypeScript |
| Styling | Tailwind CSS 4 plus the project's legacy-compatible styles |
| Authentication API | Go SSO HTTP API, accessed through Next.js rewrites and same-origin requests |
| Wallet integration | MetaMask's browser provider and WalletConnect Ethereum provider |
| Browser testing | Playwright with Chromium |
| Production packaging | Next.js standalone output in a Node.js 22 container |

The user interface is Persian-first and uses RTL page layout. TypeScript types, route components, API wrappers, session state, and feature screens are under `src/`. Static fonts, images, and wallet logos are under `public/`.

## Repositories and prerequisites

Clone the backend and frontend as sibling directories when you want the complete local SSO experience or need to run the browser integration tests:

```bash
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go.git
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front.git
```

The frontend alone requires:

- Node.js 22.12 or newer and npm.
- A reachable Go SSO API for interactive local use.
- A WalletConnect project ID if you want to exercise WalletConnect; MetaMask sign-in requires its browser extension.

Running the Playwright integration suite additionally requires Go, a disposable MySQL instance, and the sibling Go backend checkout. Its database account must be allowed to create and drop test databases. Never point the browser suite at production or a shared user database.

## Local development

### 1. Start the Go backend

Follow the backend [README](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go#local-setup). Configure a dedicated local MySQL database and set the backend's `PUBLIC_URL` to the exact frontend origin used by the browser. For the commands below that origin is `http://localhost:3000`.

From the backend directory, after preparing `.env` and the local database:

```bash
go run ./cmd/migrate
go run ./cmd/api
```

If SMTP delivery is configured as an asynchronous queue, start the worker in another terminal:

```bash
go run ./cmd/worker
```

The API's health endpoint should respond at `http://127.0.0.1:8080/healthz`. Opening the backend root displays its embedded Swagger UI.

### 2. Configure and start the frontend

From this repository's root:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and set the values for your environment:

```dotenv
API_ORIGIN=http://127.0.0.1:8080
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

`API_ORIGIN` is the Go API address reachable by the Next.js server. `PUBLIC_URL` in the backend must match the browser-visible frontend origin exactly (`http://localhost:3000` here). Do not substitute `127.0.0.1` for `localhost` in only one of these browser-facing settings; cookies and OAuth redirects depend on consistent origins. The WalletConnect project ID is a public identifier, not a secret; use your own project configuration where required.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route checks the current API session and takes the visitor to the dashboard or sign-in page. The backend API should remain running in a separate terminal.

PowerShell equivalents for copying the environment sample and setting the API origin are:

```powershell
Copy-Item .env.example .env.local
$env:API_ORIGIN = 'http://127.0.0.1:8080'
npm run dev
```

For persistent local settings, edit `.env.local` rather than relying on a temporary terminal variable.

## Configuration reference

| Variable | Purpose |
| --- | --- |
| `API_ORIGIN` | Go API origin used by the Next.js proxy for `/api/*`, OAuth, wallet, storage, and Laravel-compatible routes. It must be reachable from the Next.js process or container. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Public WalletConnect project identifier used by the browser integration. |
| `PUBLIC_URL` | Build-time frontend public origin used by the production security-header policy. An HTTPS value enables HSTS. |
| `NEXT_DIST_DIR` | Optional Next.js output directory override, primarily used to isolate browser-test output. |

Next.js supplies `NODE_ENV` for development and production commands; it normally should not be set manually for local development. The full backend configuration—including MySQL, Redis, cookies, signing keys, mail, and API public URL—is documented in the backend's `.env.example` and README.

## Tests and quality checks

Available frontend commands are:

```bash
npm ci
npm run build
npm run typecheck
npm test
```

The Playwright configuration starts an isolated Go API on port `8180` and a separate Next.js test server on port `3100`. It creates a uniquely named `paradise_e2e_*` MySQL database, uses synthetic accounts and local test mail, then removes the test database during teardown. Set `SSO_BACKEND_DIR` if the backend checkout is not at `../SSO-Paradise-Supply-Chain-Go`.

Example for a local disposable MySQL server (adapt credentials to your test instance):

```bash
MYSQL_HOST=127.0.0.1 MYSQL_USER=root MYSQL_PASSWORD=your_local_test_password npm test
```

In PowerShell:

```powershell
$env:MYSQL_HOST = '127.0.0.1'
$env:MYSQL_USER = 'root'
$env:MYSQL_PASSWORD = 'your_local_test_password'
npm test
```

The test account needs permission to create and drop databases because the backend's test helper creates an isolated schema per run. Use only disposable local or CI infrastructure. If a run is forcibly terminated before cleanup, inspect and remove only the test database with the matching `paradise_e2e_*` name on that test instance.

GitHub Actions runs the type check, Playwright browser suite, and production build for pushes and pull requests targeting `develop` or `main`. The browser workflow checks out the backend's `develop` branch because that branch contains the isolated E2E database helper. GitHub reports the result as `Frontend checks / tests`; repository branch rules must require that check if it should block merging.

## Production build and deployment

The Dockerfile builds a standalone Next.js server and runs it on port `3000`. Build-time values matter: Next.js captures the API proxy destination and public-origin security-header policy when the image is built. Rebuild the image whenever those values change.

Example using placeholder origins (replace them with the addresses reachable in your deployment network):

```bash
docker build \
  --build-arg API_ORIGIN=https://api.example.com \
  --build-arg PUBLIC_URL=https://accounts.example.com \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID \
  -t paradise-sso-frontend:local .

docker run --rm -p 3000:3000 paradise-sso-frontend:local
```

In a container network, `API_ORIGIN` must use a hostname and port reachable from the frontend container; `localhost` inside that container refers to the container itself. Configure the reverse proxy and API with the same intended public origins, HTTPS behavior, cookie policy, and allowed browser origin. The frontend does not include MySQL or Redis; deploy and operate those with the backend stack. Do not put backend secrets or signing keys in frontend build arguments or `NEXT_PUBLIC_*` variables.

## Security and compatibility notes

- Keep passwords, API secrets, signing keys, and database credentials on the backend. Never add bearer tokens or session credentials to browser `localStorage`.
- Preserve same-origin proxy behavior for browser requests and the backend's cookie, origin, CSRF, OAuth state, callback-validation, and PKCE rules.
- Use HTTPS in production and rebuild when the public origin or API origin changes.
- Treat callback URLs as untrusted input; the API validates clients and exact registered redirect URIs.
- Use synthetic records in local and CI tests. Do not commit production screenshots, browser traces, database exports, `.env.local`, or user documents.

## Related repositories

- [Go SSO backend](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go)
- [Original Laravel SSO](https://github.com/iranpsc/SSO-Paradise-Supply-Chain)
