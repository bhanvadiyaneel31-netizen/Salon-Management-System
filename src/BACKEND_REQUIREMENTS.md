# Backend Requirements for Salon Appointment Booking System

**For Backend AI: Use this document to implement a backend API that works seamlessly with the frontend.**

---

## 🎯 Overview

You need to create a **RESTful API backend** that:
- Handles user authentication (JWT-based)
- Manages salon services (CRUD operations)
- Manages staff members and their assignments
- Handles appointment booking and management
- Provides analytics data for admin dashboard
- Enforces role-based access control

**Frontend is already built** and currently uses mock data. Once you implement this backend, the frontend will switch to using your API by changing one flag.

---

## 🔧 Technology Recommendations

You can use **any backend technology**, but here are recommendations:

### **Option 1: Flask (Python)** ⭐ Recommended
```bash
pip install flask flask-cors flask-sqlalchemy flask-jwt-extended bcrypt
```

### **Option 2: Express.js (Node.js)**
```bash
npm install express cors mongoose jsonwebtoken bcrypt
```

### **Option 3: FastAPI (Python)**
```bash
pip install fastapi uvicorn sqlalchemy python-jose passlib
```

### **Option 4: Django REST Framework**
```bash
pip install django djangorestframework djangorestframework-simplejwt
```

---

## 📦 Database Schema

