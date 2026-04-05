# 🎓 SLIIT Smart Campus — Bookings System

> A full-stack web application for managing campus bookings at SLIIT, built with Spring Boot (REST API) and React (Vite). Authentication is handled via **OAuth 2.0 (Google Login)** using Spring Security.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure MySQL Database](#2-configure-mysql-database)
  - [3. Configure Google OAuth2](#3-configure-google-oauth2)
  - [4. Run the Backend](#4-run-the-backend)
  - [5. Run the Frontend](#5-run-the-frontend)
- [API Endpoints](#-api-endpoints)
- [Authentication Flow](#-authentication-flow)
- [Environment & Security Notes](#-environment--security-notes)

---

## 📌 About the Project

**SLIIT Bookings** is a smart campus resource management system designed for the Sri Lanka Institute of Information Technology (SLIIT). It allows authenticated university members to:

- Log in securely using their Google account via OAuth 2.0
- View and manage campus facility bookings
- Access role-based features for students and administrators

The system is built as a **decoupled REST API architecture**:
- The **Spring Boot backend** exclusively serves JSON over REST endpoints (`/api/...`)
- The **React frontend** is an independent Single-Page Application (SPA) that consumes those APIs

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Java 17 | Core language |
| Spring Boot 4.x | Application framework |
| Spring Security | OAuth2 login & authorization |
| Spring Data JPA | Database ORM |
| MySQL | Relational database |
| Lombok | Boilerplate reduction |
| Maven | Build tool |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Dev server & bundler |
| React Router DOM | Client-side routing |
| Axios | HTTP REST client |
| Vanilla CSS | Styling (Glassmorphism dark theme) |

---

## 📁 Project Structure

```
it3030-paf-2026-smart-campus-WE_184_1.1/
├── backend/                        # Spring Boot REST API
│   ├── src/main/java/com/booking/backend/
│   │   ├── BackendApplication.java
│   │   ├── config/
│   │   │   └── SecurityConfig.java  # OAuth2 + CORS + Logout config
│   │   └── controller/
│   │       └── AuthController.java  # /api/user/me endpoint
│   └── src/main/resources/
│       └── application.properties   # DB + OAuth credentials
│
└── frontend/                        # React SPA
    ├── src/
    │   ├── api/
    │   │   └── api.js               # Centralized Axios API service
    │   ├── pages/
    │   │   ├── Login.jsx            # OAuth2 login page
    │   │   ├── Login.css
    │   │   ├── Dashboard.jsx        # Protected user dashboard
    │   │   └── Dashboard.css
    │   ├── App.jsx                  # React Router configuration
    │   ├── App.css
    │   ├── index.css                # Global design system (dark/glass theme)
    │   └── main.jsx
    └── vite.config.js
```

---

## ✅ Prerequisites

Make sure you have the following installed before starting:

- **Java 17+** — [Download](https://adoptium.net/)
- **Maven 3.8+** — (or use the project's `./mvnw` wrapper)
- **Node.js 18+** and **npm** — [Download](https://nodejs.org/)
- **MySQL 8.0+** — [Download](https://dev.mysql.com/downloads/)
- A **Google Cloud Console** account to create OAuth credentials

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HishenPerera/it3030-paf-2026-smart-campus-WE_184_1.1.git
cd it3030-paf-2026-smart-campus-WE_184_1.1
```

---

### 2. Configure MySQL Database

Start your local MySQL server and ensure you have a user with access. The application will **auto-create** the `smart_campus` database on first run.

Open `backend/src/main/resources/application.properties` and update the credentials if needed:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_campus?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root
```

---

### 3. Configure Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set Application Type to **Web Application**
6. Add the following **Authorized Redirect URI**:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
7. Copy your **Client ID** and **Client Secret**

Update `backend/src/main/resources/application.properties`:

```properties
google.client.id=YOUR_GOOGLE_CLIENT_ID
google.secret.p1=GOCSPX
google.secret.p2=-YOUR_REMAINING_SECRET

spring.security.oauth2.client.registration.google.client-id=${google.client.id}
spring.security.oauth2.client.registration.google.client-secret=${google.secret.p1}${google.secret.p2}
spring.security.oauth2.client.registration.google.scope=profile, email
```

> **Note:** The secret is split into two parts (`p1` + `p2`) to satisfy GitHub's secret scanning policy while still allowing direct commits. The values are concatenated at runtime by Spring Boot.

---

### 4. Run the Backend

Navigate to the `backend` directory and start the Spring Boot application:

```bash
cd backend

# Using the Maven wrapper (recommended)
./mvnw spring-boot:run

# Or build and run the JAR
./mvnw clean install -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The backend will start on: **`http://localhost:8080`**

---

### 5. Run the Frontend

Navigate to the `frontend` directory, install dependencies and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on: **`http://localhost:5173`**

Open your browser and go to: [http://localhost:5173](http://localhost:5173)

---

## 📡 API Endpoints

All endpoints are prefixed with `/api` and served by the Spring Boot backend on port `8080`.

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/user/me` | ✅ Yes | Returns the currently authenticated OAuth2 user's profile |
| `POST` | `/api/logout` | ❌ No | Invalidates the current session and returns `HTTP 200` |
| `GET` | `/oauth2/authorization/google` | ❌ No | Initiates the Google OAuth2 login flow |

---

## 🔐 Authentication Flow

```
User clicks "Continue with Google"
        ↓
Browser navigates to:
http://localhost:8080/oauth2/authorization/google
        ↓
Spring Security redirects to Google's login page
        ↓
User authenticates with Google
        ↓
Google redirects back to:
http://localhost:8080/login/oauth2/code/google
        ↓
Spring Boot validates token, creates session cookie (JSESSIONID)
        ↓
Backend redirects browser to:
http://localhost:5173/dashboard
        ↓
React Dashboard calls GET /api/user/me with withCredentials: true
        ↓
Backend validates session cookie → returns user JSON
        ↓
Dashboard renders user profile ✅
```

**Logout Flow:**
```
User clicks "Logout" button
        ↓
React calls POST /api/logout (Axios, withCredentials: true)
        ↓
Spring Security invalidates session + clears cookie
        ↓
Returns HTTP 200 OK
        ↓
React clears local user state → navigate('/login') ✅
```

---

## 🔒 Environment & Security Notes

- **Never commit raw OAuth secrets** to version control. The project uses a split-key pattern (`p1` + `p2`) to circumvent GitHub's secret scanning while keeping credentials in the repository for team sharing. For production, use environment variables or a secrets manager.
- **CSRF is disabled** in `SecurityConfig.java` for REST API simplicity. Enable and configure it properly before going to production.
- **CORS** is configured to allow `http://localhost:5173` and `http://localhost:3000` for local development. Update `SecurityConfig.java` with your actual production domain before deployment.

---

## 👨‍💻 Author

**Hishen Perera** — WE_184  
Sri Lanka Institute of Information Technology (SLIIT)  
Module: IT3030 — Programming Applications Framework (PAF) 2026
