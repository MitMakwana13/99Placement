# TalentLab RMS - Deployment Guide

## Architecture
TalentLab is built on a modern, distributed serverless architecture:
- **Frontend**: Next.js 15 (React 19, Tailwind v4) deployed on Vercel.
- **Backend API**: Node.js/Express (Typescript) deployed on Railway.
- **Database**: PostgreSQL (Neon Serverless) managed by Prisma ORM.
- **Caching & Queues**: Upstash Redis (BullMQ for async tasks).
- **Storage**: Cloudflare R2 (S3-compatible) for resume/document uploads.
- **Email Delivery**: Resend SDK.
- **Observability**: Sentry for error tracking and APM profiling.

## Deployment Steps

### 1. Database Provisioning (Neon)
1. Create a new Postgres project on Neon.
2. Copy the connection string to `DATABASE_URL`.
3. Run `pnpm run db:push` from `@workspace/db-prisma` to push schema.

### 2. Backend Deployment (Railway)
1. Connect Railway to the GitHub repository.
2. Set root directory to `artifacts/api-server`.
3. Add the environment variables from `.env.production.example`.
4. Deploy the service. It automatically uses the `railway.toml` build configurations.

### 3. Frontend Deployment (Vercel)
1. Connect Vercel to the GitHub repository.
2. Set the root directory to `artifacts/talentlab-next`.
3. Select `Next.js` as the framework (Vercel auto-detects `vercel.json`).
4. Add the `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SENTRY_DSN` variables.
5. Deploy.

## Post-Deployment
- Navigate to the frontend URL.
- Log in with the root tenant admin credentials.
- Test candidate resume parsing via the `/dashboard/candidates` module to ensure the AI provider is configured correctly.
