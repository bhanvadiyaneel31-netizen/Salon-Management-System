# Salon Booking Backend API

A Node.js + Express + SQLite backend for the Salon Appointment Booking System.

## Quick Start

```bash
cd backend
npm start
```

Server runs on **http://localhost:5001**

## Demo Accounts

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Customer | customer@example.com     | password123 |
| Staff    | staff@example.com        | password123 |
| Admin    | admin@example.com        | password123 |
| Staff    | emma@salon.com           | password123 |
| Staff    | lisa@salon.com           | password123 |

## API Endpoints

| Method | Endpoint                          | Auth Required | Description            |
|--------|-----------------------------------|---------------|------------------------|
| POST   | /api/auth/register                | No            | Register customer      |
| POST   | /api/auth/login                   | No            | Login any role         |
| GET    | /api/auth/me                      | Yes           | Get current user       |
| GET    | /api/services                     | No            | List all services      |
| POST   | /api/services                     | Admin         | Create service         |
| PUT    | /api/services/:id                 | Admin         | Update service         |
| DELETE | /api/services/:id                 | Admin         | Soft delete service    |
| GET    | /api/staff                        | No            | List staff             |
| GET    | /api/staff/available              | No            | Available staff        |
| GET    | /api/appointments                 | Yes (RBAC)    | Get appointments       |
| POST   | /api/appointments                 | Yes           | Book appointment       |
| PATCH  | /api/appointments/:id/status      | Yes (RBAC)    | Update status          |
| POST   | /api/appointments/:id/review      | Customer      | Submit review          |
| GET    | /api/analytics/dashboard-stats    | Admin         | Dashboard stats        |
| GET    | /api/analytics/weekly-data        | Admin         | Weekly chart data      |
| GET    | /api/analytics/service-distribution | Admin       | Pie chart data         |
| GET    | /api/analytics/staff-performance  | Admin         | Staff metrics          |

## Project Structure

```
backend/
├── server.js              # Express app entry point
├── db.js                  # SQLite initialization + seed data
├── .env                   # Environment variables
├── salon.db               # SQLite database (auto-created)
├── middleware/
│   └── authMiddleware.js  # JWT verification + RBAC helpers
└── routes/
    ├── auth.js            # Authentication endpoints
    ├── services.js        # Services CRUD
    ├── staff.js           # Staff management
    ├── appointments.js    # Appointment booking + reviews
    └── analytics.js       # Admin analytics
```
