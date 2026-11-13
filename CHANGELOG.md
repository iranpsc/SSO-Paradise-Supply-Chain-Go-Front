# Changelog

Notable changes to this project are recorded here. Published release entries below match the repository's GitHub Releases. See [all published releases](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/releases).

The repository also has a `v1.1.1` Git tag, but no corresponding published GitHub Release was present when this changelog was added. A tag alone is not a published release.

## Unreleased

### Added

- Document the third-party OAuth authorization-code flow, PKCE, redirect URI validation, token exchange, and current compatibility limits.
- Show registered callback URIs and a redirect safety notice on the SSO consent screen.

## [1.1.1](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/compare/v1.1.0...v1.1.1) - 2026-11-06 (tagged; GitHub Release not published)

### Fixed

- Return an unauthenticated response when logout is requested without a valid session.

## [1.1.0](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/releases/tag/v1.1.0) - 2026-10-30

### Added

- Preserve and validate OAuth redirect state through the frontend login flow.

## [1.0.1](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/releases/tag/v1.0.1) - 2026-10-30

### Fixed

- Include the MIT license.

## [1.0.0](https://github.com/iranpsc/SSO-Paradise-Supply-Chain-Go-Front/releases/tag/v1.0.0) - 2026-10-30

### Added

- Initial release of the independent Next.js frontend, including Persian RTL account flows, OAuth consent, verification, and document uploads.
- Add semantic-release automation.

### Fixed

- Resume OAuth login requests across the separate frontend and backend origins.
- Configure independent frontend deployment and document build arguments.
