# ===========================================
# TransRentals Production Dockerfile
# Multi-stage build for optimized image size
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Set DATABASE_URL before npm ci (needed for postinstall prisma generate)
ENV DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy

# Install dependencies with frozen lockfile
# This will run postinstall script which runs prisma generate
RUN npm ci --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_DESCRIPTION
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_CONTACT_PHONE
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_ENABLE_BLOG
ARG NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP
ARG NEXT_PUBLIC_BLOG_DATA_SOURCE
ARG NEXT_PUBLIC_FACEBOOK_URL
ARG NEXT_PUBLIC_INSTAGRAM_URL
ARG NEXT_PUBLIC_TWITTER_URL
ARG NEXT_PUBLIC_LINKEDIN_URL
ARG NEXT_PUBLIC_ENABLE_REVIEWS
ARG NEXT_PUBLIC_ENABLE_CHAT
ARG NEXT_PUBLIC_ENABLE_NOTIFICATIONS
ARG NEXT_PUBLIC_TWITTER_HANDLE
ARG NEXT_PUBLIC_DEFAULT_OG_IMAGE
ARG NEXT_PUBLIC_CUSTOMER_APP_ANDROID
ARG NEXT_PUBLIC_VENDOR_APP_ANDROID

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
# Dummy env vars for build (will be replaced at runtime)
ENV DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-secret-will-be-replaced-at-runtime

# Set NEXT_PUBLIC_ variables from build args
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_APP_DESCRIPTION=${NEXT_PUBLIC_APP_DESCRIPTION}
ENV NEXT_PUBLIC_CONTACT_EMAIL=${NEXT_PUBLIC_CONTACT_EMAIL}
ENV NEXT_PUBLIC_CONTACT_PHONE=${NEXT_PUBLIC_CONTACT_PHONE}
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=${NEXT_PUBLIC_WHATSAPP_NUMBER}
ENV NEXT_PUBLIC_ENABLE_BLOG=${NEXT_PUBLIC_ENABLE_BLOG}
ENV NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP=${NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP}
ENV NEXT_PUBLIC_BLOG_DATA_SOURCE=${NEXT_PUBLIC_BLOG_DATA_SOURCE}
ENV NEXT_PUBLIC_FACEBOOK_URL=${NEXT_PUBLIC_FACEBOOK_URL}
ENV NEXT_PUBLIC_INSTAGRAM_URL=${NEXT_PUBLIC_INSTAGRAM_URL}
ENV NEXT_PUBLIC_TWITTER_URL=${NEXT_PUBLIC_TWITTER_URL}
ENV NEXT_PUBLIC_LINKEDIN_URL=${NEXT_PUBLIC_LINKEDIN_URL}
ENV NEXT_PUBLIC_ENABLE_REVIEWS=${NEXT_PUBLIC_ENABLE_REVIEWS}
ENV NEXT_PUBLIC_ENABLE_CHAT=${NEXT_PUBLIC_ENABLE_CHAT}
ENV NEXT_PUBLIC_ENABLE_NOTIFICATIONS=${NEXT_PUBLIC_ENABLE_NOTIFICATIONS}
ENV NEXT_PUBLIC_TWITTER_HANDLE=${NEXT_PUBLIC_TWITTER_HANDLE}
ENV NEXT_PUBLIC_DEFAULT_OG_IMAGE=${NEXT_PUBLIC_DEFAULT_OG_IMAGE}
ENV NEXT_PUBLIC_CUSTOMER_APP_ANDROID=${NEXT_PUBLIC_CUSTOMER_APP_ANDROID}
ENV NEXT_PUBLIC_VENDOR_APP_ANDROID=${NEXT_PUBLIC_VENDOR_APP_ANDROID}

# Build the application with optimizations
RUN npm run build && \
    rm -rf .next/cache

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs &&     adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
