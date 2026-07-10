# CreatorOS Backend (Scaffold)

This repository contains the initial scaffold for the CreatorOS backend using Node.js, Express, and Prisma.

Quick start:

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies: `npm install`.
3. Generate Prisma client: `npx prisma generate`.
4. Run migrations: `npx prisma migrate dev --name init`.
5. Start server: `npm run dev`.

Auth endpoints (initial):
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/logout`

What's included in this scaffold:

- Project structure that follows MVC + service layer and clean architecture.
- Prisma schema with `User`, `RefreshToken`, and `Script` models and `Role` enum.
- Core Express app with centralized error handler and Winston logger.
- Authentication service (register/login/refresh/logout) with JWT and bcrypt.
- Basic Zod validators for auth endpoints.

Next steps:

- Implement email verification, password reset, Google OAuth integration.
- Add profile endpoints, RBAC middleware, and role management.
- Continue phased implementation (dashboard, content calendar, AI assistant, assets, analytics).

See the project TODO list for planned phases and tasks.