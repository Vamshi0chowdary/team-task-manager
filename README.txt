# 🚀 Team Task Manager

> A full-stack project management app for creating projects, assigning tasks, tracking progress, and managing team access with Admin / Member roles.

## 🔗 Links
- 🌐 Live Demo: https://team-task-manager-production-5206.up.railway.app
- 💻 GitHub Repository: https://github.com/Vamshi0chowdary/team-task-manager

## 📌 Assignment Overview
Build a web app where users can create projects, assign tasks, and track progress with role-based access control.

## ✨ Key Features
- 🔐 Authentication with signup and login
- 👥 Project and team management
- 📝 Task creation, assignment, and status tracking
- 📊 Dashboard for tasks, status, and overdue work
- 🛡️ Role-based access control for Admin and Member users

## ⚙️ Tech Stack
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- ORM: Prisma
- Auth: JWT
- Deployment: Railway

## 🌐 Deployment
This project is deployed on Railway and is available here:

https://team-task-manager-production-5206.up.railway.app

## 🛠️ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Vamshi0chowdary/team-task-manager.git
cd team-task-manager
```

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## 🔑 Environment Variables

### `/server/.env`
| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Database connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port, default `5000` |
| `FRONTEND_URL` | Frontend origin for CORS |

### `/client/.env`
| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend base URL |

## 🧠 Demo Flow
1. Register User 1 and User 2
2. User 1 creates a project and becomes Admin
3. User 1 adds User 2 as a Member
4. User 1 creates tasks and assigns them to User 2
5. User 2 logs in, views tasks, and updates status
6. User 2 cannot access admin-only routes
7. Dashboard shows live task statistics and overdue alerts

## 🏆 Why This Project Stands Out
- Clean full-stack architecture
- Practical role-based access control
- Task and project workflow that feels production-ready
- Deployed and fully accessible online
