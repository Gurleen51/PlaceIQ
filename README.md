# PlaceIQ — Smart Placement Analytics Portal

<div align="center">

![PlaceIQ Banner](https://img.shields.io/badge/PlaceIQ-Placement%20Portal-0f172a?style=for-the-badge&logo=react&logoColor=6EE7B7)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

**A full-stack MERN application for college placement management.**
Map student skills to job requirements, rank matches using an AI scoring engine,
and give students and admins rich analytics dashboards.

[Live Demo](https://smart-analytics-tool-for-placement.vercel.app) · [Report Bug](#) · [Request Feature](#)

</div>

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Project Objectives](#project-objectives)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Matching Engine](#matching-engine)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About the Project

PlaceIQ is a college placement intelligence system designed to bridge the gap between students and recruiters. It automates job-skill matching, tracks placement readiness, and provides downloadable placement reports — all in one platform.

### Project Objectives

| # | Objective |
|---|-----------|
| 1 | Prepare a dataset of companies for placement drives and off-campus recruitment |
| 2 | Map student skills with job profile requirements for various companies and roles |
| 3 | Develop an analytical tool that helps students assess skills and improve placement readiness |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Recharts | Bar, Pie & Line charts |
| Axios | HTTP client |
| CSS-in-JS (inline styles) | Styling |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Runtime |
| Express 4.x | Web server framework |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Multer | File upload handling |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend & Backend hosting |
| MongoDB Atlas | Database hosting |

---

## ✨ Features

### 👥 Student Features
- **Multi-step Registration** — Account details, academic profile, certifications, projects, and CGPA
- **AI Job Matching** — Smart scoring engine that ranks jobs based on skill overlap and preferred role
- **Job Listings** — Searchable cards with live match score preview; click to see full details, requirements, salary breakdown, and skill match inside a modal
- **Skill Gap Analysis** — Visual breakdown of skills you have vs. skills you need, with priority ranking
- **My Dashboard** — Shows only preferred-role jobs split into Eligible and Needs Skills sections
- **Editable Profile** — Update skills, education, certifications, projects, and CGPA at any time
- **Resume Upload** — PDF resume upload (max 5 MB)
- **Placement Report** — Downloadable PDF report with CGPA, certifications, projects, skill gaps, and top job matches

### 👑 Admin Features
- **Overview Dashboard** — Bar and pie charts showing students, jobs, and matches
- **Manage Jobs** — Add, edit, delete job postings with search and filter
- **Manage Students** — View all students with skill tags, preferred role, and registration date
- **Admin Management** — Create new admin accounts, view all admins, delete admins (with self-deletion protection)
- **Toast Notifications** — Success and error feedback on all actions

### 📊 Public Analytics
- **Platform Overview** — Student count, job postings, applications, unique skills
- **Skill Analytics** — Top 10 most common skills with frequency bar chart
- **Salary Insights** — Distribution of offered packages across LPA ranges

---

## 📁 Folder Structure

```
placeiq/
│
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js                   # Root layout, sidebar, routing
│   │   ├── index.js                 # React entry point
│   │   ├── index.css                # Global styles, scrollbar fix
│   │   ├── App.css                  # Animations, utility classes
│   │   │
│   │   ├── Dashboard.js             # Platform overview & charts
│   │   ├── Jobs.js                  # Job listings + detail modal
│   │   ├── Skills.js                # Skill analytics & bar chart
│   │   ├── Salary.js                # Salary distribution charts
│   │   ├── Matches.js               # Authenticated job matches
│   │   │
│   │   ├── Login.js                 # Student & admin login
│   │   ├── Register.js              # 3-step student registration
│   │   ├── ProtectedRoute.js        # Auth guard for student routes
│   │   ├── AdminRoute.js            # Auth guard for admin routes
│   │   │
│   │   ├── StudentDashboard.js      # Student portal (matches, profile, skill gap, report)
│   │   ├── AdminDashboard.js        # Admin portal (jobs, students, admins)
│   │   └── ResumeUpload.jsx         # Drag-drop PDF upload component
│   │
│   ├── vercel.json                  # Frontend Vercel config (SPA routing + CI=false)
│   ├── .env.production              # Production API URL
│   └── package.json
│
└── server/                          # Express backend
    ├── api/
    │   └── index.js                 # Serverless Express app (Vercel entry point)
    ├── User.js                      # Mongoose user model
    ├── auth.js                      # JWT middleware
    ├── server.js                    # Local development server
    ├── vercel.json                  # Backend Vercel config
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/placeiq.git
cd placeiq
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `server/` folder:

```env
MONGO_URI=mongodb://localhost:27017/placeiq
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

Create a `.env.local` file in the `client/` folder:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Create admin account (one-time)

Start the server, then visit:
```
http://localhost:5000/create-admin
```
This creates: `admin@placeiq.com` / `admin123`

### 5. Run the project

```bash
# Terminal 1 — Backend
cd server
node server.js

# Terminal 2 — Frontend
cd client
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

### Backend (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens (use 64+ random chars) |
| `PORT` | ❌ | Server port (default: 5000) |
| `FRONTEND_URL` | ❌ | Allowed CORS origin in production |

### Frontend (`client/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | ✅ | Backend API base URL |

---

## 📡 API Reference

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/auth/register` | Register a new student |
| `POST` | `/auth/login` | Login (student or admin) |
| `GET` | `/jobs` | List all job postings |
| `GET` | `/matches` | List all job matches |
| `GET` | `/dashboard-stats` | Platform overview counts |
| `GET` | `/skills-data` | Skill frequency data |
| `GET` | `/salary-data` | Salary range distribution |
| `GET` | `/create-admin` | One-time admin account setup |

### Protected Routes — Student (`Authorization` header required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/my-profile` | Get logged-in student's profile |
| `PUT` | `/update-profile` | Update profile fields |
| `GET` | `/my-matches` | All ranked job matches |
| `GET` | `/my-dashboard-matches` | Preferred-role matches only |
| `GET` | `/my-report` | Report data for PDF generation |
| `GET` | `/generate-matches/:userId` | Re-run matching engine |
| `POST` | `/upload-resume/:userId` | Upload PDF resume |

### Protected Routes — Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin-stats` | Platform counts |
| `GET` | `/admin-students` | All student accounts |
| `GET` | `/admin-jobs` | All job postings |
| `POST` | `/add-job` | Add a new job posting |
| `PUT` | `/update-job/:id` | Update a job posting |
| `DELETE` | `/delete-job/:id` | Delete a job posting |
| `DELETE` | `/delete-student/:id` | Delete a student account |
| `POST` | `/admin/create-admin` | Create a new admin account |
| `GET` | `/admin/list-admins` | List all admin accounts |
| `DELETE` | `/admin/delete-admin/:id` | Delete an admin account |

### Auth Header Format
```
Authorization: <token>
```

---

## ⚙️ Matching Engine

The matching engine (`generateMatches` in `api/index.js`) works as follows:

```
1. Fetch all job postings → deduplicate by title + company
2. For each job → map title to required skill set
3. Compare student skills against required skills
4. Calculate base score: (matched ÷ required) × 100
5. Add +20 bonus if job matches student's preferred role
6. Cap score at 100%, mark eligible if score ≥ 60%
7. Sort: preferred-role jobs first, then by score descending
8. Assign recommendation_rank, save to user_job_matches collection
```

### Supported Job Roles

| Role | Required Skills |
|------|----------------|
| Full Stack Developer | HTML, CSS, JavaScript, React, Node.js |
| Frontend Developer | HTML, CSS, JavaScript, React |
| Backend Developer | Node.js, Express, MongoDB, SQL |
| Data Analyst | Excel, SQL, Python, Power BI |
| Data Engineer | Python, SQL, ETL, Spark |
| Software Engineer | Java, JavaScript, DSA |
| Java Developer | Java, Spring, SQL |
| Python Developer | Python, Django, Flask |
| UI/UX Designer | Figma, UI, UX, Wireframe |
| DevOps Engineer | Docker, Kubernetes, CI/CD, Linux |
| Cloud Engineer | AWS, Azure, GCP, Terraform |
| ML Engineer | Python, ML, TensorFlow, Pandas |

---

## 🌐 Deployment

### Deploy Backend to Vercel

```bash
cd server
npx vercel --prod
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL` (your frontend Vercel URL)

### Deploy Frontend to Vercel

```bash
cd client
npx vercel --prod
```

Add environment variable:
- `REACT_APP_API_URL` = your backend Vercel URL

### Important Notes

- The backend uses **Express v4** (not v5) — required for Vercel serverless compatibility
- MongoDB connection is **cached** across serverless invocations to avoid cold-start reconnections
- File uploads use **memory storage** (no disk) — serverless safe
- Frontend `vercel.json` sets `CI=false` to prevent warnings from failing the build

---

## 🗄️ MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Student and admin accounts |
| `job_postings` | Company job listings |
| `user_job_matches` | Pre-computed student–job matches |

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt** (12 salt rounds)
- JWTs expire after **7 days**
- All admin routes verify role before executing
- Admins cannot delete their own account
- Use a strong random `JWT_SECRET` in production:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

---

## 📝 Production Checklist

- [ ] Set strong `JWT_SECRET` (64+ chars)
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Set `FRONTEND_URL` to your exact frontend domain
- [ ] Remove or protect the `/create-admin` route after setup
- [ ] Enable MongoDB Atlas IP allowlist (restrict `0.0.0.0/0` in production)
- [ ] Store uploaded files in Cloudinary or AWS S3 instead of memory

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 👤 Author

**PlaceIQ** — Built with ❤️ using the MERN Stack

---

<div align="center">
  <sub>⭐ Star this repo if you found it helpful!</sub>
</div>
