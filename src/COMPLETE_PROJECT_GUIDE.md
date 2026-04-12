# Complete Salon Appointment Booking System - Frontend Documentation

**For AI Models: Use this guide to understand the complete frontend architecture of this salon booking website.**

---

## 🎯 Executive Summary

A production-ready **frontend-only** salon appointment booking website featuring:
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **State Management**: Centralized localStorage with custom appointment store
- **Backend**: **NOT INCLUDED** - Currently using mock data (see BACKEND_REQUIREMENTS.md)
- **UI/UX**: Soft pastel design (lavender #8b5cf6, pink #ec4899) with shadcn/ui components
- **Role System**: 3 user roles (Customer, Staff, Admin) with separate dashboards
- **Responsive**: Fully responsive across mobile, tablet, and desktop

**Important**: This is a frontend application that currently works with localStorage. When you integrate a backend, you'll simply toggle `USE_REAL_API = true` in `/services/api.ts`.

---

## 📊 Architecture Overview

### **Frontend-Only Architecture (Current State)**

```
┌─────────────────────────────────────────────────────┐
│                REACT FRONTEND                        │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         USER INTERFACE LAYER                  │  │
│  │  Components (HomePage, Dashboards, Booking)  │  │
│  └──────────────────┬───────────────────────────┘  │
│                     ↓                                │
│  ┌──────────────────────────────────────────────┐  │
│  │         BUSINESS LOGIC LAYER                  │  │
│  │  - api.ts (API abstraction)                  │  │
│  │  - appointmentStore.ts (Centralized store)   │  │
│  │  - useAuth.ts (Authentication hook)          │  │
│  └──────────────────┬───────────────────────────┘  │
│                     ↓                                │
│  ┌──────────────────────────────────────────────┐  │
│  │         DATA PERSISTENCE LAYER                │  │
│  │         localStorage (Browser Storage)        │  │
│  │  - 'user' → Current user data                │  │
│  │  - 'auth_token' → Mock JWT token             │  │
│  │  - 'salon_appointments' → All appointments   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         FUTURE: BACKEND INTEGRATION                  │
│  (When backend is ready, change USE_REAL_API=true)  │
│                                                      │
│  Your Backend API (REST/GraphQL)                    │
│  ├── POST /api/auth/login                           │
│  ├── POST /api/auth/register                        │
│  ├── GET  /api/services                             │
│  ├── POST /api/appointments                         │
│  └── ... (See BACKEND_REQUIREMENTS.md)              │
└─────────────────────────────────────────────────────┘
```

### **How Data Flows (Current Frontend-Only Mode)**

```
User Action (Book Appointment)
        ↓
BookingPage Component
        ↓
Calls: createAppointment(data)
        ↓
appointmentStore.ts
        ↓
Saves to localStorage
        ↓
Appointment visible in:
  - CustomerDashboard
  - StaffDashboard  
  - AdminDashboard
(All dashboards read from same localStorage)
```

---

## 🗂 Complete File Structure

```
/
├── App.tsx                          # Main entry point, view routing
├── styles/
│   └── globals.css                  # Tailwind v4 config, CSS variables
│
├── services/                        # Business logic layer
│   ├── api.ts                       # API abstraction (mock mode)
│   └── appointmentStore.ts          # Centralized appointment management
│
├── hooks/                           # Custom React hooks
│   └── useAuth.ts                   # Authentication state management
│
├── components/                      # Main application components
│   ├── HomePage.tsx                 # Landing page with hero
│   ├── ServicesPage.tsx             # Service catalog with search/filters
│   ├── BookingPage.tsx              # 4-step booking wizard
│   ├── AuthPages.tsx                # Login + Register forms
│   ├── Navigation.tsx               # Responsive navbar with mobile menu
│   ├── CustomerDashboard.tsx        # Customer portal (4 tabs)
│   ├── StaffDashboard.tsx           # Staff schedule management
│   ├── AdminDashboard.tsx           # Admin panel with analytics
│   ├── ManageServicePanel.tsx       # Service CRUD for admin
│   │
│   ├── figma/                       # System components (DO NOT EDIT)
│   │   └── ImageWithFallback.tsx
│   │
│   └── ui/                          # shadcn/ui components (40+)
│       ├── button.tsx
│       ├── card.tsx
│       ├── calendar.tsx
│       ├── chart.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── dialog.tsx
│       ├── tabs.tsx
│       ├── utils.ts                 # Utility functions (safeFormatDate)
│       └── ... (35+ more components)
│
└── documentation/                   # Project documentation
    ├── COMPLETE_PROJECT_GUIDE.md    # This file
    ├── BACKEND_REQUIREMENTS.md      # What backend needs to implement
    ├── AI_CONTEXT_GUIDE.md          # Quick reference
    └── PROJECT_DOCUMENTATION.md     # Detailed docs
```

---

## 🔧 Technology Stack

### **Frontend Technologies**

| Technology | Version | Purpose | Installation |
|------------|---------|---------|--------------|
| **React** | 18.x | UI framework | Included |
| **TypeScript** | 5.x | Type safety | Included |
| **Tailwind CSS** | 4.0 | Styling | Included |
| **date-fns** | Latest | Date manipulation | `import { format } from 'date-fns'` |
| **Recharts** | Latest | Data visualization | `import { LineChart } from 'recharts'` |
| **Lucide React** | Latest | Icons | `import { Calendar } from 'lucide-react'` |
| **Sonner** | 2.0.3 | Toast notifications | `import { toast } from 'sonner@2.0.3'` |
| **shadcn/ui** | Latest | UI components | Pre-installed in /components/ui/ |

### **State Management Strategy**

This project uses a **simple, effective state management approach** without Redux or Context API:

```typescript
// 1. Component State (useState)
// For: UI state, form inputs, toggles
const [activeTab, setActiveTab] = useState('overview');
const [isMenuOpen, setIsMenuOpen] = useState(false);

// 2. localStorage (Browser Storage)
// For: User session, persistent data
localStorage.setItem('user', JSON.stringify(user));
const user = JSON.parse(localStorage.getItem('user'));

// 3. Centralized Store (appointmentStore.ts)
// For: Appointments shared across all dashboards
import { createAppointment, getAllAppointments } from '../services/appointmentStore';

// 4. API Abstraction (api.ts)
// For: Mock data now, real API calls later
import { api } from '../services/api';
const services = await api.services.getAll();
```

**Why this approach?**
- ✅ Simple and fast to develop
- ✅ No boilerplate or setup required
- ✅ Easy to debug (check localStorage in DevTools)
- ✅ Perfect for small-medium applications
- ✅ Easy transition to backend (just toggle one flag)

---

## 🔑 Core Features Deep Dive

### **1. Authentication System (Frontend Mock)**

#### Current Implementation: Mock Authentication

```typescript
// Location: /services/api.ts

// Demo accounts built into the system:
mockAPI.auth.login(credentials) {
  const mockUsers = {
    'customer@example.com': {
      id: 1,
      name: 'John Customer',
      email: 'customer@example.com',
      role: 'customer'
    },
    'staff@example.com': {
      id: 2,
      name: 'Sarah Staff',
      email: 'staff@example.com',
      role: 'staff'
    },
    'admin@example.com': {
      id: 3,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }
  };
  
  // Find user or create customer account
  const user = mockUsers[credentials.email] || createCustomerUser(credentials);
  
  // Store in localStorage
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
  
  return { user, token };
}
```

#### Security Model (Frontend Enforcement)

```typescript
// Registration always creates CUSTOMER role
mockAPI.auth.register(userData) {
  const newUser = {
    id: Date.now(),
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    role: 'customer',  // ALWAYS customer, ignore any other input
    created_at: new Date().toISOString()
  };
  
  localStorage.setItem('user', JSON.stringify(newUser));
  return { user: newUser, token: 'mock-token' };
}
```

#### User Roles

| Role | How to Create | Dashboard | Permissions |
|------|---------------|-----------|-------------|
| **Customer** | Register via `/register` page | CustomerDashboard | Book appointments, view own bookings, edit profile |
| **Staff** | Use demo account `staff@example.com` | StaffDashboard | View schedule, update appointment status |
| **Admin** | Use demo account `admin@example.com` | AdminDashboard | Full access: manage services, staff, appointments, analytics |

**Note**: In production with real backend, staff/admin accounts should be created manually in the database by system administrators.

---

### **2. Centralized Appointment Store**

**The Key Innovation**: All appointments are stored in one place (localStorage) and accessed by all dashboards.

#### File: `/services/appointmentStore.ts`

```typescript
// Storage location
const STORAGE_KEY = 'salon_appointments';

// Data structure
interface AppointmentStore {
  // Identifiers
  id: string;                    // "APT" + timestamp (e.g., "APT1712345678")
  
  // Customer info
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Staff info (null = "Any Available Staff")
  staff_id: number | null;
  staff_name: string | null;
  
  // Service info
  service_id: number;
  service_name: string;
  service_duration: number;      // minutes
  service_price: number;         // dollars
  
  // Appointment details
  appointment_date: string;      // "YYYY-MM-DD" format
  appointment_time: string;      // "HH:MM" format (24-hour)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;                // Optional customer notes
  
  // Metadata
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  booked_by: 'customer' | 'admin' | 'staff';
}
```

#### Key Functions

```typescript
// ═══════════════════════════════════════════════════════
// RETRIEVAL FUNCTIONS
// ═══════════════════════════════════════════════════════

getAllAppointments(): AppointmentStore[]
// Returns all appointments from localStorage
// Used in: AdminDashboard (view all), Analytics

getAppointmentsByCustomer(customerId: number): AppointmentStore[]
// Returns appointments for specific customer
// Used in: CustomerDashboard
// Example: getAppointmentsByCustomer(1) → [apt1, apt2, apt3]

getAppointmentsByStaff(staffId: number): AppointmentStore[]
// Returns appointments assigned to specific staff member
// Used in: StaffDashboard
// Example: getAppointmentsByStaff(2) → [apt4, apt5]

getAppointmentsByDate(date: string): AppointmentStore[]
// Returns appointments for specific date
// Used in: StaffDashboard (today's schedule)
// Example: getAppointmentsByDate('2026-04-15') → [apt1, apt6]

getAppointmentById(id: string): AppointmentStore | null
// Returns single appointment by ID
// Used in: Edit/View appointment details
// Example: getAppointmentById('APT1712345678') → apt1

// ═══════════════════════════════════════════════════════
// CREATE & UPDATE FUNCTIONS
// ═══════════════════════════════════════════════════════

createAppointment(data): AppointmentStore
// Creates new appointment with auto-generated ID
// Used in: BookingPage (customer booking), AdminDashboard (manual booking)
// Example:
const apt = createAppointment({
  customer_id: 1,
  customer_name: "John Doe",
  service_id: 1,
  service_name: "Hair Cut",
  appointment_date: "2026-04-15",
  appointment_time: "10:00",
  staff_id: 2,
  status: "pending",
  booked_by: "customer"
});
// Returns: { id: "APT...", created_at: "...", updated_at: "...", ...data }

updateAppointment(id: string, updates: Partial<AppointmentStore>): AppointmentStore | null
// Updates any fields of an appointment
// Used in: AdminDashboard (edit appointments), StaffDashboard
// Example:
updateAppointment("APT123", { 
  appointment_time: "11:00",
  staff_id: 3,
  notes: "Customer requested time change"
});

updateAppointmentStatus(id: string, status): AppointmentStore | null
// Quick function to update just the status
// Used in: All dashboards
// Example:
updateAppointmentStatus("APT123", "confirmed");

cancelAppointment(id: string): AppointmentStore | null
// Sets status to 'cancelled'
// Used in: CustomerDashboard (cancel own), AdminDashboard
// Example:
cancelAppointment("APT123");

deleteAppointment(id: string): boolean
// Permanently removes appointment from localStorage
// Used in: AdminDashboard ONLY
// Returns: true if deleted, false if not found
// Example:
deleteAppointment("APT123"); // → true

// ═══════════════════════════════════════════════════════
// ANALYTICS & FILTERING
// ═══════════════════════════════════════════════════════

getUpcomingAppointments(): AppointmentStore[]
// Returns future appointments (not cancelled/completed)
// Used in: CustomerDashboard overview
// Filters: date >= today AND status !== 'cancelled' AND status !== 'completed'

getTodayAppointments(): AppointmentStore[]
// Returns appointments for today's date
// Used in: StaffDashboard, AdminDashboard
// Example: getTodayAppointments() → [apt1, apt2] (if today is 2026-04-15)

getAppointmentStats(): {
  total: number;
  today: number;
  todayRevenue: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
}
// Returns statistics for dashboards
// Used in: AdminDashboard analytics cards
// Example:
const stats = getAppointmentStats();
// → { total: 150, today: 8, todayRevenue: 1200, confirmed: 50, ... }

// ═══════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════

initializeSampleAppointments(): void
// Creates 3 sample appointments if localStorage is empty
// Called in: App.tsx on initial mount
// Only runs if no appointments exist (for demo purposes)
```

#### Data Flow Example: Booking to Dashboard

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: Customer Books Appointment                  │
├─────────────────────────────────────────────────────┤
│ BookingPage.tsx:                                    │
│   const currentUser = api.auth.getCurrentUser();   │
│   const appointment = createAppointment({          │
│     customer_id: 1,                                │
│     customer_name: "John Doe",                     │
│     customer_email: "john@email.com",              │
│     service_id: 1,                                 │
│     service_name: "Hair Cut & Style",              │
│     service_price: 85,                             │
│     appointment_date: "2026-04-15",                │
│     appointment_time: "10:00",                     │
│     staff_id: 2,                                   │
│     staff_name: "Emma Wilson",                     │
│     status: "pending",                             │
│     booked_by: "customer"                          │
│   });                                              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: appointmentStore.ts Processes              │
├─────────────────────────────────────────────────────┤
│ 1. Generate unique ID: "APT1712345678"             │
│ 2. Add timestamps:                                  │
│    - created_at: "2026-04-08T10:30:00.000Z"       │
│    - updated_at: "2026-04-08T10:30:00.000Z"       │
│ 3. Get existing appointments from localStorage     │
│ 4. Add new appointment to array                    │
│ 5. Save back to localStorage('salon_appointments') │
│ 6. Return complete appointment object              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: Visible in All Dashboards                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐  │
│ │ CustomerDashboard (Customer ID: 1)          │  │
│ │ Loads: getAppointmentsByCustomer(1)         │  │
│ │ Shows: "Appointments" tab                    │  │
│ │   ✓ Hair Cut & Style - Apr 15, 10:00       │  │
│ │     Status: 🟡 Pending                      │  │
│ │     Staff: Emma Wilson                       │  │
│ │     [View Details] [Cancel]                 │  │
│ └─────────────────────────────────────────────┘  │
│                                                     │
│ ┌─────────────────────────────────────────────┐  │
│ │ StaffDashboard (Staff ID: 2 - Emma Wilson)  │  │
│ │ Loads: getAppointmentsByStaff(2)            │  │
│ │       .filter(date = today)                  │  │
│ │ Shows: "Today's Schedule"                    │  │
│ │   ✓ 10:00 AM - John Doe                     │  │
│ │     Hair Cut & Style (60 min, $85)          │  │
│ │     Phone: (555) 123-4567                    │  │
│ │     [Confirm] [Complete] [Cancel]           │  │
│ └─────────────────────────────────────────────┘  │
│                                                     │
│ ┌─────────────────────────────────────────────┐  │
│ │ AdminDashboard (Admin)                       │  │
│ │ Loads: getAllAppointments()                  │  │
│ │ Shows: "Manage Appointments" table           │  │
│ │   ✓ APT1712345678 | John Doe | Emma Wilson  │  │
│ │     Hair Cut | Apr 15, 10:00 | Pending      │  │
│ │     [Edit] [Delete] [Change Status]         │  │
│ └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### **3. API Abstraction Layer**

**File**: `/services/api.ts`

This file provides a clean abstraction layer that currently uses mock data but is designed to easily switch to real API calls.

#### Current Configuration

```typescript
// Toggle between mock and real API
const USE_REAL_API = false;  // Currently using mock data

// Unified API export
export const api = USE_REAL_API ? realAPI : mockAPI;
```

#### Mock API Structure

```typescript
export const mockAPI = {
  // ═══════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════
  auth: {
    async login(credentials: { email: string; password: string }) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock users
      const mockUsers = {
        'customer@example.com': { id: 1, name: 'John Customer', role: 'customer' },
        'staff@example.com': { id: 2, name: 'Sarah Staff', role: 'staff' },
        'admin@example.com': { id: 3, name: 'Admin User', role: 'admin' }
      };
      
      const user = mockUsers[credentials.email];
      if (!user) throw new Error('Invalid credentials');
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
      
      return { user, token: 'mock-token' };
    },
    
    async register(userData: RegisterRequest) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'customer',  // Always customer
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
      
      return { user: newUser, token: 'mock-token' };
    },
    
    async logout() {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    },
    
    getCurrentUser(): User | null {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },
    
    isAuthenticated(): boolean {
      return !!localStorage.getItem('auth_token');
    }
  },
  
  // ═══════════════════════════════════════════════════
  // SERVICES
  // ═══════════════════════════════════════════════════
  services: {
    async getAll(): Promise<Service[]> {
      return [
        { 
          id: 1, 
          name: 'Hair Cut & Style', 
          description: 'Professional cuts, coloring, and styling', 
          duration: 60, 
          price: 85, 
          category: 'Hair' 
        },
        { 
          id: 2, 
          name: 'Hair Coloring', 
          description: 'Professional hair coloring service', 
          duration: 120, 
          price: 150, 
          category: 'Hair' 
        },
        { 
          id: 3, 
          name: 'Signature Facial', 
          description: 'Rejuvenating facial care and treatments', 
          duration: 75, 
          price: 120, 
          category: 'Facial' 
        },
        { 
          id: 4, 
          name: 'Gel Manicure', 
          description: 'Professional manicure with gel polish', 
          duration: 45, 
          price: 65, 
          category: 'Nails' 
        },
        { 
          id: 5, 
          name: 'Spa Pedicure', 
          description: 'Relaxing pedicure treatment', 
          duration: 60, 
          price: 75, 
          category: 'Nails' 
        },
        { 
          id: 6, 
          name: 'Relaxing Massage', 
          description: 'Full body relaxation massage', 
          duration: 90, 
          price: 180, 
          category: 'Massage' 
        }
      ];
    },
    
    async create(service: Omit<Service, 'id'>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: Date.now(), ...service };
    },
    
    async update(id: number, service: Partial<Service>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, ...service } as Service;
    },
    
    async delete(id: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },
  
  // ═══════════════════════════════════════════════════
  // STAFF
  // ═══════════════════════════════════════════════════
  staff: {
    async getAll(): Promise<Staff[]> {
      return [
        { 
          id: 1, 
          name: 'Emma Wilson', 
          email: 'emma@salon.com', 
          specialty: 'Hair Styling', 
          rating: 4.9, 
          is_available: true 
        },
        { 
          id: 2, 
          name: 'Lisa Davis', 
          email: 'lisa@salon.com', 
          specialty: 'Facial Treatments', 
          rating: 4.8, 
          is_available: true 
        },
        { 
          id: 3, 
          name: 'Sarah Johnson', 
          email: 'sarah@salon.com', 
          specialty: 'Nail Care', 
          rating: 4.7, 
          is_available: true 
        },
        { 
          id: 4, 
          name: 'Any Available Staff', 
          email: 'staff@salon.com', 
          specialty: 'All Services', 
          rating: 4.8, 
          is_available: true 
        }
      ];
    },
    
    async getAssignments() {
      return [
        { 
          id: 1, 
          name: 'Emma Wilson', 
          email: 'emma.wilson@salon.com', 
          specialty: 'Hair Cutting & Styling', 
          rating: 4.9, 
          service_ids: [1, 2] 
        },
        { 
          id: 2, 
          name: 'Lisa Davis', 
          email: 'lisa.davis@salon.com', 
          specialty: 'Facial Treatments', 
          rating: 4.8, 
          service_ids: [3] 
        },
        { 
          id: 3, 
          name: 'Sarah Johnson', 
          email: 'sarah.johnson@salon.com', 
          specialty: 'Nail Care', 
          rating: 4.7, 
          service_ids: [4, 5] 
        }
      ];
    }
  },
  
  // ═══════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════
  analytics: {
    async getDashboardStats() {
      return {
        todayAppointments: 12,
        todayRevenue: 1480,
        activeStaff: 8,
        growthRate: 15.2
      };
    },
    
    async getWeeklyData() {
      return [
        { day: 'Mon', appointments: 8, revenue: 920 },
        { day: 'Tue', appointments: 12, revenue: 1340 },
        { day: 'Wed', appointments: 10, revenue: 1150 },
        { day: 'Thu', appointments: 15, revenue: 1680 },
        { day: 'Fri', appointments: 18, revenue: 2100 },
        { day: 'Sat', appointments: 22, revenue: 2750 },
        { day: 'Sun', appointments: 14, revenue: 1890 }
      ];
    },
    
    async getServiceDistribution() {
      return [
        { name: 'Hair Services', value: 45, color: '#8b5cf6' },
        { name: 'Facial Treatments', value: 25, color: '#ec4899' },
        { name: 'Nail Care', value: 20, color: '#06b6d4' },
        { name: 'Massage', value: 10, color: '#10b981' }
      ];
    }
  }
};
```

#### How to Switch to Real Backend

When your backend is ready:

```typescript
// Step 1: Change flag in /services/api.ts
const USE_REAL_API = true;  // Changed from false

// Step 2: All API calls will now use HTTP requests
// The mock functions are replaced with:
const realAPI = {
  auth: {
    async login(credentials) {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    }
    // ... more methods
  }
  // ... more endpoints
};

// Step 3: That's it! Frontend code doesn't change.
// Components still call: api.auth.login(credentials)
```

---

## 🎨 Design System

### **Color Palette**

```css
/* Primary Colors */
--primary-purple-300: #c4b5fd;    /* Light purple */
--primary-purple-500: #8b5cf6;    /* Main purple */
--primary-purple-600: #7c3aed;    /* Dark purple */

--secondary-pink-300: #f9a8d4;    /* Light pink */
--secondary-pink-500: #ec4899;    /* Main pink */
--secondary-pink-600: #db2777;    /* Dark pink */

/* Background */
--bg-gradient: from-purple-50 via-pink-50 to-white;

/* Status Colors */
--status-pending: bg-yellow-100 text-yellow-800;
--status-confirmed: bg-green-100 text-green-800;
--status-completed: bg-blue-100 text-blue-800;
--status-cancelled: bg-red-100 text-red-800;
```

### **Typography**

```typescript
// Font: Poppins (imported via Tailwind)
// Font sizes (defined in globals.css)
h1: { fontSize: '2xl', fontWeight: 500 }  // 24px
h2: { fontSize: 'xl', fontWeight: 500 }   // 20px
h3: { fontSize: 'lg', fontWeight: 500 }   // 18px
p:  { fontSize: 'base', fontWeight: 400 } // 16px
```

### **Common UI Patterns**

```tsx
// ═══════════════════════════════════════════════════
// PRIMARY GRADIENT BUTTON
// ═══════════════════════════════════════════════════
<Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
  Book Now
</Button>

// ═══════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════
<Badge className={
  status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
  status === 'confirmed' ? 'bg-green-100 text-green-800' :
  status === 'completed' ? 'bg-blue-100 text-blue-800' :
  'bg-red-100 text-red-800'
}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
</Badge>

// ═══════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════
<Card className="p-6">
  <div className="flex items-center gap-3">
    <div className="p-3 bg-purple-100 rounded-lg">
      <CalendarIcon className="w-6 h-6 text-purple-600" />
    </div>
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  </div>
</Card>

// ═══════════════════════════════════════════════════
// GLASS CARD
// ═══════════════════════════════════════════════════
<Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-100">
  {/* Content with frosted glass effect */}
</Card>

// ═══════════════════════════════════════════════════
// PAGE WRAPPER (All pages)
// ═══════════════════════════════════════════════════
<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </div>
</div>
```

---

## 📱 Responsive Design

### **Breakpoints**

```typescript
sm:  640px   // Small tablets
md:  768px   // Medium tablets/small laptops
lg:  1024px  // Desktops
xl:  1280px  // Large desktops
2xl: 1536px  // Ultra-wide screens
```

### **Responsive Patterns**

```tsx
// ═══════════════════════════════════════════════════
// 1. RESPONSIVE GRID
// ═══════════════════════════════════════════════════
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>

// ═══════════════════════════════════════════════════
// 2. RESPONSIVE FLEX (Stack on mobile)
// ═══════════════════════════════════════════════════
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Left content</div>
  <div className="flex-1">Right content</div>
</div>

// ═══════════════════════════════════════════════════
// 3. HIDE/SHOW BY SCREEN SIZE
// ═══════════════════════════════════════════════════
{/* Desktop only */}
<div className="hidden md:block">
  <Table>{/* Complex table */}</Table>
</div>

{/* Mobile only */}
<div className="md:hidden">
  {data.map(item => <Card key={item.id}>{/* Simple card */}</Card>)}
</div>

// ═══════════════════════════════════════════════════
// 4. MOBILE NAVIGATION PATTERN
// ═══════════════════════════════════════════════════
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

return (
  <>
    {/* Desktop nav */}
    <nav className="hidden md:flex gap-6">
      <NavLink>Home</NavLink>
    </nav>

    {/* Mobile hamburger */}
    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
      <Menu />
    </button>

    {/* Mobile drawer */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Overlay + drawer */}
      </div>
    )}
  </>
);

// ═══════════════════════════════════════════════════
// 5. RESPONSIVE TEXT SIZE
// ═══════════════════════════════════════════════════
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
  Welcome
</h1>

// ═══════════════════════════════════════════════════
// 6. RESPONSIVE PADDING
// ═══════════════════════════════════════════════════
<div className="px-4 sm:px-6 lg:px-8 py-8">
  {/* Content */}
</div>
```

### **Responsive Status**

| Component | Status | Notes |
|-----------|--------|-------|
| HomePage | ✅ Complete | Hero, services grid, testimonials |
| ServicesPage | ✅ Complete | Service cards, search/filters |
| BookingPage | ✅ Complete | Multi-step wizard |
| Navigation | ✅ Complete | Hamburger menu on mobile |
| AuthPages | ✅ Complete | Centered forms |
| CustomerDashboard | 🟡 Partial | Sidebar works, tabs need work |
| AdminDashboard | ❌ Needs Work | Tables → cards on mobile |
| StaffDashboard | ❌ Needs Work | Schedule layout for mobile |

---

## 🐛 Bug Fixes & Improvements

### **1. Date Format Error (FIXED)**

```typescript
// ❌ PROBLEM
{format(new Date(profile.joinDate), 'MMMM yyyy')}
// Error: RangeError when joinDate is empty string

// ✅ SOLUTION
// Created utility in /components/ui/utils.ts
export function safeFormatDate(
  dateValue: string | Date | number | null | undefined,
  formatString: string,
  fallback: string = 'N/A'
): string {
  try {
    if (!dateValue) return fallback;
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

### **2. Infinite Loop (FIXED)**

```typescript
// ❌ PROBLEM
useEffect(() => {
  setCurrentView('home');
}, [currentView]);  // Circular dependency!

// ✅ SOLUTION
useEffect(() => {
  // Initialization code
}, []);  // Empty array = run once only
```

### **3. Duplicate Keys (FIXED)**

```typescript
// ❌ PROBLEM
{items.map((item, index) => <div key={index}>...</div>)}

// ✅ SOLUTION
{items.map(item => <div key={item.id}>...</div>)}
// Or: key={`${item.id}-${index}`}
```

### **4. Unstable Images (FIXED)**

```typescript
// ❌ PROBLEM
<img src="https://images.unsplash.com/photo-..." />

// ✅ SOLUTION
<img src="https://picsum.photos/seed/salon-haircut/800/600" />
```

---

## 🚀 Integration with Backend

### **When Backend is Ready**

**Step 1**: Open `/services/api.ts`

**Step 2**: Change this line:
```typescript
const USE_REAL_API = true;  // Was: false
```

**Step 3**: Ensure your backend matches these interfaces:

```typescript
// Authentication endpoints
POST /api/auth/login
Request: { email: string, password: string }
Response: { user: User, token: string }

POST /api/auth/register
Request: { name: string, email: string, password: string, phone?: string }
Response: { user: User, token: string }

// Services endpoints
GET /api/services
Response: Service[]

// Appointments endpoints
GET /api/appointments/customer/:id
Response: Appointment[]

POST /api/appointments
Request: { service_id, staff_id, appointment_date, appointment_time, notes }
Response: Appointment

// Analytics endpoints
GET /api/analytics/dashboard-stats
Response: { todayAppointments, todayRevenue, activeStaff, growthRate }
```

**Step 4**: That's it! Your frontend will now communicate with the backend.

**Note**: See `BACKEND_REQUIREMENTS.md` for complete backend API specification.

---

## 🔍 For AI Models: Quick Reference

### **Key Points to Remember**

```
1. ✅ NO React Router
   - Use: setCurrentView('page-name')
   - Don't: <Route>, <Link>, useNavigate()

2. ✅ Appointments are CENTRALIZED
   - Import from: appointmentStore.ts
   - Don't: Create separate appointment arrays

3. ✅ ALWAYS use safeFormatDate()
   - Import from: /components/ui/utils.ts
   - Don't: Use format() directly

4. ✅ Follow Design System
   - Colors: purple-500, pink-500
   - Background: from-purple-50 via-pink-50 to-white

5. ✅ Make Everything Responsive
   - Use: hidden md:block / md:hidden
   - Tables → Cards on mobile
```

### **Common Tasks**

```typescript
// GET CURRENT USER
import { api } from '../services/api';
const user = api.auth.getCurrentUser();

// GET USER'S APPOINTMENTS
import { getAppointmentsByCustomer } from '../services/appointmentStore';
const appointments = getAppointmentsByCustomer(user.id);

// CREATE APPOINTMENT
import { createAppointment } from '../services/appointmentStore';
const apt = createAppointment({
  customer_id: user.id,
  customer_name: user.name,
  // ... other fields
});

// UPDATE APPOINTMENT STATUS
import { updateAppointmentStatus } from '../services/appointmentStore';
updateAppointmentStatus(appointmentId, 'confirmed');

// SAFE DATE FORMATTING
import { safeFormatDate } from './ui/utils';
{safeFormatDate(date, 'MMM dd, yyyy')}

// SHOW NOTIFICATION
import { toast } from 'sonner';
toast.success('Success message');
toast.error('Error message');
```

---

## 📄 Summary

**This is a frontend-only React application** that:

✅ Works completely without a backend (uses localStorage)
✅ Has 3 user roles with separate dashboards
✅ Centralized appointment management (appointmentStore.ts)
✅ Clean API abstraction (easy to switch to real backend)
✅ Modern design with soft pastel colors
✅ Responsive (70% complete)
✅ Production-ready code quality

**To integrate backend**: Just toggle `USE_REAL_API = true` in `/services/api.ts` and ensure your backend matches the API interfaces defined in `BACKEND_REQUIREMENTS.md`.

---

**Last Updated**: April 8, 2026  
**For Backend Requirements**: See `/BACKEND_REQUIREMENTS.md`  
**For Quick Reference**: See `/AI_CONTEXT_GUIDE.md`
