# Prescripto - Doctor Appointment Booking Platform

A complete, production-ready **MERN** (MongoDB, Express, React, Node) doctor appointment booking platform. Patients can discover doctors, view real-time availability and book appointments; doctors manage their profile, availability and appointments; admins manage the entire platform - all backed by a real REST API and MongoDB database.

> Every important action flows through the full stack:
> **React UI -> Axios -> Express route -> auth middleware -> role middleware -> controller -> service -> MongoDB -> API response -> UI update -> toast.**

---

## Table of contents

- Features
- Architecture
- Technology stack
- Project structure
- Prerequisites
- Installation
- Environment variables
- Database setup & seeding
- Running locally
- Demo accounts
- API overview
- Roles & authorization
- Appointment & timezone strategy
- Cloudinary & email (optional)
- Responsive design
- Deployment

---

## Features

### Patient
- Register / login / logout with JWT
- Edit profile, upload profile image, change password
- Browse, search and filter doctors (by specialty, availability, fee)
- View doctor details (biography, qualification, experience, fee, availability)
- Select an appointment date and time slot and book for real
- View upcoming / completed / cancelled appointments, view details, cancel
- Booking confirmation via toast; freed slots become bookable again

### Doctor
- Dashboard with real statistics (today, upcoming, completed, cancelled, patients, earnings)
- Edit profile (specialty, degree, experience, biography, fee, address, photo)
- Configure weekly availability (per-day enable + start/end time)
- View and manage appointments - mark completed or cancel
- Can only ever modify their own record and appointments

### Admin
- Dashboard with live database statistics (doctors, patients, appointments, revenue)
- Manage doctors: add, edit, deactivate, reactivate, delete
- Manage patients: search, view details and full appointment history
- Manage appointments: search, filter by status, cancel, complete
- Manage specialties: add, edit, activate/deactivate, delete

### Platform
- JWT authentication with AuthContext persistence across refreshes
- Role-based route protection on both frontend and backend
- Double-booking prevention via a MongoDB unique partial index
- Dynamic date and time-slot generation (never hardcoded)
- Centralized error handling with consistent JSON responses
- Rate limiting, Helmet, CORS, bcrypt, input validation
- Loading states, empty states, skeletons and toast notifications
- Optional Cloudinary image storage and Nodemailer email, both with local fallbacks

---

## Architecture

```
frontend (React + Vite)  --HTTP/JSON-->  backend (Express)  --Mongoose-->  MongoDB
        AuthContext                          routes -> controllers
        Axios instance                       middleware (auth, role, rate limit)
        Protected / Role routes              services (business logic)
        React Router                         models (User, Doctor, Appointment, Specialty)
```

The backend follows a clean separation of concerns: **routes** define endpoints, **controllers** validate and shape requests, **services** hold business logic, and **models** own the schema and constraints.

---

## Technology stack

**Frontend:** React 18, Vite 5, React Router DOM 6, Tailwind CSS 3, Axios, React Icons, React Toastify, Context API.

**Backend:** Node.js, Express 4, MongoDB, Mongoose 8, JSON Web Tokens, bcryptjs, Helmet, CORS, express-rate-limit, express-validator, Multer, Cloudinary, Nodemailer.

---

## Project structure

