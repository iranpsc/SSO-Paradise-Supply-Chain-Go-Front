FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
ARG NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --registry="$NPM_CONFIG_REGISTRY" --fetch-retries=5 --no-audit --no-fund
COPY . ./
ARG API_ORIGIN=http://api:8080
ARG PUBLIC_URL
ENV PUBLIC_URL=$PUBLIC_URL
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV API_ORIGIN=$API_ORIGIN
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ARG API_ORIGIN=http://api:8080
ENV API_ORIGIN=$API_ORIGIN
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
