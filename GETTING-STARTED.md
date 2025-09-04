# Getting Started with Vault SaaS

## Tech Stack

Vault SaaS is a modular monolith:

- **Back-end:** Node.js + Express + TypeScript + Postgres
- **Front-ends:** React (Vite) for Small Business Owners, Borrowers, and Admins
- **Tools:** ESLint + Prettier, Vitest, GitHub Actions CI
- **Docker:** Postgres + app services for local development

## Quickstart

```bash
# 1) Install dependencies (requires Node 18+)
npm ci

# 2) Start all apps (back-end + 3 front-ends) concurrently
npm run dev

# 3) Or run them individually
npm --workspace=@apps/backend run dev
npm --workspace=@apps/owner-web run dev
npm --workspace=@apps/borrower-web run dev
npm --workspace=@apps/admin-web run dev
```

### Docker

```bash
# Build images & start everything (Postgres + back-end + webapps)
docker compose up --build
```

## Tools

### Test

```bash
npm run lint
```

### Lint

```bash
npm run test
```

### Format

```bash
npm run format
```

## How to Access Each Service

- **Back-end API:** http://localhost:4000/health
- **Small Business Owner Webapp:** http://localhost:5173
- **Borrower Webapp:** http://localhost:5174
- **Admin Webapp:** http://localhost:5175
- **Postgres:** localhost:5432
