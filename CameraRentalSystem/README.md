# Camera Rental System

Web application for renting cameras built with Node.js + Express (EJS) using **PostgreSQL 100%** (Sequelize).

## How to Run (Postgres-only)

### 1) Prerequisites
- **Node.js** (LTS recommended)
- **PostgreSQL** running locally (or reachable)

### 2) Create database
Create a database (example name: `camera_rental`).

### 3) Configure environment variables
This app reads config from **repo root** `.env` (not inside `CameraRentalSystem/`).

1. Copy `.env.example` at repo root to `.env`
2. Fill these values (minimum required):

```env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=camera_rental
DB_USER=postgres
DB_PASSWORD=YOUR_PG_PASSWORD

SESSION_SECRET=replace-with-a-long-random-string

# First run only (seeds initial admin if none exists)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@camera.com
ADMIN_PASSWORD=change-this-strong-password
```

> First time you run after schema changes, you may temporarily set `DB_SYNC_ALTER=true` in `.env` to let Sequelize add columns automatically. Keep it `false` afterwards.

### 4) Install dependencies
Install dependencies at the **repo root**:

```bash
cd ..
npm install
```

### 5) Start the server
Option A (recommended, from repo root):

```bash
npm start
```

Option B (from `CameraRentalSystem/`, still requires root deps installed):

```bash
node app.js
```

### 6) Open the app
Go to `http://localhost:3000`

## Features
- Browse/search cameras
- Sign-in / Sign-up
- Booking flow (confirm + payment confirm)
- Admin dashboard + account management + media manager

## PostgreSQL SQL API (Optional - disabled by default)

This is for pgAdmin/SQL demo endpoints. Enable with:

```bash
set ENABLE_PG_REALTIME=true
```

Endpoints (admin-only):
- `GET /api/sql/health`
- `GET /api/sql/revenue-daily`
- `GET /api/sql/active-rentals`