```
doctor-appointment-platform/
  backend/
    config/           db.js, cloudinary.js
    controllers/      auth, doctor, appointment, user, admin, specialty, upload
    middleware/       authMiddleware, roleMiddleware, errorMiddleware, validate, rateLimiter, upload
    models/           User, Doctor, Appointment, Specialty
    routes/           auth, doctor, appointment, user, admin, specialty, upload
    services/         appointmentService, doctorService, emailService
    utils/            generateToken, slotGenerator
    seeds/            seed.js
    server.js
  frontend/
    src/
      components/     Navbar, Footer, Hero, SpecialtyCard, DoctorCard, DoctorGrid,
                      DateSelector, TimeSlotSelector, AppointmentSlots,
                      ProtectedRoute, RoleRoute, AdminLayout, Loading, Skeleton, EmptyState, Modal
      pages/          Home, Doctors, DoctorDetails, About, Contact, Login, Register,
                      ForgotPassword, ResetPassword, Profile, MyAppointments, NotFound
        doctor/       DoctorDashboard, DoctorProfile, DoctorAppointments, DoctorAvailability
        admin/        AdminLogin, AdminDashboard, AdminDoctors, AddDoctor,
                      AdminPatients, AdminAppointments, AdminSpecialties
      context/        AuthContext.jsx
      services/       api.js
      utils/          roles.js, format.js
      App.jsx
      main.jsx
  .gitignore
  package.json
  README.md
```

---

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB 6+ running locally, or a MongoDB Atlas connection string

---

## Installation

