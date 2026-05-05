# ProjectFlow — Project & Task Management App

## Overview
A full-stack project management tool where teams can create projects,
assign roles (Admin / Member), manage tasks with priorities and due 
dates, and track progress via a live dashboard.

---

## Tech Stack
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (via Prisma ORM)
- Auth: JWT
- Deployment: Railway

---

## Local Setup

### 1. Clone the repo
    git clone https://github.com/your-username/your-repo.git
    cd your-repo

### 2. Backend setup
    cd server
    npm install
    cp .env.example .env      ← fill in your values
    npx prisma migrate dev
    npm run dev               ← runs on http://localhost:5000

### 3. Frontend setup
    cd client
    npm install
    cp .env.example .env      ← fill in VITE_API_URL
    npm run dev               ← runs on http://localhost:5173

---

## Environment Variables

### /server/.env
| Variable      | Description                        |
|---------------|------------------------------------|
| DATABASE_URL  | PostgreSQL connection string        |
| JWT_SECRET    | Secret key for signing JWT tokens   |
| PORT          | Server port (default: 5000)         |
| FRONTEND_URL  | Frontend origin for CORS whitelist  |

### /client/.env
| Variable       | Description                         |
|----------------|-------------------------------------|
| VITE_API_URL   | Backend base URL                    |

---

## Features
- JWT authentication (register / login)
- Create projects and invite members by email
- Role-based access: Admin vs Member
- Task board with To Do / In Progress / Done columns
- Priority levels (Low / Medium / High) and due dates
- Dashboard with live task stats and overdue alerts
- Fully deployed on Railway

---

## Demo Flow
1. Register User 1 and User 2
2. User 1 creates a project (auto-assigned as Admin)
3. User 1 adds User 2 as Member
4. User 1 creates tasks and assigns them to User 2
5. User 2 logs in, sees their tasks, updates status
6. User 2 cannot access admin routes (verified in Network tab)
7. Dashboard shows live stats for all tasks
---
# team-task-manager
