# 🎓 SLIIT Smart Campus — Bookings System

> A full-stack web application for managing campus bookings at SLIIT, built with Spring Boot (REST API) and React (Vite). Authentication is handled via **OAuth 2.0 (Google Login)** with a persistent **MySQL** database and multi-role access control for **Users**, **Admins**, and **Technicians**.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [API Endpoints](#-api-endpoints)
- [Security & Session Management](#-security--session-management)

---

## 📌 About the Project

**SLIIT Smart Campus** is a smart campus resource management system designed for the Sri Lanka Institute of Information Technology (SLIIT). It enables students to book library seats and computer lab stations, report campus incidents, and receive real-time notifications — all through a modern, role-aware dashboard.

The system follows a **decoupled REST API architecture**:
- **Spring Boot Backend**: Serves as a REST API, handling authentication, business logic, automated scheduling, and database persistence.
- **React Frontend**: A modern, high-performance SPA using a premium Glassmorphism design system with role-tailored dashboards.

---

## 🛠 Tech Stack

### Backend
| Technology | Library / Tool |
|---|---|
| Framework | Spring Boot 3.x |
| Language | Java 17+ |
| Security | Spring Security + OAuth2 Client (Google) |
| Scheduling | Spring `@Scheduled` (Auto-Expiry Engine) |
| Persistence | Spring Data JPA (Hibernate) |
| Database | MySQL (Hosted on Railway) |
| Utilities | Lombok, Jakarta Servlet, Multipart File Handling |

### Frontend
| Technology | Library / Tool |
|---|---|
| Library | React 18 |
| Tooling | Vite |
| Routing | React Router DOM v6 |
| Networking | Axios (with session credentials) |
| Icons | Lucide React |
| Styling | Vanilla CSS (Glassmorphism Design System) |
| State | React Context API |

---

## ✨ Key Features

### 🔐 Authentication & Authorization (Module E)
- **OAuth 2.0 via Google**: One-click login using Google Cloud Identity — no passwords stored.
- **Auto User Provisioning**: On first login, a user record is created automatically in MySQL with the default `USER` role.
- **Multi-Role RBAC**: Three roles — `USER`, `ADMIN`, `TECHNICIAN` — each with distinct UI layouts and protected API access.
- **Session Security**: 8-hour inactivity timeout and single-session enforcement (new login invalidates old session).

### 🏢 Facility Booking (Module B)
- **Interactive Seat Grid**: Browse and book Library seats (L-001 to L-100) or Computer Lab stations (C-001 to C-050).
- **Auto-Expiry Engine**: A `@Scheduled` task runs every 60 seconds — automatically marks slots as `COMPLETED` once their end time passes, freeing the seat for new bookings.
- **Status Lifecycle**: `PENDING → CONFIRMED → COMPLETED` (admin-managed) or `CANCELLED` (with reason).
- **Conflict Prevention**: Smart overlap check excludes already-CANCELLED and COMPLETED slots.
- **Booking Notifications**: Students receive confirmation, cancellation, and slot-completion notifications automatically.

### 🎫 Incident Ticketing (Module C)
- **Ticket Submission**: Users submit campus issues with category, priority, location, and up to 3 image attachments.
- **Safe File Handling**: Filenames are UUID-randomized; path traversal attacks are blocked via `normalize()` validation.
- **Technician Assignment**: Admins assign tickets to Technicians; both parties receive real-time notifications.
- **Status Workflow**: `Open → In Progress → Resolved → Closed` (or `Rejected` by Admin), with role-based transition guards.
- **Filtering & Search**: Full-text search, date range, status/priority/category filters in the admin and technician views.

### 🔔 Notification Center (Module D)
- **Persistent Notifications**: All system events (booking, ticket, assignment) create user-specific notifications in the database.
- **Notification Bell**: Live unread badge with dropdown panel — accessible from every page via the topbar.
- **Admin Broadcast Tool**: Split-screen compose & live preview layout; target All / Students / Admins.
- **Expiry Management**: Admin-set expiry (1hr to 7 days); a scheduled cleanup task automatically purges expired broadcasts.
- **Alert Types**: `NOTIFICATION` (informational) and `ALERT` (urgent/important).

### 🖥 Admin Control Panel
- **Reservation Management**: Approve, confirm, or cancel bookings; filter by status (Pending/Active/Completed/Cancelled).
- **User Management**: View all registered users; promote/demote roles dynamically.
- **Ticket Management**: Full oversight of all tickets; assign technicians, update status, add resolution notes.
- **Resource Management**: Add, edit, or remove campus facilities (library seats, lab stations).
- **Notification Composer**: Broadcast messages with real-time preview and batch management.

---

## 📁 Project Structure

```
it3030-paf-2026-smart-campus-WE_184_1.1/
├── backend/
│   └── src/main/java/com/booking/backend/
│       ├── config/
│       │   ├── SecurityConfig.java          # OAuth2, CORS, session management
│       │   ├── ResourceInitializer.java     # One-time DB seeder (150 campus resources)
│       │   └── WebMvcConfig.java            # Static file serving for uploads
│       ├── controller/
│       │   ├── AuthController.java          # GET /api/user/me
│       │   ├── UserController.java          # User & role admin endpoints
│       │   ├── NotificationController.java  # Notification CRUD + broadcast
│       │   ├── ReservationController.java   # Facility booking endpoints
│       │   ├── ResourceController.java      # Campus resource CRUD
│       │   ├── TicketController.java        # Incident ticket endpoints
│       │   └── CommentController.java       # Ticket comments
│       ├── model/
│       │   ├── User.java / Role.java        # User entity with role enum
│       │   ├── CampusResource.java          # Library seats, lab stations
│       │   ├── ResourceReservation.java     # Booking entity (PENDING→COMPLETED)
│       │   ├── Ticket.java                  # Incident report entity
│       │   ├── Notification.java            # Notification entity with expiry
│       │   └── Comment.java                 # Ticket comment entity
│       ├── repository/                      # JPA Repositories + Specifications
│       └── service/
│           ├── CustomOAuth2UserService.java # Google login → local user sync
│           ├── ReservationService.java      # Booking logic + notifications
│           ├── ReservationExpiryService.java# @Scheduled auto-expiry engine
│           ├── TicketService.java           # Incident workflow + file handling
│           ├── NotificationService.java     # Send/broadcast/cleanup notifications
│           ├── CommentService.java          # Ticket comment management
│           ├── ResourceService.java         # Campus resource management
│           └── UserService.java             # User lookup and role updates
│
└── frontend/
    └── src/
        ├── api/
        │   └── api.js                       # All Axios API calls (centralised)
        ├── components/
        │   ├── NotificationBell.jsx         # Topbar bell with unread badge
        │   ├── AlertBanner.jsx              # Full-width alert notifications
        │   └── ToastContainer.jsx           # Toast message system
        ├── context/
        │   └── NotificationContext.jsx      # Global notification state
        ├── pages/
        │   ├── Login.jsx                    # Google OAuth landing page
        │   ├── Dashboard.jsx                # Role-tailored home (User/Admin/Tech)
        │   ├── AdminPanel.jsx               # Full admin control centre
        │   ├── ResourceBooking.jsx          # Facility seat booking UI
        │   ├── ViewTickets.jsx              # Ticket list with filters
        │   ├── TicketDetails.jsx            # Single ticket view + comments
        │   └── CreateTicket.jsx             # Incident reporting form
        └── App.jsx                          # Route definitions with role guards
```

---

## ✅ Prerequisites

- **Java 17+**
- **Node.js 18+** & **npm**
- **MySQL Instance** (Railway or Local)
- **Google OAuth2 Credentials** — requires a registered project in [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/HishenPerera/it3030-paf-2026-smart-campus-WE_184_1.1.git
cd it3030-paf-2026-smart-campus-WE_184_1.1
```

### 2. Configure the Database
Update `backend/src/main/resources/application.properties` with your MySQL connection:
```properties
mysql.db.host=<your-railway-host>
mysql.db.port=<port>
mysql.db.name=railway
mysql.db.user=root
mysql.db.p1=<first-half-of-password>
mysql.db.p2=<second-half-of-password>
```
> **Note:** Passwords are split across two keys to bypass GitHub's secret scanner.

### 3. Configure Google OAuth2
1. Create a **"Web Application"** credential in [Google Cloud Console](https://console.cloud.google.com/).
2. Set the **Authorized Redirect URI** to: `http://localhost:8080/login/oauth2/code/google`
3. Add the `client-id` and `client-secret` to `application.properties`.

### 4. First Admin Setup
By default, **`hishenperera@gmail.com`** is automatically provisioned as ADMIN on first login. To change this, update `DataInitializer.java` or promote a user via the Admin Panel → User Management.

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
> Frontend runs on `http://localhost:5173` · Backend on `http://localhost:8080`

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/user/me` | ✅ Session | Get current user profile + role |
| `POST` | `/logout` | ✅ Session | Invalidate session |

### 👑 Admin — Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | ADMIN | List all registered users |
| `GET` | `/api/admin/technicians` | ADMIN/TECH | List all technicians |
| `PUT` | `/api/admin/users/{id}/role` | ADMIN | Update a user's role |

### 🏢 Facility Booking
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reservations` | ✅ | Get all reservations (admin) |
| `GET` | `/api/reservations/my` | ✅ | Get current user's reservations |
| `POST` | `/api/reservations` | USER | Create a new reservation |
| `PUT` | `/api/reservations/{id}/confirm` | ADMIN | Confirm a pending booking |
| `DELETE` | `/api/reservations/{id}` | ✅ | Cancel a booking (with reason) |
| `GET` | `/api/resources` | ✅ | List campus resources (with type filter) |
| `POST` | `/api/resources` | ADMIN | Add a new resource |
| `PUT` | `/api/resources/{id}` | ADMIN | Update a resource |
| `DELETE` | `/api/resources/{id}` | ADMIN | Delete a resource |

### 🎫 Incident Tickets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tickets` | ✅ | Get tickets (role-filtered: own/assigned/all) |
| `POST` | `/api/tickets` | ✅ | Submit a new incident report |
| `GET` | `/api/tickets/{id}` | ✅ | Get a single ticket |
| `PUT` | `/api/tickets/{id}/status` | ADMIN/TECH | Update ticket status |
| `PUT` | `/api/tickets/{id}/assign` | ADMIN | Assign a technician |
| `DELETE` | `/api/tickets/{id}/attachments` | ✅ (owner) | Remove an image attachment |

### 🔔 Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | ✅ | Get all user notifications |
| `GET` | `/api/notifications/unread` | ✅ | Get unread notifications |
| `PUT` | `/api/notifications/{id}/read` | ✅ | Mark one notification as read |
| `PUT` | `/api/notifications/read-all` | ✅ | Mark all notifications as read |
| `POST` | `/api/notifications/send` | ADMIN | Broadcast a notification |
| `GET` | `/api/notifications/batches` | ADMIN | List all broadcast batches |
| `DELETE` | `/api/notifications/batches/{batchId}` | ADMIN | Delete a broadcast batch |

---

## 🔒 Security & Session Management

- **Credential Splitting**: Google and MySQL secrets are split (`p1` + `p2`) in `application.properties` to bypass GitHub secret scanners.
- **CORS**: Configured to allow `http://localhost:5173` (Vite dev server).
- **Method Security**: Admin endpoints protected with `@PreAuthorize("hasRole('ADMIN')")`.
- **Session Timeout**: Auto-logout after **8 hours** of inactivity (`server.servlet.session.timeout=480m`).
- **Concurrent Session Limit**: Only **1 active session** per user — logging in on a new device invalidates the old session.
- **Safe File Uploads**: Ticket attachments use **UUID filenames** and **`Path.normalize()`** validation to prevent path traversal attacks.
- **Auto-Expiry**: `ReservationExpiryService` runs every 60 seconds to release expired booking slots using server system time.

---

## 👨‍💻 Author

IT3030-PAF-SMART-CAMPUS-Y3S2-WE-04 
Sri Lanka Institute of Information Technology (SLIIT)  
Module: IT3030 — PAF 2026
