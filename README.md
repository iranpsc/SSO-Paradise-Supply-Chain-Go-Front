# SSO Paradise Supply Chain Frontend

Independent Next.js / React / Tailwind frontend for the Go SSO API. Pages, styles, fonts and images are preserved from the original `web` application.

## Development

Requires Node.js 22.12+ and the running Go API.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000/login. Set `API_ORIGIN` to the Go server (default http://127.0.0.1:8080) and configure its `PUBLIC_URL` as http://localhost:3000. Requests to `/api/*`, `/oauth/*` and signed verification links are proxied to Go, preserving browser cookies and the public origin. Building and running the frontend requires no Go sources.

## Validation

```sh
npm run typecheck
npm run build
npm test
```

Browser tests start a separate Go checkout and create a disposable MySQL test database. Set `SSO_BACKEND_DIR` to its directory; the default is `../SSO-Paradise-Supply-Chain-Go`. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome, or install Playwright Chromium.

## Container

Build from this repository root, passing `API_ORIGIN` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` as build arguments. Next.js captures the proxy destination during build; rebuild when changing that destination. Run on port 3000 with network access to the Go API.
