# ===========================================
# TransRentals Production Dockerfile
# Multi-stage build with Prisma pre-generated
# ===========================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache libc6-compat python3 make g++ openssl

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Dummy DATABASE_URL for build-time prisma generate
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

# Install ALL dependencies (including dev for prisma CLI)
RUN npm ci --prefer-offline --no-audit --progress=false

# Explicitly generate Prisma client during build
RUN npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Accept build arguments for NEXT_PUBLIC_ vars
ARG NEXT_PUBLIC_APP_NAME=TransRentals
ARG NEXT_PUBLIC_APP_URL=https://transrentals.com
ARG NEXT_PUBLIC_APP_DESCRIPTION="Book cars, bikes, buses & more"
ARG NEXT_PUBLIC_CONTACT_EMAIL=info@transrentals.com
ARG NEXT_PUBLIC_CONTACT_PHONE=+91-XXXXXXXXXX
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
ARG NEXT_PUBLIC_ENABLE_BLOG=true
ARG NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP=true
ARG NEXT_PUBLIC_BLOG_DATA_SOURCE=prisma
ARG NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/transrentals
ARG NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/transrentals
ARG NEXT_PUBLIC_TWITTER_URL=https://twitter.com/transrentals
ARG NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/transrentals
ARG NEXT_PUBLIC_ENABLE_REVIEWS=true
ARG NEXT_PUBLIC_ENABLE_CHAT=false
ARG NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
ARG NEXT_PUBLIC_TWITTER_HANDLE=@transrentals
ARG NEXT_PUBLIC_DEFAULT_OG_IMAGE=/og-image.jpg
ARG NEXT_PUBLIC_CUSTOMER_APP_ANDROID=https://play.google.com/store
ARG NEXT_PUBLIC_VENDOR_APP_ANDROID=https://play.google.com/store

# Copy dependencies and Prisma files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV SKIP_DATABASE_CALLS=1
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-secret-will-be-replaced

# Set NEXT_PUBLIC_ variables
ENV NEXT_PUBLIC_APP_NAME=
ENV NEXT_PUBLIC_APP_URL=
ENV NEXT_PUBLIC_APP_DESCRIPTION=
ENV NEXT_PUBLIC_CONTACT_EMAIL=
ENV NEXT_PUBLIC_CONTACT_PHONE=
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=
ENV NEXT_PUBLIC_ENABLE_BLOG=
ENV NEXT_PUBLIC_ENABLE_VENDOR_SIGNUP=
ENV NEXT_PUBLIC_BLOG_DATA_SOURCE=
ENV NEXT_PUBLIC_FACEBOOK_URL=
ENV NEXT_PUBLIC_INSTAGRAM_URL=
ENV NEXT_PUBLIC_TWITTER_URL=
ENV NEXT_PUBLIC_LINKEDIN_URL=
ENV NEXT_PUBLIC_ENABLE_REVIEWS=
ENV NEXT_PUBLIC_ENABLE_CHAT=
ENV NEXT_PUBLIC_ENABLE_NOTIFICATIONS=
ENV NEXT_PUBLIC_TWITTER_HANDLE=
ENV NEXT_PUBLIC_DEFAULT_OG_IMAGE=
ENV NEXT_PUBLIC_CUSTOMER_APP_ANDROID=
ENV NEXT_PUBLIC_VENDOR_APP_ANDROID=

# Build the application
RUN npm run build && rm -rf .next/cache

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install only openssl for Prisma runtime
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs &&     adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma folder (schema + migrations) and pre-generated client (NO CLI needed at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Firebase service account for push notifications
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json

USER nextjs

EXPOSE 3000

# Start directly - Prisma client is pre-generated during build
CMD ["node", "server.js"]
