# syntax=docker/dockerfile:1.7

# Multi-stage build for Next.js 16 standalone output on Node.js 22 Alpine.
#
# Build from the repository root so Docker uses the pnpm workspace lockfile:
#   docker build -f apps/storefront/Dockerfile \
#     --build-arg SITE_URL=https://shop.cenwatch.com \
#     --build-arg SPREE_API_URL=https://api.example.com \
#     --build-arg SPREE_PUBLIC_URL=https://api.example.com \
#     --build-arg SPREE_PUBLISHABLE_KEY=your_spree_publishable_key \
#     --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key \
#     -t cenwatch-storefront .
#
# Run:
#   docker run -p 3001:3001 --env-file apps/storefront/.env.local cenwatch-storefront

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=11.1.1


# ---- deps: install production+dev dependencies for the build ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo

ARG PNPM_VERSION

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/admin-sdk/package.json ./packages/admin-sdk/package.json
COPY packages/sdk-core/package.json ./packages/sdk-core/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --filter @cenwatch/storefront... --frozen-lockfile


# ---- builder: compile the Next.js app ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /repo

ARG PNPM_VERSION

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# The build can fall back to CenWatch launch markets when the API is
# unavailable. Products, cart, account, and checkout still require a reachable
# Spree API at runtime.
ARG SITE_URL=https://shop.cenwatch.com
ARG NEXT_PUBLIC_SITE_URL=https://shop.cenwatch.com
ARG SPREE_API_URL
ARG SPREE_PUBLIC_URL
ARG SPREE_PUBLISHABLE_KEY
ARG SPREE_CHANNEL_CODE=shop
ARG SPREE_VALIDATE_MARKETS=false
ARG NEXT_PUBLIC_DEFAULT_COUNTRY=us
ARG NEXT_PUBLIC_DEFAULT_LOCALE=en
ARG NEXT_PUBLIC_STORE_NAME=CenWatch
ARG NEXT_PUBLIC_STORE_DESCRIPTION="The air touch watch for controlling screens, rooms, smart devices, and AR experiences."
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG CONTACT_TO_EMAIL=hello@cenwatch.com
ENV SITE_URL=$SITE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    SPREE_API_URL=$SPREE_API_URL \
    SPREE_PUBLIC_URL=$SPREE_PUBLIC_URL \
    SPREE_PUBLISHABLE_KEY=$SPREE_PUBLISHABLE_KEY \
    SPREE_CHANNEL_CODE=$SPREE_CHANNEL_CODE \
    SPREE_VALIDATE_MARKETS=$SPREE_VALIDATE_MARKETS \
    NEXT_PUBLIC_DEFAULT_COUNTRY=$NEXT_PUBLIC_DEFAULT_COUNTRY \
    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE \
    NEXT_PUBLIC_STORE_NAME=$NEXT_PUBLIC_STORE_NAME \
    NEXT_PUBLIC_STORE_DESCRIPTION=$NEXT_PUBLIC_STORE_DESCRIPTION \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    CONTACT_TO_EMAIL=$CONTACT_TO_EMAIL

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/storefront/node_modules ./apps/storefront/node_modules
COPY --from=deps /repo/packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/storefront ./apps/storefront

RUN pnpm --filter @cenwatch/storefront build


# ---- runner: minimal runtime image ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV SITE_URL=https://shop.cenwatch.com
ENV NEXT_PUBLIC_SITE_URL=https://shop.cenwatch.com
ENV NEXT_PUBLIC_STORE_NAME=CenWatch
ENV NEXT_PUBLIC_STORE_DESCRIPTION="The air touch watch for controlling screens, rooms, smart devices, and AR experiences."
ENV NEXT_PUBLIC_DEFAULT_COUNTRY=us
ENV NEXT_PUBLIC_DEFAULT_LOCALE=en
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
ENV SPREE_CHANNEL_CODE=shop
ENV SPREE_VALIDATE_MARKETS=false
ENV CONTACT_TO_EMAIL=hello@cenwatch.com

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/public ./apps/storefront/public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/static ./apps/storefront/.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "apps/storefront/server.js"]
