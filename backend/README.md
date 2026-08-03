# Growth Cloud Backend

Separate backend service for the Growth Cloud frontend.

## Why this folder exists
This backend is intentionally separate from the Next.js frontend so deployment is simpler and the platform architecture is easier to understand and grow feature-by-feature.

## Included now
- Express + TypeScript backend scaffold
- Environment-based config with [`PORT`](backend/.env.example), [`CORS_ORIGIN`](backend/.env.example), and [`DATABASE_URL`](backend/.env.example)
- Prisma ORM setup with PostgreSQL for production and SQLite-compatible local development workflows
- Health route at `/health`
- API overview route at `/api/v1`
- Auth signup foundation at `/api/v1/auth/signup`
- Workspaces backed by Prisma at `/api/v1/workspaces`
- API keys foundation at `/api/v1/api-keys`
- Leads list/create backed by Prisma at `/api/v1/leads`
- Segments foundation at `/api/v1/segments`
- Workflows foundation at `/api/v1/workflows`
- Analytics overview at `/api/v1/analytics/overview`
- Node test coverage for the current API shape

## Run locally

```bash
npm install
npm run db:push
npm test
npm run build
npm run dev
```

Default port: `4000`

## Deploy separately
The backend can be deployed independently from the frontend because it has its own:
- [`backend/package.json`](backend/package.json)
- [`backend/package-lock.json`](backend/package-lock.json)
- [`backend/tsconfig.json`](backend/tsconfig.json)
- [`backend/.env.example`](backend/.env.example)
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

## Render deployment notes
- Use a Render Web Service for [`backend/src/server.ts`](backend/src/server.ts)
- Set `PORT` from Render's injected port or leave it unset locally
- Set `DATABASE_URL` to a Render PostgreSQL instance in production
- Set `CORS_ORIGIN` to the deployed frontend URL
- Run the backend build command during deploy so Prisma Client is generated before TypeScript compilation
- Run migrations before or during deploy, depending on the Render workflow used

## Current persistence scope
The first persistence slice now covers:
- users
- workspaces
- workspace members
- API keys
- leads
- lead activities

SQLite is used for deterministic local verification first. For Render production, switch [`DATABASE_URL`](backend/.env.example) to PostgreSQL and keep the Prisma datasource on PostgreSQL.
