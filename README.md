# Bella Salon - Appointment Booking System 💇‍♀️💅

A full-stack salon appointment booking system that allows customers to book, reschedule, and manage appointments while enabling admins and staff to manage services, staff, and operations efficiently.

---

## 🚀 Features

### 👤 Customer Features
*   **Authentication**: Register and Login via Email or Google OAuth.
*   **Booking**: Book appointments for specific services and staff members.
*   **Rescheduling**: Change the date and time of existing pending appointments.
*   **Dashboard**: View upcoming and past appointments, loyalty points, and notifications.
*   **Notifications**: Receive real-time in-app alerts and professional email confirmations.

### 👨‍🔧 Staff Features
*   **Personal Dashboard**: View assigned appointments for the day/week.
*   **Status Management**: Update appointments to "Confirmed", "Completed", or "Cancelled".
*   **Profile Management**: Update name, email, phone, and profile image.
*   **Performance Tracking**: View personal ratings and completed appointment counts.

### 👨‍💼 Admin Features
*   **Service Management**: Full CRUD (Create, Read, Update, Delete) for salon services with image uploads.
*   **Staff Management**: Manage the staff roster, assign primary categories, and control availability.
*   **Analytics**: Real-time dashboard stats showing revenue, appointment growth, and service distribution.
*   **Reporting**: Generate and export reports (Daily, Weekly, Monthly) in PDF and Excel formats.
*   **Global Overview**: Monitor all appointments across the entire salon.

---

## ⏱ Booking Rules & Logic
*   **Future-Only**: Appointments can only be booked or rescheduled for future dates/times.
*   **Business Hours**: Operational hours are strictly enforced from **10:00 AM to 9:00 PM**.
*   **Smart Slotting**: Time slots are dynamically generated based on the specific **service duration**.
*   **No Double Booking**: Staff availability is checked in real-time to prevent overlapping appointments.
*   **Staff Integrity**: Bookings are only allowed for active staff members assigned to the relevant service category.

---

## 🛠 Tech Stack
*   **Frontend**: React.js, Tailwind CSS, Lucide React, Shadcn UI
*   **Backend**: Node.js, Express.js
*   **Database**: SQLite (Persistent & Embedded)
*   **Authentication**: JWT (JSON Web Tokens) & Google OAuth 2.0
*   **Email System**: Nodemailer with SMTP (Gmail Integration)
*   **Reports**: ExcelJS & PDFKit

---

## 📂 Folder Structure
```text
/
├── backend/            # Express Server
│   ├── routes/         # API Route Definitions
│   ├── middleware/     # Auth & RBAC Logic
│   ├── services/       # Email & Helper Services
│   ├── uploads/        # Service & Profile Images
│   └── salon.db        # SQLite Database
├── src/                # React Frontend
│   ├── components/     # UI Components & Dashboards
│   ├── services/       # API Client (Axios)
│   └── assets/         # Static Images & Styles
└── public/             # Static Assets
```

---

## ⚙️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd salon-booking-system
    ```

2.  **Install dependencies**:
    ```bash
    # Root (Frontend)
    npm install
    
    # Backend
    cd backend
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the `/backend` directory:
    ```env
    PORT=5001
    JWT_SECRET=your_jwt_secret
    
    # Email Config
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-app-password
    
    # Google OAuth
    GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your-secret
    ```

4.  **Run the Project**:
    ```bash
    # Start Backend (from /backend)
    npm start
    
    # Start Frontend (from root)
    npm run dev
    ```

---

## 🔗 API Overview
*   `POST  /api/auth/login` - Authenticate user
*   `POST  /api/appointments` - Create new booking
*   `PATCH /api/appointments/:id/reschedule` - Update appointment time
*   `PATCH /api/appointments/:id/status` - Update status (Staff/Admin)
*   `GET   /api/analytics/dashboard-stats` - Get admin metrics
*   `POST  /api/reports/export` - Export PDF/Excel reports

---

## 📧 Email System
Automated emails are sent for the following events:
1.  **Booking**: Confirmation of a new appointment.
2.  **Confirmation**: When staff accepts the booking.
3.  **Completion**: Thank you email after the service.
4.  **Cancellation**: Notification of a cancelled appointment.
5.  **Reschedule**: Alert with the new updated time and date.

---

## 🛡 Security & Integrity
*   **RBAC**: Strict Role-Based Access Control ensures users can only access data relevant to their role.
*   **Input Validation**: Backend validation for all dates, times, and staff assignments.
*   **Secure Auth**: Passwords are hashed using Bcrypt, and tokens are handled via JWT.
*   **Single Source of Truth**: All UI states are synchronized with the SQLite database.

---

## 🔮 Future Improvements
*   **Payment Integration**: Secure online payments via Stripe or PayPal.
*   **SMS Alerts**: Real-time SMS/WhatsApp reminders for appointments.
*   **AI Scheduling**: Intelligent staff assignment based on specialty and workload.
*   **Advanced Analytics**: Customer retention and service popularity trends.

---
© 2026 Bella Salon. All rights reserved.