# Docker builds

Next compiles API rewrites and public client configuration at build time. Set Docker **build arguments** in Dokploy, rather than only runtime environment variables:

```sh
docker build \
  --build-arg API_ORIGIN=https://apidev-accounts.irpsc.com \
  --build-arg PUBLIC_URL=https://dev-accounts.irpsc.com \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PUBLIC_PROJECT_ID \
  -t paradise-sso-web .
```

PUBLIC_URL is the frontend HTTPS origin and enables its HSTS header. `.env` files are intentionally excluded from the image build; secrets must remain outside the image. Changing API_ORIGIN or the WalletConnect project ID requires rebuilding the image. The runtime server listens on `0.0.0.0:3000`.

Dependency installation uses the lockfile and five network retries. For a registry blocked on the deployment host, set the optional `NPM_CONFIG_REGISTRY` build argument to an approved reachable registry; its default is `https://registry.npmjs.org/`. Package integrity checks remain enabled. A dependency deprecation warning alone does not fail the build.

When using the backend repository's Compose file, it forwards frontend build arguments automatically; supply the public origin/project ID through its `--env-file`. Optional NPM_CONFIG_REGISTRY is forwarded too.
