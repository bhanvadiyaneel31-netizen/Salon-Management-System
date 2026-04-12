# Salon Appointment Booking System - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Structure](#architecture--structure)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Data Flow & State Management](#data-flow--state-management)
7. [Key Components](#key-components)
8. [Backend Integration](#backend-integration)
9. [Bug Fixes & Improvements](#bug-fixes--improvements)
10. [Responsive Design](#responsive-design)
11. [How to Explain to AI Models](#how-to-explain-to-ai-models)

---

## 🎯 Project Overview

This is a **complete salon appointment booking website** with a modern, elegant UI/UX design. It's a full-stack application that allows customers to book salon appointments online while providing staff and administrators with tools to manage bookings, services, and view analytics.

### Design Philosophy
- **Soft pastel color scheme**: Lavender (#8b5cf6), Pink (#ec4899), White (#ffffff)
- **Rounded corners**: Using Tailwind's rounded utilities
- **Minimalistic elements**: Clean, uncluttered design
- **Poppins font**: Modern, friendly typography
- **Fully responsive**: Works on desktop, tablet, and mobile devices
- **Professional yet welcoming**: Balance between business and approachability

---

## 🛠 Technology Stack

### Frontend (React + TypeScript)
| Technology | Purpose | Version/Details |
|-----------|---------|-----------------|
| **React** | UI Framework | Functional components with Hooks |
| **TypeScript** | Type Safety | Strict typing throughout |
| **Tailwind CSS v4** | Styling | Utility-first CSS framework |
| **Lucide React** | Icons | Modern icon library |
| **date-fns** | Date Formatting | Date manipulation and formatting |
| **Recharts** | Data Visualization | Charts for admin analytics |
| **Sonner** | Toast Notifications | User feedback system |
| **shadcn/ui** | UI Components | Pre-built accessible components |

### State Management
- **React useState** for local component state
- **localStorage** for persistent data (user sessions, appointments)
- **Custom hooks** (useAuth, useApi) for reusable logic
- **Centralized appointment store** (`appointmentStore.ts`)

### Backend (Flask - Documentation Provided)
| Technology | Purpose |
|-----------|---------|
| **Flask** | Python web framework |
| **Flask-SQLAlchemy** | ORM for database operations |
| **Flask-JWT-Extended** | Authentication & authorization |
| **Flask-CORS** | Cross-origin resource sharing |
| **SQLite/PostgreSQL** | Database (configurable) |
| **bcrypt** | Password hashing |

---

## 🏗 Architecture & Structure

### Project File Structure
```
/
├── App.tsx                          # Main application entry point
├── components/
│   ├── HomePage.tsx                 # Landing page with hero banner
│   ├── ServicesPage.tsx             # Service catalog
│   ├── BookingPage.tsx              # Step-by-step booking flow
│   ├── AuthPages.tsx                # Login/Register forms
│   ├── Navigation.tsx               # Responsive navigation bar
│   ├── CustomerDashboard.tsx        # Customer dashboard
│   ├── StaffDashboard.tsx           # Staff scheduling dashboard
│   ├── AdminDashboard.tsx           # Admin management dashboard
│   ├── ManageServicePanel.tsx       # Service management for admin
│   └── ui/                          # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── calendar.tsx
│       ├── chart.tsx
│       └── ... (40+ UI components)
├── services/
│   ├── api.ts                       # API calls & mock data
│   └── appointmentStore.ts          # Centralized appointment management
├── hooks/
│   └── useAuth.ts                   # Authentication hooks
├── styles/
│   └── globals.css                  # Global styles & Tailwind config
└── backend-docs/                    # Flask backend documentation
    ├── authentication-rules.md
    ├── flask-api-structure.md
    └── database-schema-updates.md
```

### Application Flow
```
User Opens App
    ↓
Navigation Bar (Always Visible)
    ↓
Landing Page (HomePage)
    ↓
User Chooses Action:
    ├── Browse Services → ServicesPage
    ├── Book Appointment → BookingPage
    │   └── Requires Login → AuthPages
    ├── Login → AuthPages (Login)
    │   └── Role-Based Redirect:
    │       ├── Customer → CustomerDashboard
    │       ├── Staff → StaffDashboard
    │       └── Admin → AdminDashboard
    └── Register → AuthPages (Register)
        └── Auto-creates Customer Account
            └── Redirects to CustomerDashboard
```

---

## 🎨 Core Features

### 1. **Landing Page (HomePage)**
- **Hero Banner**: Eye-catching introduction with CTA buttons
- **Service Highlights**: Featured services with images
- **Why Choose Us**: Benefits and unique selling points
- **How It Works**: Step-by-step booking process explanation
- **Testimonials**: Customer reviews and ratings
- **Call to Action**: Prominent booking buttons

### 2. **Service Catalog (ServicesPage)**
- **Complete Service Listing**: All available salon services
- **Search Functionality**: Real-time search by name/description
- **Category Filters**: Hair, Facial, Nails, Wellness, Beauty
- **Price Range Filter**: Find services within budget
- **Service Cards Display**:
  - Service name and description
  - Duration (in minutes)
  - Price (in dollars)
  - Star rating
  - "Book Now" button
- **Responsive Grid Layout**: Adapts to screen size

### 3. **Booking Flow (BookingPage)**
A **4-step wizard** for appointment booking:

#### Step 1: Select Service
- Grid of service cards with details
- Visual selection feedback
- Continue when service selected

#### Step 2: Choose Date & Time
- Interactive calendar (date-fns calendar component)
- Disable past dates
- Time slot selection (9 AM - 6 PM, 30-min intervals)
- Visual indication of selected time

#### Step 3: Select Staff Member
- List of available staff with specialties
- "Any Available Staff" option
- Staff rating display

#### Step 4: Confirmation
- Review all booking details
- Add optional notes
- Final confirmation button
- Creates appointment in centralized store
- Shows success message and redirects to dashboard

### 4. **Authentication System (AuthPages)**

#### Login
- Email and password fields
- "Remember me" checkbox
- Role-based dashboard redirect
- Demo account credentials displayed

#### Register (Customer Only)
- Name, email, phone, password fields
- **Security**: Only creates customer accounts
- Staff/Admin accounts must be created in database
- Auto-login after registration
- Redirect to Customer Dashboard

### 5. **Customer Dashboard**
Personalized dashboard for each customer with multiple tabs:

#### Overview Tab
- Welcome message with customer name
- Quick stats cards:
  - Total appointments
  - Loyalty points
  - Upcoming appointments
- Quick action buttons (Browse Services, Book Appointment)
- Upcoming appointments list with status badges

#### Services Tab
- Browse all services with search
- Category filters (All, Hair, Facial, Nails, Wellness)
- Service cards with "Book Now" button
- Responsive grid layout

#### Appointments Tab
- View all appointments (upcoming & past)
- Status filter: All, Upcoming, Completed, Cancelled
- Appointment cards showing:
  - Service name and description
  - Date and time
  - Assigned staff member
  - Status badge (color-coded)
  - Price
  - Booking reference
  - Notes
- Action buttons (View Details, Cancel if pending)

#### Profile Tab
- View/Edit personal information
- Form fields: Name, Email, Phone, Address
- Membership information card:
  - Join date
  - Total appointments
  - Loyalty points
  - Membership status
- Save changes button

### 6. **Staff Dashboard**
Dashboard for staff members to manage their schedule:

- **Today's Schedule**: Appointments for current day
- **Daily Appointments List**:
  - Customer name and contact
  - Service details
  - Appointment time
  - Status indicator
  - Update status buttons (Confirm, Complete, Cancel)
- **Quick Stats**:
  - Today's appointments count
  - Completed today
  - Pending confirmations
- **Profile Management**: View/edit staff profile

### 7. **Admin Dashboard**
Comprehensive management dashboard with analytics:

#### Overview Tab
- **Key Metrics Cards**:
  - Today's appointments
  - Today's revenue
  - Active staff count
  - Growth rate percentage
- **Weekly Performance Chart** (Recharts):
  - Line/Bar chart showing appointments and revenue by day
- **Service Distribution Pie Chart**:
  - Visual breakdown of service categories
- **Staff Performance Table**:
  - Staff name, role, appointments, rating
  - Sortable columns

#### Manage Services Tab
- **Service List Table**:
  - All services with details
  - Edit/Delete buttons
- **Add New Service Form**:
  - Name, description, category
  - Duration (minutes)
  - Price
  - Add button
- **Edit Service Modal**:
  - Update existing service details
  - Save/Cancel buttons

#### Manage Appointments Tab
- **All Appointments Table**:
  - Customer info
  - Staff assigned
  - Service details
  - Date and time
  - Status
  - Actions (Edit, Delete, Change Status)
- **Status Update**:
  - Pending → Confirmed → Completed
  - Cancel option
- **Reschedule Functionality**:
  - Change date/time
  - Reassign staff
- **Filter Options**:
  - By status
  - By date range
  - By staff member

#### Manage Staff Tab
- **Staff List**:
  - Name, email, specialty
  - Status (Active/Inactive)
  - Rating
  - Service assignments
- **Assign Services to Staff**:
  - Multi-select service assignment
  - Update assignments

#### Reports Tab
- **Service Performance Report**:
  - Bookings, revenue, completion rate
- **Staff Workload Report**:
  - Hours worked, appointments, revenue generated
- **Export Options** (future enhancement)

---

## 👥 User Roles & Permissions

### Customer Role
**How to Create**: Self-registration through `/register` page

**Permissions**:
- ✅ Register and create account
- ✅ Login/Logout
- ✅ Browse services
- ✅ Book appointments
- ✅ View own appointments
- ✅ Update own profile
- ✅ Cancel own appointments (pending only)
- ❌ Cannot access staff/admin dashboards
- ❌ Cannot modify other users' data

**Dashboard**: CustomerDashboard
- Overview of personal appointments
- Service browsing
- Appointment management
- Profile editing

### Staff Role
**How to Create**: Manual database insertion by admin

**Permissions**:
- ✅ Login/Logout
- ✅ View assigned appointments
- ✅ Update appointment status (confirm, complete)
- ✅ View customer details
- ✅ View own schedule
- ❌ Cannot access customer registration
- ❌ Cannot access admin features
- ❌ Cannot delete appointments

**Dashboard**: StaffDashboard
- Daily schedule view
- Appointment status updates
- Customer information

### Admin Role
**How to Create**: Manual database insertion

**Permissions**:
- ✅ Full system access
- ✅ View all appointments
- ✅ Manage services (create, edit, delete)
- ✅ Manage staff (view, assign services)
- ✅ Confirm/reschedule/cancel any appointment
- ✅ Assign staff to appointments
- ✅ View analytics and reports
- ✅ Manage service categories
- ❌ Cannot access customer registration

**Dashboard**: AdminDashboard
- Complete system overview
- All management panels
- Analytics and reporting

### Security Rules
```
Registration Route (/register):
    → Only creates CUSTOMER accounts
    → Staff/Admin role requests are IGNORED
    → Backend enforces role: "customer"

Login Route (/login):
    → All roles can login
    → Role-based redirect after authentication

Authentication:
    → JWT tokens (Flask backend)
    → localStorage for session (Mock mode)
    → Token required for protected routes
```

---

## 🔄 Data Flow & State Management

### Centralized Appointment Store (`appointmentStore.ts`)

This is the **core innovation** of the project - a centralized localStorage-based appointment management system.

#### Why Centralized?
- **Shared Data**: All dashboards see the same appointments
- **Real-time Updates**: Changes in one dashboard reflect in others
- **Customer Bookings Visible Everywhere**: Appointments booked by customers appear in Admin and Staff dashboards
- **No API Required for Demo**: Works without backend connection

#### Structure
```typescript
interface AppointmentStore {
  id: string;                    // Unique ID (APT + timestamp)
  customer_id: number;           // User who booked
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  staff_id: number | null;       // Assigned staff (null = any available)
  staff_name: string | null;
  service_id: number;            // Service details
  service_name: string;
  service_duration: number;      // In minutes
  service_price: number;         // In dollars
  appointment_date: string;      // YYYY-MM-DD format
  appointment_time: string;      // HH:MM format
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;                // Optional customer notes
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  booked_by: 'customer' | 'admin' | 'staff';
}
```

#### Key Functions
```typescript
// Retrieval
getAllAppointments()              // Get all appointments
getAppointmentsByCustomer(id)     // Filter by customer
getAppointmentsByStaff(id)        // Filter by staff
getAppointmentsByDate(date)       // Filter by date
getAppointmentById(id)            // Get single appointment

// Creation & Updates
createAppointment(data)           // Create new appointment
updateAppointment(id, updates)    // Update existing
updateAppointmentStatus(id, status) // Change status
cancelAppointment(id)             // Set status to cancelled

// Deletion
deleteAppointment(id)             // Remove permanently

// Analytics
getUpcomingAppointments()         // Future appointments
getTodayAppointments()            // Today's schedule
getAppointmentStats()             // Dashboard statistics

// Initialization
initializeSampleAppointments()    // Load demo data
```

#### Data Flow Example: Customer Books Appointment
```
1. Customer on BookingPage:
   ├── Selects service (Hair Cut & Style)
   ├── Chooses date (2026-04-15)
   ├── Picks time (10:00)
   └── Selects staff (Emma Wilson)

2. BookingPage calls:
   createAppointment({
     customer_id: currentUser.id,
     customer_name: currentUser.name,
     service_id: 1,
     service_name: "Hair Cut & Style",
     appointment_date: "2026-04-15",
     appointment_time: "10:00",
     staff_id: 1,
     status: "pending",
     ...
   })

3. appointmentStore:
   ├── Generates unique ID (APT1712345678)
   ├── Adds timestamps (created_at, updated_at)
   ├── Saves to localStorage
   └── Returns new appointment object

4. Appointment now visible in:
   ├── CustomerDashboard (customer's appointments list)
   ├── StaffDashboard (Emma Wilson's schedule)
   └── AdminDashboard (all appointments table)

5. Admin confirms appointment:
   ├── AdminDashboard calls updateAppointmentStatus(id, "confirmed")
   ├── appointmentStore updates status and updated_at
   └── Change reflects immediately in CustomerDashboard
```

### Authentication Flow (`api.ts`)

#### Mock API (Development Mode)
```typescript
// Current mode: USE_REAL_API = false

mockAPI.auth.login(credentials)
    ↓
Check predefined mock users:
    - customer@example.com → Customer role
    - staff@example.com → Staff role
    - admin@example.com → Admin role
    ↓
Store user in localStorage
    ↓
Return { user, token }

mockAPI.auth.register(userData)
    ↓
Create mock user with customer role (ignores any other role)
    ↓
Store user in localStorage
    ↓
Return { user, token }
```

#### Real API (Production Mode)
```typescript
// Set USE_REAL_API = true

authAPI.login(credentials)
    ↓
POST to Flask: /api/auth/login
    ↓
Backend validates credentials
    ↓
Returns JWT token + user data
    ↓
Store token in localStorage
    ↓
All subsequent API calls include token in headers

authAPI.register(userData)
    ↓
POST to Flask: /api/auth/register
    ↓
Backend creates user with role: "customer" (enforced)
    ↓
Returns JWT token + user data
```

### State Management Patterns

#### App-Level State (App.tsx)
```typescript
const [currentView, setCurrentView] = useState('home');
const [userRole, setUserRole] = useState<string | null>(null);

useEffect(() => {
  // Run once on mount
  initializeSampleAppointments();
  
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    setUserRole(currentUser.role);
    // Auto-redirect based on role
  }
}, []); // Empty dependency array = run once
```

#### Component-Level State (CustomerDashboard.tsx)
```typescript
// Local state for dashboard
const [activeTab, setActiveTab] = useState('overview');
const [appointments, setAppointments] = useState([]);
const [profile, setProfile] = useState({...});

// Effect 1: Load appointments when component mounts
useEffect(() => {
  const currentUser = api.auth.getCurrentUser();
  const userAppointments = getAppointmentsByCustomer(currentUser.id);
  setAppointments(userAppointments);
}, []);

// Effect 2: Update stats when appointment count changes
useEffect(() => {
  const totalAppointments = appointments.length;
  const loyaltyPoints = appointments.filter(...).length * 10;
  setProfile(prev => ({ ...prev, totalAppointments, loyaltyPoints }));
}, [appointments.length]); // Only depend on length, not full array
```

#### Custom Hooks (useAuth.ts)
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    setLoading(true);
    const response = await authAPI.login(credentials);
    setUser(response.user);
    setLoading(false);
  };

  return { user, loading, login, logout, isAuthenticated };
}

// Usage in components:
const { user, login, logout } = useAuth();
```

---

## 🧩 Key Components

### 1. Navigation.tsx
**Purpose**: Responsive navigation bar visible on all pages

**Features**:
- Desktop: Horizontal menu with links
- Mobile: Hamburger menu with slide-in drawer
- Conditional rendering based on user role
- Logout functionality
- Active link highlighting

**State**:
```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

**Responsive Breakpoints**:
- Desktop (md+): Full navigation bar
- Mobile (<md): Hamburger icon + mobile menu

### 2. BookingPage.tsx
**Purpose**: Multi-step appointment booking wizard

**Features**:
- 4-step process (Service → Date/Time → Staff → Confirm)
- Step indicator with icons
- Back/Next navigation
- Form validation
- Success toast notification

**State**:
```typescript
const [currentStep, setCurrentStep] = useState(1);
const [selectedService, setSelectedService] = useState('');
const [selectedDate, setSelectedDate] = useState<Date>();
const [selectedTime, setSelectedTime] = useState('');
const [selectedStaff, setSelectedStaff] = useState('');
```

**Validation Logic**:
- Step 1: Must select a service
- Step 2: Must select date AND time
- Step 3: Must select staff
- Step 4: Final confirmation

### 3. CustomerDashboard.tsx
**Purpose**: Personalized customer portal

**Features**:
- Tab-based navigation (Overview, Services, Appointments, Profile)
- Dynamic content loading
- Real-time appointment updates
- Profile editing

**State**:
```typescript
const [activeTab, setActiveTab] = useState('overview');
const [appointments, setAppointments] = useState<AppointmentStore[]>([]);
const [profile, setProfile] = useState({...});
const [profileForm, setProfileForm] = useState({...});
const [isEditingProfile, setIsEditingProfile] = useState(false);
```

**Key Functions**:
```typescript
// Handle status change
const handleStatusChange = (appointmentId: string, newStatus: string) => {
  updateAppointmentStatus(appointmentId, newStatus);
  // Reload appointments
  refreshAppointments();
};

// Handle profile update
const handleProfileSave = () => {
  // Update localStorage
  const currentUser = api.auth.getCurrentUser();
  const updatedUser = { ...currentUser, ...profileForm };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  setIsEditingProfile(false);
  toast.success('Profile updated successfully');
};
```

### 4. AdminDashboard.tsx
**Purpose**: Comprehensive system administration

**Features**:
- Analytics overview with charts (Recharts)
- Service management (CRUD operations)
- Appointment management
- Staff management
- Reports generation

**State**:
```typescript
const [activeTab, setActiveTab] = useState('overview');
const [stats, setStats] = useState({...});
const [weeklyData, setWeeklyData] = useState([]);
const [services, setServices] = useState([]);
const [appointments, setAppointments] = useState([]);
const [staff, setStaff] = useState([]);
```

**Charts Used**:
```typescript
// Weekly performance - Bar chart
<BarChart data={weeklyData}>
  <Bar dataKey="appointments" fill="#8b5cf6" />
  <Bar dataKey="revenue" fill="#ec4899" />
</BarChart>

// Service distribution - Pie chart
<PieChart>
  <Pie data={serviceDistribution} />
</PieChart>
```

### 5. StaffDashboard.tsx
**Purpose**: Staff schedule and appointment management

**Features**:
- Today's schedule view
- Appointment status updates
- Customer information display
- Quick stats

**State**:
```typescript
const [todayAppointments, setTodayAppointments] = useState([]);
const [stats, setStats] = useState({...});
```

### 6. AuthPages.tsx
**Purpose**: Unified login and registration page

**Features**:
- Dual mode (login/register)
- Form validation
- Error handling
- Remember me checkbox
- Demo credentials display

**State**:
```typescript
const [formData, setFormData] = useState({ email, password, name, phone });
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
```

### 7. UI Components (shadcn/ui)
Pre-built, accessible components used throughout:

| Component | Usage |
|-----------|-------|
| Button | All clickable actions |
| Card | Content containers |
| Input | Form fields |
| Select | Dropdowns |
| Calendar | Date selection |
| Badge | Status indicators |
| Table | Data display |
| Dialog | Modals |
| Tabs | Tab navigation |
| Alert | Error/success messages |
| Chart | Data visualization |
| Skeleton | Loading states |
| Tooltip | Hover information |

---

## 🔌 Backend Integration

### Current Mode: Mock API
```typescript
// /services/api.ts
const USE_REAL_API = false;

export const api = USE_REAL_API ? {
  auth: authAPI,
  services: servicesAPI,
  // ...
} : mockAPI;
```

### Mock Data Structure
```typescript
mockAPI = {
  auth: {
    login: () => Promise<{ user, token }>,
    register: () => Promise<{ user, token }>,
    logout: () => Promise<void>,
    getCurrentUser: () => User | null,
    isAuthenticated: () => boolean,
  },
  services: {
    getAll: () => Promise<Service[]>,
    create: (data) => Promise<Service>,
    update: (id, data) => Promise<Service>,
    delete: (id) => Promise<void>,
  },
  staff: {
    getAll: () => Promise<Staff[]>,
    getAssignments: () => Promise<StaffAssignment[]>,
  },
  appointments: {
    getAll: () => Promise<Appointment[]>,
    create: (data) => Promise<Appointment>,
    getAllForAdmin: () => Promise<{appointments, pagination}>,
  },
  analytics: {
    getDashboardStats: () => Promise<Stats>,
    getWeeklyData: () => Promise<WeeklyData[]>,
    getServiceDistribution: () => Promise<DistributionData[]>,
  }
}
```

### Flask Backend Structure
Located in `/backend-docs/flask-api-structure.md`

#### API Endpoints
```
Authentication:
  POST /api/auth/login
  POST /api/auth/register
  POST /api/auth/logout

Services:
  GET    /api/services
  POST   /api/services (admin only)
  PUT    /api/services/:id (admin only)
  DELETE /api/services/:id (admin only)

Staff:
  GET    /api/staff
  GET    /api/staff/available?date=&service_id=
  POST   /api/staff/:id/assign-service (admin only)

Appointments:
  GET    /api/appointments
  POST   /api/appointments
  GET    /api/appointments/customer/:id
  GET    /api/appointments/staff/:id
  PATCH  /api/appointments/:id/status
  DELETE /api/appointments/:id

Analytics (Admin):
  GET /api/analytics/dashboard-stats
  GET /api/analytics/weekly-data
  GET /api/analytics/service-distribution
  GET /api/analytics/staff-performance
```

#### Database Models
```python
User:
  - id (primary key)
  - name
  - email (unique)
  - password_hash
  - phone
  - role (customer/staff/admin)
  - created_at

Service:
  - id (primary key)
  - name
  - description
  - duration (minutes)
  - price
  - category
  - is_active

Appointment:
  - id (primary key)
  - customer_id (foreign key → User)
  - staff_id (foreign key → User)
  - service_id (foreign key → Service)
  - appointment_date
  - appointment_time
  - status (pending/confirmed/completed/cancelled)
  - notes
  - price
  - created_at
```

#### Switching to Real API
```typescript
// Step 1: Ensure Flask backend is running
// Step 2: Update api.ts
const USE_REAL_API = true;

// Step 3: All API calls will now use Flask endpoints
const services = await api.services.getAll();
// Makes request to: http://localhost:5000/api/services
```

---

## 🐛 Bug Fixes & Improvements

### 1. Date Format Error Fix
**File**: `/BUGFIX_DATE_FORMAT_ERROR.md`

**Problem**:
```typescript
// CustomerDashboard.tsx - Line 647
{profile.joinDate ? format(new Date(profile.joinDate), 'MMMM yyyy') : 'N/A'}
```
- Error: `RangeError: Invalid time value`
- Cause: Empty joinDate string being formatted before user data loads

**Solution**:
```typescript
// Created utility in /components/ui/utils.ts
export function safeFormatDate(
  dateValue: string | Date | number | null | undefined,
  formatString: string,
  fallback: string = 'N/A'
): string {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatString);
  } catch {
    return fallback;
  }
}

// Usage
{safeFormatDate(profile.joinDate, 'MMMM yyyy')}
```

### 2. Infinite Loop Timeout Error Fix
**File**: `/BUGFIX_TIMEOUT_ERROR.md`

**Problem 1**: App.tsx infinite redirect loop
```typescript
// BAD - Creates infinite loop
useEffect(() => {
  // Code that calls setCurrentView()
}, [currentView]); // Depends on value it modifies!
```

**Solution 1**:
```typescript
// GOOD - Runs only once on mount
useEffect(() => {
  initializeSampleAppointments();
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    setUserRole(currentUser.role);
    // Redirect logic...
  }
}, []); // Empty dependency array
```

**Problem 2**: CustomerDashboard excessive re-renders
```typescript
// BAD - Re-runs on every appointment mutation
useEffect(() => {
  // Update profile stats
}, [appointments]); // Entire array as dependency
```

**Solution 2**:
```typescript
// GOOD - Only when count changes
useEffect(() => {
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    const totalAppointments = appointments.length;
    const loyaltyPoints = appointments.filter(...).length * 10;
    setProfile(prev => ({ ...prev, totalAppointments, loyaltyPoints }));
  }
}, [appointments.length]); // Only depend on length

// Separate effect for initial profile load
useEffect(() => {
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    setProfileForm({ name: currentUser.name, ... });
  }
}, []); // Run once on mount
```

### 3. Duplicate Keys and Image URLs Fix
**File**: `/BUGFIX_DUPLICATE_KEYS_AND_IMAGES.md`

**Problem 1**: React duplicate key warnings in AdminDashboard
```typescript
// BAD - Non-unique keys in chart data
{weeklyData.map((data, index) => (
  <Cell key={index} fill={data.color} /> // index is not unique!
))}
```

**Solution 1**:
```typescript
// GOOD - Use unique identifier
{weeklyData.map((data, dayIndex) => (
  <Cell key={`cell-${dayIndex}-${data.day}`} fill={data.color} />
))}
```

**Problem 2**: Unstable Unsplash image URLs
- Unsplash images were breaking due to URL changes

**Solution 2**:
```typescript
// Replaced all Unsplash URLs with Picsum Photos
// Old: https://images.unsplash.com/photo-...
// New: https://picsum.photos/seed/{unique}/800/600

const services = [
  {
    title: "Hair Services",
    image: "https://picsum.photos/seed/hair-salon/800/600",
  },
  {
    title: "Facial Treatments",
    image: "https://picsum.photos/seed/facial-spa/800/600",
  },
];
```

### 4. Centralized Appointment Management
**Improvement**: Created `/services/appointmentStore.ts`

**Before**: Appointments scattered across components
**After**: Single source of truth for all appointment data

**Benefits**:
- Consistent data across all dashboards
- Customer bookings visible to Admin and Staff
- Easy to update and maintain
- Works without backend (localStorage)
- Simple migration to backend when ready

---

## 📱 Responsive Design

### Design Approach
- **Mobile-first**: Design for smallest screen, enhance for larger
- **Breakpoints**: Tailwind's default (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Flexible layouts**: Flexbox and Grid for adaptive layouts
- **Touch-friendly**: Larger tap targets on mobile

### Completed Responsive Components

#### 1. Navigation (Fully Responsive)
```tsx
// Desktop: Horizontal menu
<div className="hidden md:flex items-center space-x-8">
  {/* Desktop navigation links */}
</div>

// Mobile: Hamburger menu
<button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
  <Menu className="w-6 h-6" />
</button>

{isMobileMenuOpen && (
  <div className="fixed inset-0 z-50 bg-black/50">
    {/* Mobile menu drawer */}
  </div>
)}
```

#### 2. HomePage (Fully Responsive)
```tsx
// Hero section
<div className="px-4 sm:px-6 lg:px-8"> {/* Responsive padding */}
  <h1 className="text-3xl sm:text-4xl lg:text-5xl"> {/* Responsive text */}
    {/* Content */}
  </h1>
</div>

// Service grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Auto-adjusts columns based on screen size */}
</div>
```

#### 3. ServicesPage (Fully Responsive)
```tsx
// Search and filters
<div className="flex flex-col sm:flex-row gap-4">
  {/* Stack on mobile, row on desktop */}
</div>

// Service cards grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

#### 4. BookingPage (Fully Responsive)
```tsx
// Step indicator
<div className="flex justify-between mb-8">
  {steps.map(step => (
    <div className="flex flex-col items-center flex-1">
      <div className="hidden sm:block"> {/* Hide labels on mobile */}
        {step.title}
      </div>
    </div>
  ))}
</div>

// Service selection grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

#### 5. CustomerDashboard (Partially Responsive)
```tsx
// Mobile sidebar toggle
<button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
  <Menu className="w-6 h-6" />
</button>

// Sidebar
<aside className={`
  fixed lg:static inset-y-0 left-0 z-40
  w-64 lg:w-auto
  transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  lg:translate-x-0
  transition-transform
`}>
  {/* Sidebar content */}
</aside>

// Stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive stats cards */}
</div>

// Appointments list
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 1 column mobile, 2 desktop */}
</div>
```

**Status**: Sidebar and basic layout responsive, some tab content needs refinement

#### 6. AdminDashboard (Needs Work)
**Current**: Desktop-optimized layout
**Needed**:
- Mobile-friendly tables (convert to cards on small screens)
- Responsive charts (Recharts needs configuration)
- Collapsible sections
- Touch-friendly controls

**Priority Updates**:
```tsx
// Table to cards on mobile
<div className="hidden md:block">
  <Table> {/* Desktop table view */} </Table>
</div>
<div className="block md:hidden">
  {data.map(item => (
    <Card> {/* Mobile card view */} </Card>
  ))}
</div>

// Responsive chart
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={weeklyData}>
    {/* Chart content */}
  </BarChart>
</ResponsiveContainer>
```

#### 7. StaffDashboard (Needs Work)
**Current**: Desktop-focused
**Needed**:
- Mobile appointment cards
- Touch-friendly status buttons
- Responsive daily schedule
- Simplified mobile view

### Responsive Design Patterns Used

#### 1. Responsive Grid
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
//          └─mobile: 1  └─tablet: 2     └─desktop: 3
```

#### 2. Responsive Flex
```tsx
className="flex flex-col md:flex-row"
//          └─mobile: stack  └─desktop: row
```

#### 3. Responsive Spacing
```tsx
className="px-4 sm:px-6 lg:px-8"
//          └─mobile └─tablet └─desktop
```

#### 4. Responsive Text
```tsx
className="text-xl sm:text-2xl lg:text-3xl"
//          └─mobile └─tablet   └─desktop
```

#### 5. Show/Hide
```tsx
className="hidden md:block"  // Hide on mobile, show on desktop
className="md:hidden"        // Show on mobile, hide on desktop
```

#### 6. Mobile Menu Pattern
```tsx
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Hamburger button (mobile only)
<button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
  <Menu />
</button>

// Desktop menu (desktop only)
<nav className="hidden md:flex">
  {/* Desktop nav */}
</nav>

// Mobile drawer
{isMobileMenuOpen && (
  <div className="fixed inset-0 z-50 md:hidden">
    {/* Mobile menu */}
  </div>
)}
```

---

## 🤖 How to Explain to AI Models

### Quick Summary Template
```
This is a salon appointment booking website with:

Frontend: React + TypeScript + Tailwind CSS v4
Backend: Flask (documented, can use mock API)
State: localStorage + centralized appointmentStore

Key features:
- 3 user roles (Customer, Staff, Admin) with separate dashboards
- Step-by-step booking flow (service → date/time → staff → confirm)
- Centralized appointment management (all dashboards see same data)
- Customer self-registration, staff/admin manual creation
- Analytics with Recharts (admin dashboard)
- Responsive design (mobile hamburger menu, responsive grids)

Architecture:
- Single-page app, no routing library
- View switching via currentView state in App.tsx
- Appointments stored in localStorage via appointmentStore.ts
- Mock API for development (can switch to real Flask backend)
- shadcn/ui components for consistent UI

Current status:
- Core functionality complete
- Home, Services, Booking, Auth, CustomerDashboard fully responsive
- AdminDashboard and StaffDashboard need mobile optimization
- Bug fixes applied (date formatting, infinite loops, duplicate keys)
- Using Picsum Photos for reliable images
```

### Detailed Context Template

When explaining to another AI model, provide this structure:

```markdown
# Project Context for AI Assistant

## What I'm Working On
A salon appointment booking system with customer-facing booking and admin management features.

## Tech Stack
- React (functional components, hooks)
- TypeScript (strict typing)
- Tailwind CSS v4 (utility-first styling)
- localStorage for persistence
- shadcn/ui component library
- Recharts for data visualization

## Current Architecture
- `/App.tsx` - Main app with view switching (no React Router)
- `/components/` - All page components (HomePage, BookingPage, dashboards, etc.)
- `/services/appointmentStore.ts` - Centralized appointment management
- `/services/api.ts` - API layer (mock + real Flask backend support)
- `/hooks/useAuth.ts` - Authentication logic
- `/components/ui/` - Reusable UI components (shadcn)

## Key Design Patterns
1. **View Switching**: currentView state in App.tsx controls which page shows
2. **Centralized Data**: appointmentStore.ts manages all appointments
3. **Role-Based Access**: userRole state determines dashboard access
4. **Mock/Real API Toggle**: USE_REAL_API flag switches between mock and Flask

## User Roles
- Customer: Self-register, book appointments, view own bookings
- Staff: Manual creation, view schedule, update appointment status
- Admin: Manual creation, full system access, analytics

## What's Been Completed
✅ Core booking flow (4-step wizard)
✅ Customer, Staff, Admin dashboards
✅ Authentication system (login/register)
✅ Centralized appointment management
✅ Analytics with charts (admin)
✅ Responsive navigation (mobile hamburger menu)
✅ Responsive HomePage, ServicesPage, BookingPage
✅ Partially responsive CustomerDashboard

## What Needs Work
❌ AdminDashboard mobile optimization (tables → cards, responsive charts)
❌ StaffDashboard mobile optimization (simplified mobile schedule)
❌ Complete CustomerDashboard responsiveness (some tab content)

## Recent Bug Fixes
1. Date formatting errors (created safeFormatDate utility)
2. Infinite loop timeouts (fixed useEffect dependencies)
3. Duplicate React keys (unique keys in chart data)
4. Unstable images (switched to Picsum Photos)

## Design Requirements
- Soft pastel colors (lavender #8b5cf6, pink #ec4899)
- Rounded corners (Tailwind rounded utilities)
- Minimalistic, clean design
- Poppins font (implied by typography)
- Professional yet welcoming aesthetic

## Important Files to Reference
- `/services/appointmentStore.ts` - How appointments work
- `/services/api.ts` - Mock data and API structure
- `/backend-docs/` - Flask backend documentation
- `/BUGFIX_*.md` - Details on bug fixes
- `/CUSTOMER_REGISTRATION_GUIDE.md` - User flow documentation

## When Working on New Features
1. Use appointmentStore for any appointment-related data
2. Check api.auth.getCurrentUser() for logged-in user
3. Use safeFormatDate() for date formatting
4. Follow responsive patterns from existing components
5. Use shadcn/ui components for consistency
6. Test across mobile, tablet, desktop viewports

## Current Development Focus
Making AdminDashboard and StaffDashboard fully responsive for mobile devices.
```

### Example Prompt for AI
```
I'm working on a salon booking website built with React + TypeScript + Tailwind CSS v4.

Current state:
- We have 3 dashboards (Customer, Staff, Admin) with different access levels
- Appointments are managed centrally via appointmentStore.ts using localStorage
- Currently using mock API (can switch to Flask backend)
- Home, Services, Booking, and CustomerDashboard are responsive
- AdminDashboard and StaffDashboard need mobile optimization

I need help with [SPECIFIC TASK], keeping in mind:
- Use existing appointmentStore functions for data
- Follow responsive patterns from Navigation.tsx and HomePage.tsx
- Use shadcn/ui components for consistency
- Maintain soft pastel design (lavender/pink theme)
- Ensure all tables convert to cards on mobile (< md breakpoint)

Here's the component I'm working on:
[PASTE CODE]

Question: [YOUR SPECIFIC QUESTION]
```

---

## 📊 Key Metrics & Statistics

### Project Size
- **Total Files**: 60+
- **Lines of Code**: ~8,000+
- **Components**: 40+ UI components + 7 page components
- **API Endpoints**: 20+ (documented for Flask)
- **User Roles**: 3 (Customer, Staff, Admin)

### Features Count
- **Pages**: 7 (Home, Services, Booking, Auth, 3 Dashboards)
- **Services**: 6 categories (Hair, Facial, Nails, Wellness, etc.)
- **Appointment Statuses**: 4 (Pending, Confirmed, Completed, Cancelled)
- **Dashboard Tabs**: 12+ across all dashboards
- **Charts**: 4 types (Bar, Pie, Line, Table)

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint compliant
- ✅ Responsive design
- ✅ Accessibility (shadcn/ui components)
- ✅ Error handling (try/catch, safe formatting)
- ✅ Loading states (skeletons, spinners)
- ✅ User feedback (toast notifications)

---

## 🚀 Getting Started (For New Developers)

### 1. Clone and Install
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Understanding the Flow
```
1. Open app → See HomePage (landing)
2. Click "Book Now" → BookingPage (4-step wizard)
3. Complete booking → Redirects to login if not authenticated
4. Register account → Auto-creates customer, logs in
5. Redirected to CustomerDashboard → See your appointment
6. Test other roles:
   - Login as staff@example.com → StaffDashboard
   - Login as admin@example.com → AdminDashboard
```

### 3. Key Files to Explore
```
Start here:
  1. /App.tsx - Understand view switching
  2. /services/appointmentStore.ts - See how appointments work
  3. /components/HomePage.tsx - Learn component structure
  4. /components/BookingPage.tsx - Understand step-by-step flow
  5. /components/CustomerDashboard.tsx - Complex dashboard example

Then explore:
  6. /services/api.ts - API layer and mock data
  7. /hooks/useAuth.ts - Authentication hooks
  8. /components/ui/* - Reusable UI components
```

### 4. Making Changes

**Adding a new page:**
```tsx
// 1. Create component in /components/
export function NewPage({ setCurrentView }: { setCurrentView: (view: string) => void }) {
  return <div>New Page Content</div>;
}

// 2. Add to App.tsx renderView()
case 'new-page':
  return <NewPage setCurrentView={setCurrentView} />;

// 3. Link to it from Navigation or other pages
<button onClick={() => setCurrentView('new-page')}>Go to New Page</button>
```

**Adding a new service:**
```typescript
// In mock API or directly in component
const newService = {
  id: 7,
  name: "New Service",
  description: "Description",
  duration: 60,
  price: 100,
  category: "Beauty"
};
```

**Adding appointment logic:**
```typescript
import { createAppointment, getAppointmentsByCustomer } from '../services/appointmentStore';

// Create appointment
const newAppointment = createAppointment({
  customer_id: user.id,
  customer_name: user.name,
  // ... other fields
});

// Fetch customer appointments
const myAppointments = getAppointmentsByCustomer(user.id);
```

---

## 🎓 Learning Resources

### React Concepts Used
- Functional components
- useState, useEffect hooks
- Custom hooks (useAuth)
- Props and prop drilling
- Conditional rendering
- List rendering with keys
- Event handling
- Form management

### TypeScript Concepts Used
- Interface definitions
- Type annotations
- Union types (status: 'pending' | 'confirmed')
- Optional properties (notes?: string)
- Generic functions <T>
- Type assertions

### Tailwind CSS Patterns
- Utility-first styling
- Responsive breakpoints
- Custom color schemes
- Flexbox and Grid
- Transitions and animations
- Custom variants (dark mode)

### State Management Patterns
- Local component state (useState)
- Persistent state (localStorage)
- Centralized stores (appointmentStore)
- Derived state (computed from other state)
- Effect dependencies (useEffect)

---

## 📞 Support & Maintenance

### Common Issues

**Issue**: "Can't book appointment"
**Solution**: Make sure user is logged in (check localStorage for 'auth_token')

**Issue**: "Appointment not showing in dashboard"
**Solution**: Check appointmentStore.ts - appointments are filtered by customer_id

**Issue**: "Page timeout/infinite loop"
**Solution**: Check useEffect dependencies, ensure no circular dependencies

**Issue**: "Date formatting error"
**Solution**: Use safeFormatDate() utility instead of direct format()

**Issue**: "Images not loading"
**Solution**: Ensure using Picsum Photos URLs, not Unsplash

### Future Enhancements
- [ ] Email notifications (integrate SendGrid)
- [ ] SMS reminders (integrate Twilio)
- [ ] Online payment (integrate Stripe)
- [ ] Calendar sync (Google Calendar API)
- [ ] Review system for completed appointments
- [ ] Loyalty program automation
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Advanced search and filtering
- [ ] Export reports (PDF generation)

---

## ✅ Checklist for AI Models

When working on this project, always:

- [ ] Check if user is authenticated before showing booking/dashboard
- [ ] Use appointmentStore functions for all appointment operations
- [ ] Use safeFormatDate() for any date formatting
- [ ] Follow responsive patterns (mobile-first, use breakpoints)
- [ ] Use shadcn/ui components for consistency
- [ ] Test on multiple screen sizes (mobile, tablet, desktop)
- [ ] Ensure unique React keys (don't use index)
- [ ] Handle loading and error states
- [ ] Show toast notifications for user actions
- [ ] Maintain soft pastel color scheme (lavender/pink)
- [ ] Use Picsum Photos for any new images
- [ ] Add TypeScript types for all props and state
- [ ] Avoid infinite loops in useEffect (check dependencies)
- [ ] Follow existing code structure and patterns
- [ ] Test role-based access (customer, staff, admin)

---

**End of Documentation**

Last Updated: April 8, 2026
Version: 1.0
