# Agent.md

## Overview
- Monorepo managed with pnpm workspaces and NX (for testing utilities)
- Frontend: Next.js 14 (React 18)
- Backend/Workers/Cron: NestJS 10
- Database: Prisma (PostgreSQL)
- Queue: Redis + BullMQ
- Packaging: Vite (browser extension), tsup (SDK)
- Observability/other: Sentry, Stripe, i18n, TailwindCSS

## Monorepo & Tooling
- Package manager: pnpm 10.6.1 (`packageManager`)
- Workspaces: `apps/*`, `libraries/*` (pnpm-workspace.yaml)
- Node:
  - engines: ">=22.12.0 <23.0.0"
  - Volta pin: 20.17.0 (note: prefer aligning Node to the `engines` constraint for local/dev CI)
- TypeScript base config: `tsconfig.base.json` with path aliases `@gitroom/*`
- Linting: Flat ESLint config `eslint.config.mjs` (extends Next rules)
- Testing: Jest (root `test` script uses jest-junit reporters) and NX jest utilities

## Apps
- apps/frontend: Next.js app
  - Scripts: `dev` (4200), `build`, `build:sentry`, `start` (4200), `pm2`
- apps/backend: NestJS API
  - Scripts: `dev`, `build`, `start`, `pm2`
- apps/workers: NestJS workers (BullMQ)
  - Scripts: `dev`, `build`, `start`, `pm2`
- apps/cron: NestJS cron jobs
  - Scripts: `dev`, `build`, `start`, `pm2`
- apps/extension: Browser extension (Vite + React)
  - Scripts: `dev` (watch), `build`, `build:chrome`, `build:firefox`, `dev:chrome`, `dev:firefox`
- apps/commands: NestJS command runner
  - Scripts: `dev`, `build`, `start`
- apps/sdk: Node SDK published to npm (@postiz/node)
  - Script: `publish` (build via tsup, then publish)

## Libraries
- libraries/nestjs-libraries: NestJS shared modules
  - Prisma schema: `src/database/prisma/schema.prisma`
  - Likely includes chat/LLM tooling (see `src/chat/*`)
- libraries/helpers: Shared helpers/utilities
- libraries/react-shared-libraries: Reusable React components/hooks

## Data & Infrastructure
- Database: PostgreSQL 17 (docker-compose.dev.yaml)
- Redis: 7 (docker-compose.dev.yaml)
- Extras: PgAdmin (8081), RedisInsight (5540)
- Docker (dev): `docker-compose.dev.yaml`
- Docker scripts: `var/docker/docker-build.sh`, `var/docker/docker-create.sh`, `var/docker/nginx.conf`
- Cloud: `railway.toml` present (service configuration)

## Environment
- Root `.env` loaded via `dotenv-cli` in most scripts
- Copy `.env.example` ➜ `.env` and adjust values

## Development Workflow
1) Prereqs
   - Node (align with engines), pnpm 10.6+
   - Docker (for Postgres/Redis in dev)
2) Start infra (optional, local DB/Redis)
   - `pnpm run dev:docker`
3) Install deps
   - `pnpm install`
4) Generate Prisma client
   - Auto on postinstall, or manually: `pnpm run prisma-generate`
5) Initialize DB schema
   - `pnpm run prisma-db-push`
6) Run all services in parallel
   - `pnpm run dev` (filters: extension, cron, workers, backend, frontend)
7) Or run per app
   - Backend: `pnpm run dev:backend`
   - Frontend: `pnpm run dev:frontend`
   - Workers: `pnpm run dev:workers`
   - Cron: `pnpm run dev:cron`

## Common Scripts (root)
- Dev all: `pnpm run dev`
- Dev Stripe webhook (local): `pnpm run dev:stripe`
- Build (selected apps): `pnpm run build`
- Build individuals: `build:backend|frontend|workers|cron|extension`
- Start prod (per app): `start:prod:backend|frontend|workers|cron`
- Prisma:
  - `prisma-generate` ➜ generate client
  - `prisma-db-push` ➜ apply schema to DB
  - `prisma-reset` ➜ force reset + push (use with caution)
- Docker helper:
  - `dev:docker` ➜ docker-compose for local infra
  - `docker-build`/`docker-create` scripts in `var/docker`
- Tests: `pnpm test` (jest + junit)

## Testing & Linting
- Jest configured at root (`jest.config.ts` uses `@nx/jest` getJestProjects)
- ESLint flat config, Next + TS base, relaxed TypeScript rules for DX

## CI/CD
- .github/workflows
  - build, build-containers, build-extension, build-pr, eslint, codeql, pr-docker-build, publish-extension, stale
- Jenkins folder exists (optional pipelines)

## Paths & Imports
- Aliases via `tsconfig.base.json`:
  - `@gitroom/backend/*` ➜ `apps/backend/src/*`
  - `@gitroom/cron/*` ➜ `apps/cron/src/*`
  - `@gitroom/frontend/*` ➜ `apps/frontend/src/*`
  - `@gitroom/helpers/*` ➜ `libraries/helpers/src/*`
  - `@gitroom/nestjs-libraries/*` ➜ `libraries/nestjs-libraries/src/*`
  - `@gitroom/react/*` ➜ `libraries/react-shared-libraries/src/*`
  - `@gitroom/plugins/*` ➜ `libraries/plugins/src/*` (if present)
  - `@gitroom/workers/*` ➜ `apps/workers/src/*`
  - `@gitroom/extension/*` ➜ `apps/extension/src/*`

## LLM/Agents Capabilities
- Libraries present: `@mastra/*`, `@langchain/*`, `@ai-sdk/openai`, `@modelcontextprotocol/sdk`, `@copilotkit/*`
- Shared chat/tools likely under `libraries/nestjs-libraries/src/chat/*`
- For API keys, use `.env` and never hardcode secrets

## Notes & Gotchas
- Node version: reconcile Volta (20.17) vs engines (>=22.12 <23) across dev/CI
- Docker compose file is for development only (see header comments)
- Prisma script uses db push (no migrations). For prod-grade flows, consider `prisma migrate`.

## Quickstart
```bash
# 1) Infra (optional)
pnpm run dev:docker

# 2) Install deps
pnpm install

# 3) Generate client and sync DB
pnpm run prisma-generate
pnpm run prisma-db-push

# 4) Run all apps
doppler run -- pnpm run dev  # or simply: pnpm run dev
```
