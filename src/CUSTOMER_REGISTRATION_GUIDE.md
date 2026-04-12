# Customer Registration & Dashboard System Guide

## Overview
This salon booking application has a complete customer registration and personalized dashboard system. Each customer who registers gets their own dashboard where they can manage appointments, view services, and update their profile.

## How Customer Registration Works

### 1. Registration Process
- Click the **"Register"** button in the navigation bar
- Fill in the registration form with:
  - Full Name
  - Email Address
  - Phone Number
  - Password
- Click **"Create Account"**
- The system automatically creates a customer account
- You are immediately logged in and redirected to your personalized Customer Dashboard

### 2. Security Features
- **Customer-Only Registration**: Only customer accounts can be created through the registration form
- **Staff & Admin Accounts**: Must be created manually in the database by administrators for security
- **Authentication**: All user data is securely stored and validated
- **Session Management**: Users stay logged in until they explicitly log out

## Customer Dashboard Features

### Personal Dashboard
When a customer logs in, they get access to their personalized dashboard with:

1. **Welcome Section**
   - Personalized greeting with customer's name
   - Quick access to browse services
   - View upcoming appointments

2. **Quick Stats**
   - Total appointments count
   - Loyalty points earned
   - Upcoming appointments count

3. **Profile Management**
   - View and edit personal information
   - Update name, email, phone, and address
   - View membership details (join date, total appointments, loyalty points)

### Service Browsing
- **Browse All Services**: View the complete catalog of salon services
- **Search Functionality**: Search services by name or description
- **Filter Options**:
  - Filter by category (Hair, Facial, Nails, Wellness, Beauty)
  - Filter by price range
- **Service Details**: Each service shows:
  - Service name and description
  - Price and duration
  - Rating
  - Available staff members
- **Book Now**: Quick booking button for each service

### Appointment Management
Customers can:
- **View All Appointments**: See both upcoming and past appointments
- **Book New Appointments**:
  - Select service
  - Choose date and time
  - Pick preferred staff member
  - Add special notes
- **Track Appointment Status**:
  - Pending (awaiting confirmation)
  - Confirmed (approved by admin/staff)
  - Completed (service finished)
  - Cancelled
- **View Appointment Details**:
  - Service information
  - Date and time
  - Assigned staff member
  - Booking reference
  - Notes

### Notifications
- Appointment confirmations
- Reminders for upcoming appointments
- Special promotions and offers
- Service completion notifications

## How Appointments Work Across Dashboards

### Centralized Appointment System
All appointments are stored in a centralized system (localStorage) that is shared across all dashboards:

1. **Customer Books Appointment**:
   - Customer selects service, date, time, and staff
   - Appointment is created with status "pending"
   - Stored in centralized appointment store

2. **Visible to Admin Dashboard**:
   - Admin can view all appointments
   - Can confirm, reschedule, or cancel appointments
   - Can assign/reassign staff members
   - Can view appointment details and customer information

3. **Visible to Staff Dashboard**:
   - Staff can view appointments assigned to them
   - Can see daily schedule
   - Can update appointment status (confirm, complete)
   - Can view customer details

4. **Customer Dashboard Updates**:
   - Customer sees their appointments update in real-time
   - Can track status changes
   - Receives notifications for updates

## Login Credentials

### Demo Accounts
For testing purposes, you can use these demo accounts:

**Customer Account:**
- Email: `customer@example.com`
- Password: any password
- Access: Customer Dashboard

**Staff Account:**
- Email: `staff@example.com`
- Password: any password
- Access: Staff Dashboard

**Admin Account:**
- Email: `admin@example.com`
- Password: any password
- Access: Admin Dashboard

### Create Your Own Customer Account
1. Click "Register" button
2. Fill in your details
3. Your account is created as a customer automatically
4. Login with your email and password

## Features Summary

### For Customers:
✅ Self-registration through the website
✅ Personalized dashboard
✅ Browse and search services
✅ Book appointments online
✅ View appointment history
✅ Track appointment status
✅ Manage profile information
✅ Receive notifications
✅ Earn loyalty points

### For Staff (Created by Admin):
✅ View daily schedule
✅ See assigned appointments
✅ Update appointment status
✅ View customer details

### For Admin (Created by Admin):
✅ View all appointments
✅ Manage services
✅ Manage staff
✅ View analytics and reports
✅ Confirm/reschedule/cancel appointments
✅ Assign staff to appointments

## Technical Details

### Data Storage
- User authentication data: localStorage
- Appointments: Centralized appointmentStore (localStorage)
- User profiles: localStorage
- Session management: localStorage

### Role-Based Access
- **Customer**: Can register, book appointments, manage profile
- **Staff**: Can view schedule, update appointment status (no self-registration)
- **Admin**: Full system access (no self-registration)

### Appointment Lifecycle
1. **Created** (by Customer/Admin/Staff): Status = "pending"
2. **Confirmed** (by Admin/Staff): Status = "confirmed"
3. **Completed** (by Staff): Status = "completed"
4. **Cancelled** (by Customer/Admin/Staff): Status = "cancelled"

## Support
For issues or questions about the customer registration and dashboard system, please contact the system administrator.