### **Table 1: users**

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',  -- 'customer', 'staff', 'admin'
    loyalty_points INTEGER DEFAULT 0,
    reminder_email BOOLEAN DEFAULT 1,
    reminder_sms BOOLEAN DEFAULT 1,
    reminder_timing VARCHAR(10) DEFAULT '24h',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (role IN ('customer', 'staff', 'admin'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Important**: 
- `password_hash` must be hashed using bcrypt (never store plain text passwords)
- `role` can only be 'customer', 'staff', or 'admin'
- Registration API should ALWAYS create role='customer' (ignore frontend input)

### **Table 2: services**

```sql
CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,  -- in minutes
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (duration > 0),
    CHECK (price >= 0),
    CHECK (category IN ('Hair', 'Facial', 'Nails', 'Massage', 'Wellness', 'Beauty'))
);

-- Indexes
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);
```

### **Table 3: staff_profiles**

```sql
CREATE TABLE staff_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    specialty VARCHAR(100),
    rating DECIMAL(3, 2) DEFAULT 0.00,  -- 0.00 to 5.00
    is_available BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes
CREATE INDEX idx_staff_user ON staff_profiles(user_id);
CREATE INDEX idx_staff_available ON staff_profiles(is_available);
```

**Note**: Only users with role='staff' should have a staff_profile entry.

### **Table 4: staff_service_assignments**

```sql
CREATE TABLE staff_service_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    
    UNIQUE(staff_id, service_id)
);

-- Indexes
CREATE INDEX idx_staff_assignments_staff ON staff_service_assignments(staff_id);
CREATE INDEX idx_staff_assignments_service ON staff_service_assignments(service_id);
```

**Purpose**: Tracks which services each staff member can perform.

### **Table 5: appointments**

```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    staff_id INTEGER,  -- NULL means "any available staff"
    service_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'confirmed', 'completed', 'cancelled'
    notes TEXT,
    price DECIMAL(10, 2) NOT NULL,
    rating INTEGER,  -- 1 to 5 stars
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
    
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    CHECK (price >= 0),
    CHECK (rating >= 1 AND rating <= 5)
);

-- Indexes
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);
```

**Important**:
- `customer_id` must reference a user with role='customer'
- `staff_id` must reference a user with role='staff' (or NULL)
- `price` is copied from service at booking time (historical record)
- `updated_at` should be updated on every status change

---

## 🔌 API Endpoints Specification

### **Base URL**: `http://localhost:5000/api` (or your chosen port)

### **CORS Configuration**
Enable CORS for frontend (http://localhost:3000 or your frontend URL):
```python
# Flask example
from flask_cors import CORS
CORS(app, origins=['http://localhost:3000'])
```

---

## 🔐 Authentication Endpoints

### **POST /api/auth/register**

**Purpose**: Register new customer account (CUSTOMERS ONLY)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1 (555) 123-4567"
}
```

**Response (201 Created)**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "role": "customer",
    "loyalty_points": 0,
    "reminders": {
      "email": true,
      "sms": true,
      "timing": "24h"
    },
    "created_at": "2026-04-08T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
```json
// 400 - Email already exists
{ "error": "Email already registered" }

// 400 - Invalid input
{ "error": "Name, email, and password are required" }
```

**SECURITY RULE**: 
```python
# ALWAYS set role to 'customer', NEVER trust frontend input
user.role = 'customer'  # Hardcoded, ignore request body
```

---

### **POST /api/auth/login**

**Purpose**: Login for all user roles

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "role": "customer",
    "loyalty_points": 100,
    "reminders": {
      "email": true,
      "sms": true,
      "timing": "24h"
    },
    "created_at": "2026-04-08T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
```json
// 401 - Invalid credentials
{ "error": "Invalid email or password" }

// 400 - Missing fields
{ "error": "Email and password are required" }
```

**JWT Token**:
- Include user ID and role in token payload
- Set expiration (e.g., 24 hours)
- Example payload:
```json
{
  "user_id": 1,
  "role": "customer",
  "exp": 1680950400
}
```

---

### **POST /api/auth/logout**

**Purpose**: Logout user (optional, frontend handles this)

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

**Note**: Frontend removes token from localStorage. Backend can implement token blacklist if needed.

---

### **GET /api/auth/me**

**Purpose**: Get current user info (verify token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 (555) 123-4567",
  "role": "customer",
  "loyalty_points": 100,
  "reminders": {
    "email": true,
    "sms": true,
    "timing": "24h"
  },
  "created_at": "2026-04-08T10:30:00Z"
}
```

**Error Responses**:
```json
// 401 - Invalid/expired token
{ "error": "Invalid or expired token" }
```

---

## 💇 Services Endpoints

### **GET /api/services**

**Purpose**: Get all active services

**Query Parameters**:
- `category` (optional): Filter by category ('Hair', 'Facial', etc.)
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price

**Example**: `/api/services?category=Hair&max_price=100`

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "Hair Cut & Style",
    "description": "Professional cuts, coloring, and styling",
    "duration": 60,
    "price": 85.00,
    "category": "Hair",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Hair Coloring",
    "description": "Professional hair coloring service",
    "duration": 120,
    "price": 150.00,
    "category": "Hair",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### **POST /api/services**

**Purpose**: Create new service (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Request Body**:
```json
{
  "name": "Deep Tissue Massage",
  "description": "Therapeutic massage for muscle tension",
  "duration": 90,
  "price": 150.00,
  "category": "Massage"
}
```

**Response (201 Created)**:
```json
{
  "id": 7,
  "name": "Deep Tissue Massage",
  "description": "Therapeutic massage for muscle tension",
  "duration": 90,
  "price": 150.00,
  "category": "Massage",
  "is_active": true,
  "created_at": "2026-04-08T10:30:00Z"
}
```

**Error Responses**:
```json
// 403 - Not admin
{ "error": "Admin access required" }

// 400 - Invalid data
{ "error": "Name, duration, price, and category are required" }
```

---

### **PUT /api/services/:id**

**Purpose**: Update service (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Request Body** (partial update allowed):
```json
{
  "price": 95.00,
  "duration": 70,
  "description": "Updated description"
}
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Hair Cut & Style",
  "description": "Updated description",
  "duration": 70,
  "price": 95.00,
  "category": "Hair",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Error Responses**:
```json
// 403 - Not admin
{ "error": "Admin access required" }

// 404 - Service not found
{ "error": "Service not found" }
```

---

### **DELETE /api/services/:id**

**Purpose**: Soft delete service (set is_active=false) (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "message": "Service deleted successfully"
}
```

**Error Responses**:
```json
// 403 - Not admin
{ "error": "Admin access required" }

// 404 - Service not found
{ "error": "Service not found" }

// 409 - Has future appointments
{ "error": "Cannot delete service with future appointments" }
```

**Note**: Don't actually delete from database if there are appointments. Set `is_active = false` instead.

---

## 👥 Staff Endpoints

### **GET /api/staff**

**Purpose**: Get all staff members

**Response (200 OK)**:
```json
[
  {
    "id": 2,
    "name": "Emma Wilson",
    "email": "emma@salon.com",
    "phone": "+1 (555) 234-5678",
    "specialty": "Hair Styling",
    "rating": 4.9,
    "is_available": true,
    "created_at": "2026-01-15T00:00:00Z"
  },
  {
    "id": 3,
    "name": "Lisa Davis",
    "email": "lisa@salon.com",
    "phone": "+1 (555) 345-6789",
    "specialty": "Facial Treatments",
    "rating": 4.8,
    "is_available": true,
    "created_at": "2026-01-20T00:00:00Z"
  }
]
```

---

### **GET /api/staff/available**

**Purpose**: Get available staff for specific date and service

**Query Parameters**:
- `date` (required): Appointment date (YYYY-MM-DD)
- `service_id` (required): Service ID

**Example**: `/api/staff/available?date=2026-04-15&service_id=1`

**Response (200 OK)**:
```json
[
  {
    "id": 2,
    "name": "Emma Wilson",
    "email": "emma@salon.com",
    "specialty": "Hair Styling",
    "rating": 4.9,
    "is_available": true
  }
]
```

**Logic**:
1. Find staff assigned to this service (staff_service_assignments)
2. Filter by is_available=true
3. Exclude staff with conflicting appointments on that date
4. Return available staff sorted by rating (highest first)

---

### **GET /api/staff/:id/services**

**Purpose**: Get services assigned to a staff member

**Response (200 OK)**:
```json
{
  "staff": {
    "id": 2,
    "name": "Emma Wilson",
    "specialty": "Hair Styling"
  },
  "services": [
    {
      "id": 1,
      "name": "Hair Cut & Style",
      "category": "Hair"
    },
    {
      "id": 2,
      "name": "Hair Coloring",
      "category": "Hair"
    }
  ]
}
```

---

### **POST /api/staff/:id/assign-service**

**Purpose**: Assign service to staff (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Request Body**:
```json
{
  "service_id": 3
}
```

**Response (201 Created)**:
```json
{
  "message": "Service assigned successfully",
  "staff_id": 2,
  "service_id": 3
}
```

**Error Responses**:
```json
// 403 - Not admin
{ "error": "Admin access required" }

// 404 - Staff or service not found
{ "error": "Staff or service not found" }

// 409 - Already assigned
{ "error": "Service already assigned to this staff member" }
```

---

### **DELETE /api/staff/:id/remove-service**

**Purpose**: Remove service from staff (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Request Body**:
```json
{
  "service_id": 3
}
```

**Response (200 OK)**:
```json
{
  "message": "Service removed successfully"
}
```

---

## 📅 Appointments Endpoints

### **GET /api/appointments**

**Purpose**: Get appointments based on user role

**Headers**:
```
Authorization: Bearer <token>
```

**Behavior**:
- **Customer**: Returns only their appointments
- **Staff**: Returns appointments assigned to them
- **Admin**: Returns all appointments

**Query Parameters**:
- `status` (optional): Filter by status
- `date` (optional): Filter by date (YYYY-MM-DD)
- `date_from` (optional): Start date range
- `date_to` (optional): End date range

**Example**: `/api/appointments?status=pending&date_from=2026-04-01&date_to=2026-04-30`

**Response (200 OK)**:
```json
[
  {
    "id": 1,
    "customer": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 (555) 123-4567"
    },
    "staff": {
      "id": 2,
      "name": "Emma Wilson",
      "email": "emma@salon.com"
    },
    "service": {
      "id": 1,
      "name": "Hair Cut & Style",
      "duration": 60,
      "category": "Hair"
    },
    "appointment_date": "2026-04-15",
    "appointment_time": "10:00",
    "status": "pending",
    "notes": "First time customer",
    "price": 85.00,
    "created_at": "2026-04-08T10:30:00Z",
    "updated_at": "2026-04-08T10:30:00Z"
  }
]
```

---

### **GET /api/appointments/:id**

**Purpose**: Get single appointment details

**Headers**:
```
Authorization: Bearer <token>
```

**Authorization**:
- Customer can only view their own appointments
- Staff can view appointments assigned to them
- Admin can view all appointments

**Response (200 OK)**: Same format as single item in GET /api/appointments

**Error Responses**:
```json
// 403 - Not authorized
{ "error": "Not authorized to view this appointment" }

// 404 - Not found
{ "error": "Appointment not found" }
```

---

### **POST /api/appointments**

**Purpose**: Create new appointment

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "service_id": 1,
  "staff_id": 2,  // or null for "any available staff"
  "appointment_date": "2026-04-15",
  "appointment_time": "10:00",
  "notes": "First time customer"
}
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567"
  },
  "staff": {
    "id": 2,
    "name": "Emma Wilson"
  },
  "service": {
    "id": 1,
    "name": "Hair Cut & Style",
    "duration": 60
  },
  "appointment_date": "2026-04-15",
  "appointment_time": "10:00",
  "status": "pending",
  "notes": "First time customer",
  "price": 85.00,
  "created_at": "2026-04-08T10:30:00Z",
  "updated_at": "2026-04-08T10:30:00Z"
}
```

**Business Logic**:
1. Get customer_id from JWT token
2. Validate service exists and is active
3. Validate staff exists and is assigned to this service (if staff_id provided)
4. Check for time slot conflicts (staff can't have overlapping appointments)
5. Set price from service.price (at booking time)
6. Set status to 'pending'
7. Send confirmation email (optional)

**Error Responses**:
```json
// 400 - Invalid input
{ "error": "Service ID, date, and time are required" }

// 404 - Service not found
{ "error": "Service not found or inactive" }

// 409 - Time slot conflict
{ "error": "Staff is not available at this time" }

// 400 - Past date
{ "error": "Cannot book appointment in the past" }
```

---

### **PATCH /api/appointments/:id/status**

**Purpose**: Update appointment status

**Headers**:
```
Authorization: Bearer <token>
```

**Authorization**:
- Customer can cancel their own pending appointments
- Staff can confirm/complete appointments assigned to them
- Admin can change any appointment status

**Request Body**:
```json
{
  "status": "confirmed",
  "notes": "Confirmed via phone"
}
```

**Valid status transitions**:
- pending → confirmed (staff/admin)
- pending → cancelled (customer/staff/admin)
- confirmed → completed (staff/admin)
- confirmed → cancelled (staff/admin)

**Response (200 OK)**:
```json
{
  "id": 1,
  "status": "confirmed",
  "updated_at": "2026-04-08T11:00:00Z"
}
```

**Error Responses**:
```json
// 403 - Not authorized
{ "error": "Not authorized to update this appointment" }

// 400 - Invalid status transition
{ "error": "Cannot change status from completed to pending" }
```

---

### **POST /api/appointments/:id/review**

**Purpose**: Submit a rating and review for a completed appointment (CUSTOMER ONLY)

**Headers**:
```
Authorization: Bearer <customer_token>
```

**Request Body**:
```json
{
  "rating": 5,
  "review": "Great service! Lisa was very professional."
}
```

**Response (200 OK)**:
```json
{
  "message": "Review submitted successfully"
}
```

### **PATCH /api/appointments/:id**

**Purpose**: Update appointment details (reschedule, reassign staff) (ADMIN/STAFF ONLY)

**Headers**:
```
Authorization: Bearer <admin_or_staff_token>
```

**Request Body** (partial update):
```json
{
  "appointment_date": "2026-04-16",
  "appointment_time": "11:00",
  "staff_id": 3,
  "notes": "Rescheduled due to staff availability"
}
```

**Response (200 OK)**:
```json
{
  "id": 1,
  "appointment_date": "2026-04-16",
  "appointment_time": "11:00",
  "staff": {
    "id": 3,
    "name": "Lisa Davis"
  },
  "updated_at": "2026-04-08T11:00:00Z"
}
```

---

### **DELETE /api/appointments/:id**

**Purpose**: Permanently delete appointment (ADMIN ONLY)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "message": "Appointment deleted successfully"
}
```

**Error Responses**:
```json
// 403 - Not admin
{ "error": "Admin access required" }

// 404 - Not found
{ "error": "Appointment not found" }
```

**Note**: Consider soft delete (status='cancelled') instead of hard delete for audit trail.

---

## 📊 Analytics Endpoints (Admin Only)

### **GET /api/analytics/dashboard-stats**

**Purpose**: Get key metrics for admin dashboard

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
{
  "todayAppointments": 12,
  "todayRevenue": 1480.00,
  "activeStaff": 8,
  "growthRate": 15.2
}
```

**Calculation**:
- `todayAppointments`: Count of appointments where date = today
- `todayRevenue`: Sum of price for completed appointments today
- `activeStaff`: Count of staff where is_available=true
- `growthRate`: Percentage change in appointments vs last month

---

### **GET /api/analytics/weekly-data**

**Purpose**: Get weekly appointments and revenue

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
[
  { "day": "Mon", "appointments": 8, "revenue": 920.00 },
  { "day": "Tue", "appointments": 12, "revenue": 1340.00 },
  { "day": "Wed", "appointments": 10, "revenue": 1150.00 },
  { "day": "Thu", "appointments": 15, "revenue": 1680.00 },
  { "day": "Fri", "appointments": 18, "revenue": 2100.00 },
  { "day": "Sat", "appointments": 22, "revenue": 2750.00 },
  { "day": "Sun", "appointments": 14, "revenue": 1890.00 }
]
```

**Note**: Return data for the current week (Monday to Sunday).

---

### **GET /api/analytics/service-distribution**

**Purpose**: Get service bookings by category

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
[
  { "name": "Hair Services", "value": 45, "color": "#8b5cf6" },
  { "name": "Facial Treatments", "value": 25, "color": "#ec4899" },
  { "name": "Nail Care", "value": 20, "color": "#06b6d4" },
  { "name": "Massage", "value": 10, "color": "#10b981" }
]
```

**Calculation**:
- Group appointments by service category
- Count appointments per category
- Calculate percentage of total

---

### **GET /api/analytics/staff-performance**

**Purpose**: Get staff performance metrics

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
```json
[
  {
    "id": 2,
    "name": "Emma Wilson",
    "role": "Hair Stylist",
    "appointments": 28,
    "completed": 26,
    "revenue": 2210.00,
    "rating": 4.9,
    "completion_rate": 92.9
  },
  {
    "id": 3,
    "name": "Lisa Davis",
    "role": "Facial Specialist",
    "appointments": 22,
    "completed": 20,
    "revenue": 2400.00,
    "rating": 4.8,
    "completion_rate": 90.9
  }
]
```

**Calculation**:
- `appointments`: Total appointments assigned to staff
- `completed`: Appointments with status='completed'
- `revenue`: Sum of price for completed appointments
- `completion_rate`: (completed / appointments) * 100

---

## 🔒 Security Requirements

### **1. Password Hashing**
```python
# Use bcrypt with salt rounds >= 10
import bcrypt

# Hashing
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Verification
is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash)
```

### **2. JWT Token**
```python
# Token payload
{
  "user_id": 1,
  "role": "customer",
  "exp": 1680950400,  # Expiration timestamp
  "iat": 1680864000   # Issued at timestamp
}

# Token expiration: 24 hours recommended
```

### **3. Role-Based Access Control (RBAC)**

Implement middleware/decorator to check permissions:

```python
# Example: Python decorator
def require_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        user = verify_token(token)
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Usage
@app.route('/api/services', methods=['POST'])
@require_admin
def create_service():
    # ...
```

### **4. Input Validation**

Always validate:
- Email format (regex)
- Password strength (min 8 chars, alphanumeric)
- Date formats (YYYY-MM-DD)
- Time formats (HH:MM, 24-hour)
- Required fields are present
- Price/duration are positive numbers

### **5. SQL Injection Prevention**

Use parameterized queries or ORM:
```python
# ❌ DON'T DO THIS
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✅ DO THIS
query = "SELECT * FROM users WHERE email = ?"
cursor.execute(query, (email,))
```

### **6. Rate Limiting**

Implement rate limiting on:
- Login endpoint: 5 attempts per 15 minutes
- Registration endpoint: 3 attempts per hour
- All endpoints: 100 requests per minute per IP

---

## 🧪 Testing Requirements

### **Test Cases to Implement**

#### Authentication
- [ ] Register with valid data creates customer account
- [ ] Register with existing email returns error
- [ ] Login with valid credentials returns token
- [ ] Login with invalid credentials returns error
- [ ] Protected routes require valid token
- [ ] Expired token returns 401

#### Services
- [ ] Get all services returns active services
- [ ] Create service requires admin role
- [ ] Update service requires admin role
- [ ] Delete service with future appointments fails

#### Appointments
- [ ] Customer can create appointment
- [ ] Cannot book past dates
- [ ] Cannot book overlapping time slots
- [ ] Customer can view only their appointments
- [ ] Staff can view only assigned appointments
- [ ] Admin can view all appointments
- [ ] Status transitions follow business rules

#### Analytics
- [ ] Dashboard stats return correct calculations
- [ ] Only admin can access analytics endpoints

---

## 📝 Sample Data for Testing

### **Users**
```sql
-- Password: "password123" (hashed with bcrypt)
INSERT INTO users (name, email, password_hash, phone, role, loyalty_points) VALUES
('John Customer', 'customer@example.com', '$2b$10$...', '+1 (555) 123-4567', 'customer', 100),
('Sarah Staff', 'staff@example.com', '$2b$10$...', '+1 (555) 234-5678', 'staff', 0),
('Admin User', 'admin@example.com', '$2b$10$...', '+1 (555) 345-6789', 'admin', 0),
('Emma Wilson', 'emma@salon.com', '$2b$10$...', '+1 (555) 456-7890', 'staff'),
('Lisa Davis', 'lisa@salon.com', '$2b$10$...', '+1 (555) 567-8901', 'staff');
```

### **Services**
```sql
INSERT INTO services (name, description, duration, price, category) VALUES
('Hair Cut & Style', 'Professional cuts, coloring, and styling', 60, 85.00, 'Hair'),
('Hair Coloring', 'Professional hair coloring service', 120, 150.00, 'Hair'),
('Signature Facial', 'Rejuvenating facial care and treatments', 75, 120.00, 'Facial'),
('Gel Manicure', 'Professional manicure with gel polish', 45, 65.00, 'Nails'),
('Spa Pedicure', 'Relaxing pedicure treatment', 60, 75.00, 'Nails'),
('Relaxing Massage', 'Full body relaxation massage', 90, 180.00, 'Massage');
```

### **Staff Profiles**
```sql
-- Assuming Emma Wilson has user_id=4, Lisa Davis has user_id=5
INSERT INTO staff_profiles (user_id, specialty, rating, is_available) VALUES
(4, 'Hair Styling', 4.9, 1),
(5, 'Facial Treatments', 4.8, 1);
```

### **Staff Service Assignments**
```sql
-- Emma Wilson (staff_id=4) assigned to Hair services (1, 2)
INSERT INTO staff_service_assignments (staff_id, service_id) VALUES
(4, 1),
(4, 2),
(5, 3);
```

---

## 🚀 Deployment Checklist

### **Environment Variables**
```bash
# .env file
DATABASE_URL=sqlite:///salon.db  # or PostgreSQL URL
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
FLASK_ENV=development  # or production
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### **Before Going Live**
- [ ] Change default passwords for demo accounts
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set secure JWT secret keys
- [ ] Configure CORS for production domain only
- [ ] Enable logging and monitoring
- [ ] Set up automated backups
- [ ] Implement rate limiting
- [ ] Add email notifications (SendGrid, Mailgun)
- [ ] Add SMS notifications (Twilio) - optional

---

## 📞 Frontend Integration

Once your backend is ready:

1. Start your backend server (e.g., `python app.py`)
2. Ensure it runs on `http://localhost:5000`
3. In frontend, open `/services/api.ts`
4. Change `const USE_REAL_API = false;` to `const USE_REAL_API = true;`
5. Frontend will now make HTTP requests to your backend

**That's it!** The frontend is already built to work with your API.

---

## 🆘 Support

If you have questions about:
- **Expected API behavior**: Re-read the endpoint specifications above
- **Data structures**: Check the database schema section
- **Security**: Follow the security requirements section
- **Testing**: Implement the test cases listed

**Remember**: The frontend is already complete and waiting for your backend. Just implement the endpoints as specified, and everything will work seamlessly!

---

**Last Updated**: April 8, 2026  
**Frontend Documentation**: See `/COMPLETE_PROJECT_GUIDE.md`  
**Quick Reference**: See `/AI_CONTEXT_GUIDE.md`
