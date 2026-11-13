# Third-Party OAuth Integration

This guide describes the browser-based OAuth authorization-code flow provided by the Go identity service and its Next.js SSO interface.

## Protocol and security profile

For new integrations, follow the OAuth 2.1 authorization-code profile: use PKCE with `S256` for every client, including confidential web applications. Generate and retain a verifier per authorization attempt, validate `state` on the callback, and exchange the code only from a trusted backend when the client has one.

The current service preserves compatibility behavior: it accepts the legacy PKCE `plain` method and permits a registered confidential client to omit PKCE. These are compatibility allowances, not recommendations or a claim of strict OAuth 2.1 conformance. Do not use either allowance for new integrations. Public clients must use PKCE.

The service is an OAuth authorization server, not an OpenID Connect provider. It does not issue an ID token or expose an OIDC discovery document. Access tokens can be used with the supported account endpoints described below.

## Register a client

Run client management from the Go backend repository against the intended environment and database:

```powershell
go run ./cmd/manage client:create --name "Example application" --redirect-uri "https://app.example.com/oauth/callback" --public
```

Use `--public` for browser-only and native applications. The command returns a numeric `client_id` and the registered redirect URI; a public client has no secret. For a server-side confidential client, omit `--public`. Its generated `client_secret` is printed once, so capture it in a server-side secret manager and never expose it in browser code, source control, URLs, logs, or a mobile binary.

Multiple callback URIs can be registered as a comma-separated `--redirect-uri` value. Register each complete URI, including its path and any fixed query string. Production callbacks must use HTTPS. Use loopback HTTP only for local development.

## Authorization request

Open the backend authorization endpoint in the user's browser:

```text
https://sso.example.com/oauth/authorize?client_id=123&redirect_uri=https%3A%2F%2Fapp.example.com%2Foauth%2Fcallback&response_type=code&state=RANDOM_STATE&code_challenge=BASE64URL_SHA256&code_challenge_method=S256
```

Replace the example values and URL-encode each parameter. The `sso.example.com` origin must be the API origin. The backend sends users who need to sign in to the frontend configured by backend `PUBLIC_URL`; the frontend preserves the pending authorization request and resumes it through its same-origin `/oauth/*` proxy. Configure frontend `API_ORIGIN` to reach that backend and keep backend `PUBLIC_URL` equal to the browser-visible frontend origin.

Always send `redirect_uri` in new integrations. For legacy compatibility only, the backend infers it when the client has exactly one registered callback; do not rely on that fallback.

| Parameter               | Requirement and behavior                                                                                                                                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client_id`             | Required numeric ID returned during client registration.                                                                                                                                                                                                                                        |
| `redirect_uri`          | Required complete URI registered for this client. Matching is exact, including scheme, host, port, path, trailing slash, and query string. Do not use wildcard or prefix matching. The value is limited to 2,048 characters.                                                                    |
| `response_type`         | Required; must be `code`.                                                                                                                                                                                                                                                                       |
| `state`                 | Strongly recommended and required by this integration profile. Send a unique, unpredictable value for each attempt, bind it to the browser session, and compare it exactly on callback. The service accepts up to 1,024 characters but does not require the parameter for legacy compatibility. |
| `code_challenge`        | Required for public clients and all clients following this guide. It is the unpadded base64url encoding of SHA-256 over the verifier.                                                                                                                                                           |
| `code_challenge_method` | Send `S256`. `plain` is accepted only for legacy compatibility and must not be used by new clients.                                                                                                                                                                                             |
| `scope`                 | Omit this parameter. The current browser authorization route grants no named scopes when omitted and rejects non-empty scope values.                                                                                                                                                            |

Generate a cryptographically random verifier with 32 random bytes, base64url-encoded without padding. This produces a 43-character verifier. The service accepts verifier strings 43-128 characters long from `[A-Za-z0-9._~-]`; generate at least 32 bytes of entropy. Compute the challenge as:

```text
code_challenge = BASE64URL_NOPADDING(SHA256(ASCII(code_verifier)))
```

Do not place the verifier, access token, or refresh token in an authorization URL. Keep the verifier in the client session until the code exchange completes.

## Sign-in, consent, and callback

1. The backend validates the client, exact callback, response type, and PKCE values before redirecting the browser to the SSO login flow.
2. The user signs in to the central SSO interface. Public clients require consent. Eligible confidential first-party clients can follow the backend's consent policy; `prompt=consent` forces the consent screen.
3. Before approval, the SSO screen shows the client name, requested access (when present), and the callback URIs registered for that client. The screen lists the client's registered callback allowlist; the backend independently validates the exact callback from the authorization request.
4. On approval, the browser returns to the registered callback with a short-lived, single-use authorization `code` and the original `state`. The code expires after five minutes. On denial, the callback receives `error=access_denied` and the original `state` when supplied.
5. The client must reject the response if `state` is absent, does not match the outstanding attempt, or the callback contains an OAuth error. Do not treat a successful SSO login as a local session in the client application.

The authorization code is a temporary credential. Do not log it or forward it to third-party services. The authorization endpoint only issues the code to a callback registered for the client.

## Exchange the code

Make a server-to-server `POST` to `https://sso.example.com/oauth/token` using `application/x-www-form-urlencoded`:

```text
grant_type=authorization_code
client_id=123
code=AUTHORIZATION_CODE
redirect_uri=https://app.example.com/oauth/callback
code_verifier=THE_ORIGINAL_VERIFIER
```

For a confidential client, authenticate with its secret using HTTP Basic authentication or the form field `client_secret`. Never send a secret from a public client. The `redirect_uri` must exactly match the value used in the authorization request. For public clients, the `code_verifier` is mandatory to redeem the PKCE-bound code.

Example response (the configured token lifetime can vary by deployment):

```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "...",
  "refresh_token": "..."
}
```

Keep access and refresh tokens server-side where possible. Browser applications should use a backend-for-frontend session with secure, HttpOnly cookies; do not store tokens in `localStorage`, put them in URLs, or expose them to analytics and logging.

## Use and refresh tokens

Send the access token as a bearer token to a supported backend resource, for example:

```http
GET /api/user HTTP/1.1
Host: sso.example.com
Authorization: Bearer ACCESS_TOKEN
```

The service currently exposes its account API contract rather than a standardized OIDC `/userinfo` endpoint. Request only the account data your integration needs and do not assume that the OAuth `profile` scope maps to OIDC claims.

Refresh tokens are rotated. Exchange a refresh token at `POST /oauth/token` with `grant_type=refresh_token`, `client_id`, and `refresh_token`, authenticating a confidential client as above. Persist only the latest returned refresh token; the previous token is no longer valid after rotation. Follow the backend's operational documentation for revocation and key management.

## Client checklist

- Use a unique unpredictable `state` per attempt and validate it before processing the callback.
- Use PKCE `S256` for public and confidential clients. Never choose `plain`.
- Register exact HTTPS callback URIs; reject any callback that differs from the request you initiated.
- Exchange authorization codes only once and within five minutes.
- Keep confidential secrets and tokens out of browser/native clients, URLs, logs, and analytics.
- Use the SSO consent screen's displayed client name and registered callback URIs as a user-facing trust signal; never claim that this replaces server-side redirect validation.
- Use an established OAuth client library where possible and test state mismatch, callback mismatch, code replay, and PKCE verifier mismatch.

## Related references

- [Go backend OAuth implementation](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go)
- [Backend API reference](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go/tree/main/docs)
- [Frontend configuration and security boundaries](../README.md)
