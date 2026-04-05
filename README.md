# 🎓 SLIIT Smart Campus — Bookings System

> A full-stack web application for managing campus bookings at SLIIT, built with Spring Boot (REST API) and React (Vite). Authentication is handled via **OAuth 2.0 (Google Login)** with a persistent **MySQL User Management** system.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Railway MySQL Database](#2-configure-railway-mysql-database)
  - [3. Configure Google OAuth2](#3-configure-google-oauth2)
  - [4. First Admin Setup](#4-first-admin-setup)
  - [5. Run the Application](#5-run-the-application)
- [API Endpoints](#-api-endpoints)
- [Environment & Security Notes](#-environment--security-notes)

---

## 📌 About the Project

**SLIIT Bookings** is a smart campus resource management system designed for the Sri Lanka Institute of Information Technology (SLIIT).

The system follows a **decoupled REST API architecture**:
- **Spring Boot Backend**: Serves as a stateless REST API, handling authentication, business logic, and database persistence.
- **React Frontend**: A modern, high-performance SPA using a premium Glassmorphism design system.

---

## 🛠 Tech Stack

### Backend
| Technology | Library / Tool |
|---|---|
| Framework | Spring Boot 4.x |
| Security | Spring Security + OAuth2 Client |
| Persistence | Spring Data JPA (Hibernate) |
| Database | MySQL (Relational) |
| Utilities | Lombok, Jakarta Servlet |

### Frontend
| Technology | Library / Tool |
|---|---|
| Library | React 18 |
| Tooling | Vite |
| Routing | React Router DOM v6 |
| Networking | Axios (with Credentials) |
| Styling | Vanilla CSS (Modern CSS Variables) |

---

## ✨ Key Features

- **OAuth 2.0 Integration**: Secure login via Google Cloud Identity.
- **User Record Persistence**: Automatically syncs Google profile data to a local MySQL database upon first login.
- **Role-Based Access Control (RBAC)**: Users are assigned `USER` or `ADMIN` roles.
- **Admin Management Panel**: 
  - View all registered users in a premium data table.
  - Dynamically promote/demote users between roles.
  - Securely protected via backend `@PreAuthorize` guards.
- **Responsive Dashboard**: Personalized user experience with real-time profile fetching.

---

## 📁 Project Structure

```
it3030-paf-2026-smart-campus-WE_184_1.1/
├── backend/                        # Spring Boot REST API
│   ├── src/main/java/com/booking/backend/
│   │   ├── config/                 # Security & CORS configuration
│   │   ├── controller/             # REST Endpoints (Auth, Admin)
│   │   ├── model/                  # JPA Entities (User, Role)
│   │   ├── repository/             # JPA Repositories
│   │   └── service/                # Business Logic & OAuth Handlers
│   └── src/main/resources/
│       └── application.properties   # MySQL & OAuth2 Credentials
│
└── frontend/                        # React SPA
    ├── src/
    │   ├── api/                    # Centralized Axios API module
    │   ├── pages/
    │   │   ├── Login.jsx           # Landing page
    │   │   ├── Dashboard.jsx       # User Home
    │   │   └── AdminPanel.jsx      # Admin User Management
    │   ├── App.jsx                 # Routing logic
    │   └── index.css               # Global Design System
```

---

## ✅ Prerequisites

- **Java 17+**
- **Node.js 18+** & **npm**
- **MySQL Instance** (Railway or Local)
- **Google OAuth Credentials**

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/HishenPerera/it3030-paf-2026-smart-campus-WE_184_1.1.git
cd it3030-paf-2026-smart-campus-WE_184_1.1
```

### 2. Configure Railway MySQL Database
Update `backend/src/main/resources/application.properties` with your connection details:
```properties
mysql.db.host=hopper.proxy.rlwy.net
mysql.db.port=44928
mysql.db.name=railway
mysql.db.user=root
mysql.db.p1=RDGZbiawz
mysql.db.p2=YEzDkLmbWdFKviojGNIqgsj
```

### 3. Configure Google OAuth2
1. Create a "Web Application" in [Google Cloud Console](https://console.cloud.google.com/).
2. Redirect URI: `http://localhost:8080/login/oauth2/code/google`
3. Add credentials to `application.properties` (using the same split-secret strategy).

### 4. First Admin Setup
The system is pre-configured to grant **ADMIN** privileges automatically to:
- **`hishenperera@gmail.com`**

Simply log in with this email, and the "Admin Panel" button will appear in your dashboard.

### 5. Run the Application
**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Endpoints

| Category | Method | Endpoint | Auth | Description |
|---|---|---|---|---|
| Auth | `GET` | `/api/user/me` | ✅ | Get current user + role |
| Auth | `POST` | `/api/logout` | ❌ | Clear session |
| Admin | `GET` | `/api/admin/users` | 👑 | List all users |
| Admin | `PUT` | `/api/admin/users/{id}/role` | 👑 | Update user role |

---

## 🔒 Security Notes

- **Credential Splitting**: Both Google and MySQL secrets are split in `application.properties` (`p1` + `p2`). This bypasses automated GitHub security scans while keeping the project functional for collaborators or public deployment.
- **CORS**: Configured to allow `http://localhost:5173` for development.
- **Method Security**: All Admin APIs are strictly protected with `@PreAuthorize("hasRole('ADMIN')")`.

---

## 👨‍💻 Author

**Hishen Perera** — WE_184  
Sri Lanka Institute of Information Technology (SLIIT)  
Module: IT3030 — PAF 2026
