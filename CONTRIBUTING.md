# Contributing to SSO Paradise Supply Chain Frontend

Thank you for helping improve the Persian RTL frontend. This project is security-sensitive: prioritize correctness, privacy, compatibility with the sibling Go API, accessibility and maintainable changes over broad rewrites.

## Before you begin

Read [README.md](README.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md) and the [Go backend README](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go). Search existing issues and pull requests before opening a duplicate. Discuss breaking API, authentication or architectural changes with maintainers before implementation.

## Local setup

Use Node.js 22.12+ and install the locked dependencies:

```bash
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go.git
git clone https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front.git
cd SSO-Paradise-Supply-Chain-Go-Front
npm ci
cp .env.example .env.local
npm run dev
```

For PowerShell use `Copy-Item .env.example .env.local`. Start the Go API as described in the README, and align the browser-facing `PUBLIC_URL` in both repositories (for example `http://127.0.0.1:3000`). The API normally listens at `http://127.0.0.1:8080`. Never run integration tests against live accounts or production databases.

## Branching and commits

Branch from an up-to-date `main`. Use one focused branch per independently reviewable change. Branch names are **flat Git references**; slashes express readable grouping, not parent-child branches:

| Kind | Example |
| --- | --- |
| Feature | `feature/auth/verification` |
| Bug fix | `fix/wallet/connect-state` |
| Refactor | `refactor/profile/form-state` |
| Documentation | `docs/setup-guide` |
| Tests | `test/auth/consent-flow` |
| Maintenance | `chore/dependencies` |
| Security | `security/session-cookie-handling` (coordinate privately first) |

Avoid unrelated changes in the same branch. Do not force-push shared branches or push directly to `main`. Prefer Conventional Commits such as `feat(auth): improve verification feedback`, `fix(wallet): handle rejected signature` or `docs: expand local setup`. Keep commit messages meaningful and free of sensitive data.

## Implementation standards

- Use TypeScript and the existing Next.js App Router/component conventions. Prefer small, typed, focused changes; avoid `any` without a clear reason.
- Preserve Persian RTL presentation, existing pages, assets, typography and responsive design unless the change explicitly requires otherwise.
- Check keyboard interaction, labels, focus states, error messages, loading/disabled states and narrow-screen layouts.
- Keep authentication decisions, credential verification, OAuth policy and session revocation on the Go backend. UI checks are not authorization controls.
- Preserve same-origin `/api/*`, `/oauth/*` and signed-verification proxy behavior, cookies and origin assumptions.
- Never persist tokens in browser `localStorage`; never print tokens, cookies, nonces, wallet signatures, credentials, private keys or document contents to logs.
- Treat `NEXT_PUBLIC_*` values as publicly visible. Do not commit `.env.local`, real personal information, secrets or generated test credentials.
- Coordinate cross-repository API contract changes. If an API shape changes, update the frontend, backend tests and both repositories' documentation together; link the related pull requests.
- Add or update automated tests for behavior changes, particularly login, verification, OAuth consent, wallet linking and error handling. Avoid unnecessary dependency additions.

## Verification before a pull request

Run from the frontend root:

```bash
npm ci
npm run typecheck
npm run build
npm test
```

Playwright needs the sibling Go checkout (`SSO_BACKEND_DIR` defaults to `../SSO-Paradise-Supply-Chain-Go`) and a disposable MySQL test database. Use `PLAYWRIGHT_CHANNEL=chrome` for installed Chrome, or install Playwright Chromium. When applicable, check formatting with `npx prettier --check .` and format only your changed files. Test responsive widths 390, 768 and 1440 pixels and inspect Persian RTL flows manually. If any check cannot run, state why and what was verified instead.

For changes touching the backend, run its checks as well:

```bash
go test ./...
go vet ./...
go build ./cmd/api
```

Never use real Laravel data or a shared/production database for test runs. A successful frontend build alone does not establish SSO compatibility.

## Pull request workflow

1. Open a focused PR targeting `main` and link the relevant issue and any companion backend PR.
2. Describe the problem, approach, affected routes/flows, compatibility implications, and any environment or migration changes.
3. Provide screenshots or short recordings for UI changes (including RTL and mobile), and record exact verification commands/results.
4. Request maintainer review; address feedback without silently changing the scope. Resolve discussions and keep the branch current.
5. Merge only after required checks and approvals pass under the repository's configured branch-protection rules. Do not bypass protections or merge with unresolved security concerns.

Suggested PR description:

```markdown
## Summary
## Related issue / backend PR
## Changes and compatibility impact
## Security / privacy considerations
## Verification (commands and results)
## UI evidence (desktop / mobile / RTL, if applicable)
## Deployment or environment changes
## Checklist
- [ ] Scope is focused and documentation is updated
- [ ] No secrets, personal data or debug logging committed
- [ ] Typecheck and production build pass
- [ ] Relevant Playwright tests pass (or limitation explained)
- [ ] Backend contract and cross-repository changes coordinated
- [ ] Accessibility and RTL/responsive behavior reviewed
```

## Reporting bugs and vulnerabilities

For ordinary bugs, provide reproduction steps, expected/actual behavior, environment, relevant sanitized logs and screenshots. Remove cookies, tokens, credentials, wallet signatures and personal information. For suspected security vulnerabilities, **do not open a public issue or PR with exploit details**: follow [SECURITY.md](SECURITY.md) and contact maintainers privately. Wait for coordinated disclosure before publishing details.

## Documentation changes

Keep instructions consistent with the actual scripts, `.env.example`, Next.js rewrites and backend contracts. Avoid invented commands, endpoints or guarantees. Update README/CONTRIBUTING and the sibling backend docs whenever a change affects setup, security, testing or deployment.