```bash
# 1. Clone and install everything from the root
npm run install:all

# 2. Create the backend environment file
cp backend/.env.example backend/.env

# 3. Edit backend/.env (see Environment variables below)

# 4. Seed the database
npm run seed

# 5. Start both apps in development
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5001 (health: /api/health)

---

## Environment variables

`backend/.env`:

```ini
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/doctor_appointment
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=no-reply@doctorappointment.test
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThis123!
ADMIN_NAME=Super Admin
```

`frontend/.env` (optional - leave empty to use the Vite dev proxy):

```ini
VITE_API_URL=
```

> Never commit real `.env` files. `.gitignore` already excludes them.

---

## Database setup & seeding

The seed script clears and repopulates the database with fictional data:

- 1 admin account
- 3 patients
- 15 doctors across 6 specialties
- 6 specialties
- Realistic weekly availability for every doctor
- 1 sample appointment

```bash
npm run seed
```

---

## Running locally

From the project root:

```bash
npm run dev          # runs backend + frontend together (concurrently)
npm run dev:backend  # backend only  (nodemon)
npm run dev:frontend # frontend only (vite)
```

Other scripts:

```bash
npm run build   # production build of the frontend
npm run start   # start the backend in production mode
npm run seed    # reseed the database
```

---

## Demo accounts (from the seed script)

| Role    | Email                              | Password        |
|---------|------------------------------------|-----------------|
| Admin   | admin@example.com                  | ChangeThis123!  |
| Patient | john.carter@example.com            | Password123!    |
| Doctor  | drrichardjames@doctor.example.com  | Doctor123!      |

> All doctors share the `Doctor123!` password (e.g. `dremilylarson@doctor.example.com`, `drsarahpatel@doctor.example.com`, ...).

---

## API overview

All responses use a consistent envelope:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Auth |
| GET  | /api/auth/me | Auth |
| POST | /api/auth/forgot-password | Public |
| POST | /api/auth/reset-password/:token | Public |

### Doctors & availability
| Method | Endpoint | Access |
|--------|----------|--------|
| GET    | /api/doctors | Public (search, specialty, available, minFee, maxFee, page, limit) |
| GET    | /api/doctors/:id | Public |
| GET    | /api/doctors/specialty/:specialty | Public |
| GET    | /api/doctors/:id/availability?date=YYYY-MM-DD | Public |
| PUT    | /api/doctors/:id/availability | Doctor (self) or Admin |
| POST   | /api/doctors | Admin |
| PUT    | /api/doctors/:id | Admin, or Doctor (self) |
| DELETE | /api/doctors/:id | Admin |

### Appointments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST  | /api/appointments | Patient |
| GET   | /api/appointments/my | Patient |
| GET   | /api/appointments/doctor | Doctor |
| GET   | /api/appointments/all | Admin |
| GET   | /api/appointments/:id | Owner or Admin |
| PATCH | /api/appointments/:id/cancel | Owner or Admin |
| PATCH | /api/appointments/:id/complete | Doctor (owner) or Admin |

### Users, admin & specialties
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users/profile | Auth |
| PUT | /api/users/profile | Auth |
| PUT | /api/users/change-password | Auth |
| POST | /api/uploads/image | Auth |
| GET | /api/admin/dashboard | Admin |
| GET | /api/admin/patients | Admin |
| GET | /api/admin/patients/:id | Admin |
| GET | /api/admin/doctors | Admin |
| PATCH | /api/admin/doctors/:id/status | Admin |
| GET | /api/admin/appointments | Admin |
| GET | /api/specialties | Public |
| POST | /api/specialties | Admin |
| PUT | /api/specialties/:id | Admin |
| DELETE | /api/specialties/:id | Admin |

---

## Roles & authorization

Three roles: **patient**, **doctor**, **admin**. The JWT contains `userId` and `role`. The backend never trusts the frontend's idea of a role - it re-reads the user from the database on every request and applies `requireAuth` + `requireRole(...)` middleware.

Key guarantees:
- A patient requesting an admin endpoint receives **403 Forbidden**.
- A doctor can only read/modify **their own** doctor record and appointments.
- A patient can only read/cancel **their own** appointments.
- Expired or invalid JWTs are rejected with **401**.

---

## Appointment & timezone strategy

To avoid timezone drift between browser and server:

- Dates are stored as normalized `YYYY-MM-DD` strings.
- Times are stored as normalized 24-hour `HH:mm` strings.
- All slot math is performed on plain strings / UTC parts, never on browser-local `Date` objects.

**Double-booking protection** uses a MongoDB unique partial index:

```js
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["booked", "completed"] } } }
);
```

If two users book the same slot simultaneously, MongoDB rejects the second insert with a duplicate-key error (code 11000), which the service converts into a `409 Conflict` with the message *"This appointment slot is no longer available."* Cancelled appointments are excluded from the index, so cancelling frees the slot again.

Slots are generated every 30 minutes from each doctor's weekly availability, then filtered to remove past times and already-booked times.

---

## Cloudinary & email (optional)

Both integrations are **optional** and degrade gracefully:

- **Images:** if `CLOUDINARY_*` variables are set, uploads go to Cloudinary. Otherwise images are written to `backend/uploads/` and served from `/uploads/<file>` (perfect for local development).
- **Email:** if `SMTP_*` variables are set, booking/cancellation emails are sent via Nodemailer. Otherwise emails are skipped (logged) and the app keeps working. In development, the forgot-password endpoint returns a `devResetUrl` so the reset flow can be tested without SMTP.

---

## Responsive design

The UI is built to work from large desktops down to small phones (1440 / 1280 / 1024 / 768 / 480 / 390 / 375 px):

- Navbar collapses into a hamburger menu.
- Doctor grids reflow from 4 columns to 2 and 1.
- Date and time-slot selectors scroll horizontally on mobile.
- Admin sidebar becomes a collapsible panel and tables scroll horizontally.
- Dashboards and forms stack into a single column.

---

## Deployment

### Backend (e.g. Render, Railway, Fly.io)
1. Set environment variables (never hardcode secrets).
2. Use a managed MongoDB (Atlas) connection string in `MONGODB_URI`.
3. Set `CLIENT_URL` to your deployed frontend origin for CORS.
4. Start command: `npm start` (or `node server.js`).

### Frontend (e.g. Vercel, Netlify)
1. Set `VITE_API_URL` to your deployed backend URL (e.g. `https://api.example.com`).
2. Build command: `npm run build`; output directory: `dist`.
3. Enable SPA fallback (rewrite all routes to `index.html`).

### Security checklist
- Strong random `JWT_SECRET`
- `NODE_ENV=production`
- Restrictive CORS via `CLIENT_URL`
- Rotate database and Cloudinary credentials
- Keep `.env` files out of version control

---

## License

Released for educational and portfolio purposes. All seed data is fictional.
