# CreatorOS

CreatorOS is an AI-powered operating system for content creators, agencies, and digital teams. It provides a centralized platform for content planning, AI-assisted writing, collaboration, asset management, finance tracking, and analytics.

---

# Features

- JWT Authentication
- Role-Based Access Control (RBAC)
- Creator Dashboard
- AI Script Writing
- Content Calendar
- Team Collaboration
- Asset Management
- Finance Management
- Analytics Dashboard
- AI Content Generation
- Cloudinary Image Upload
- Real-time Collaboration using Socket.IO
- Email Verification
- Password Reset

---

# Project Structure

```
Creator-Os/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── uploads/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# Frontend

## Tech Stack

- React.js
- Vite
- React Router
- Socket.IO Client
- CSS3

## Installation

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

## Build

```bash
npm run build
```

## Frontend Modules

- Landing Page
- Login
- Register
- Dashboard
- Content Planner
- AI Workspace
- Analytics
- Finance
- Asset Library
- Team Collaboration
- Responsive User Interface

---

# Backend

Built with Node.js, Express.js, Prisma ORM, and PostgreSQL.

## Tech Stack

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL (Neon)
- JWT
- Bcrypt
- Socket.IO
- Zod
- Winston
- Cloudinary
- Nodemailer

## Installation

```bash
cd backend
npm install
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Run Database Migration

```bash
npx prisma migrate dev --name init
```

## Start the Server

Development

```bash
npm run dev
```

Production

```bash
npm start
```

Backend runs at:

```
http://localhost:4000
```

---

# Environment Variables

Create a `.env` file inside the `backend` folder.

```env
DATABASE_URL=

PORT=4000

NODE_ENV=development

CLIENT_URL=http://localhost:5173

JWT_ACCESS_TOKEN_SECRET=

JWT_REFRESH_TOKEN_SECRET=

ACCESS_TOKEN_EXPIRES_IN=15m

REFRESH_TOKEN_EXPIRES_IN=7d

OPENAI_API_KEY=

GROQ_API_KEY=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASS=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

---

# API Endpoints

## Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/verify-email
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

## Dashboard

```
GET /api/v1/dashboard
```

## Content

```
GET    /api/v1/content
POST   /api/v1/content
PATCH  /api/v1/content/:id
DELETE /api/v1/content/:id
```

## AI

```
POST /api/v1/ai/script
POST /api/v1/ai/caption
POST /api/v1/ai/ideas
```

## Finance

```
GET
POST
PATCH
DELETE
```

## Analytics

```
GET
```

## Assets

```
GET
POST
DELETE
```

## Team Collaboration

```
GET
POST
PATCH
DELETE
```

---

# Authentication

CreatorOS uses:

- JWT Access Token
- JWT Refresh Token
- Protected Routes
- Role-Based Authorization

Supported Roles:

- Creator
- Manager
- Video Editor
- Thumbnail Designer
- Script Writer
- Finance Manager
- Admin

---

# Real-time Features

Socket.IO is used for:

- Live Script Editing
- Team Collaboration
- Notifications
- Workspace Updates

---

# Deployment

## Frontend

- Vercel

## Backend

- Render

## Database

- Neon PostgreSQL

## Image Storage

- Cloudinary

---

# Development Workflow

Clone the repository:

```bash
git clone https://github.com/Pavithra-1685/Creator-Os.git
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Run backend:

```bash
cd backend
npm run dev
```

Run frontend:

```bash
cd frontend
npm run dev
```

---

# Future Improvements

- Mobile Application
- AI Thumbnail Generator
- Social Media Scheduling
- Payment Integration
- Google OAuth
- Email Verification
- Dark Mode
- Multi-language Support
- Team Workspaces
- Activity Timeline
- Advanced Analytics
- AI Video Generation

---

# Author

**Pavithra H**

B.Tech Computer Engineering (Artificial Intelligence & Machine Learning)

---

