# Aisel — Patients Management System

This project demonstrates full-stack architecture, RBAC security design, and resilience handling under unreliable backend conditions.

Built with **Next.js + NestJS + PostgreSQL (Prisma)**, it implements JWT-based authentication, role-based access control, and a patients management system with search, sorting, pagination, and optimistic UI updates. The backend also simulates latency and failures to test frontend resilience.

It was completed as a time-boxed engineering exercise focused on prioritization, architecture decisions, and trade-off awareness.

## What I cut and why

| Cut | Reason |
|-----|--------|
| Docker / cloud deploy | Time-boxed to ~3–4h; local setup is enough to demo |
| Dark mode | Light theme with design tokens is sufficient to show taste |
| Infinite scroll | Pagination meets the spec with less complexity |
| Full test coverage | 2 sharp tests (unit + RBAC e2e) show test judgment |
| Refresh tokens | Mock JWT expiry (1h) + logout covers the requirement |
| Soft deletes | Not in API contract; YAGNI |

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

## Setup

### 0. Clone project

```bash
git clone https://github.com/rihenhouli/aisel-project.git
cd aisel-project
```

### 1. Install dependencies

```bash
npm install
```

### 2. Backend

```bash
cd apps/backend
cp .env.example .env
# Edit DATABASE_URL if needed

npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

Backend runs at **http://localhost:3001**

### 3. Frontend

```bash
cd apps/frontend
cp .env.example .env.local
npm run dev
```

Frontend runs at **http://localhost:3000**

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aisel.test | admin123 |
| User | user@aisel.test | user123 |

- **Admin**: create, edit, delete patients
- **User**: view-only (edit/delete hidden in UI; backend returns 403)

## API

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/auth/login` | Any |
| GET | `/patients` | Admin / User |
| GET | `/patients/:id` | Admin / User |
| POST | `/patients` | Admin |
| PUT | `/patients/:id` | Admin |
| DELETE | `/patients/:id` | Admin |

The backend randomly injects ~500ms latency and ~10% failure rate on patient routes (not login) to demo resilience. The frontend uses optimistic updates with rollback on failure.

## Tests

```bash
cd apps/backend
npm test
npm run test:e2e
```

## Architecture

```
apps/
  backend/   NestJS — auth, patients, Prisma, flaky interceptor
  frontend/  Next.js App Router — login, patients table, modals
```


## Deployment notes (not included in repo)

- PostgreSQL: hosted (AWS RDS / Neon / Supabase)
- JWT_SECRET: stored securely in environment variables (not committed)

