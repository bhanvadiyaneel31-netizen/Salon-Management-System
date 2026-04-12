# AI Model Context Guide - Quick Reference

**Use this guide when explaining this project to other AI models like ChatGPT, Claude, etc.**

---

## 🎯 One-Sentence Summary
A responsive salon booking website built with React + TypeScript + Tailwind CSS v4, featuring role-based dashboards (Customer/Staff/Admin), a 4-step booking wizard, centralized localStorage-based appointment management, and analytics with charts. Currently frontend-only with mock data.

---

## 📦 Essential Copy-Paste Context

### For General Questions
```
I'm working on a FRONTEND-ONLY salon booking website with:
- Frontend: React 18, TypeScript, Tailwind CSS v4, shadcn/ui
- Backend: NOT INCLUDED (using mock data, see BACKEND_REQUIREMENTS.md)
- State: localStorage + centralized appointmentStore
- Design: Soft pastel (lavender #8b5cf6, pink #ec4899), rounded, minimalistic

Key features:
- 3 user roles with separate dashboards (Customer, Staff, Admin)
- Customer self-registration, staff/admin demo accounts
- 4-step booking flow (service → date/time → staff → confirm)
- All appointments stored in centralized appointmentStore.ts
- Appointments visible across all dashboards
- Analytics with Recharts (Bar/Pie charts)

Project structure:
- Single-page app with view switching (NO React Router)
- 7 main components: HomePage, ServicesPage, BookingPage, AuthPages, CustomerDashboard, StaffDashboard, AdminDashboard
- appointmentStore.ts manages all appointment CRUD operations in localStorage
- api.ts handles mock authentication and data
- 40+ shadcn/ui components in /components/ui/

Current state:
- Core features complete ✅
- Home, Services, Booking, Auth pages fully responsive ✅
- CustomerDashboard partially responsive ✅
- AdminDashboard and StaffDashboard need mobile optimization ❌
- Backend integration ready (just toggle USE_REAL_API flag)
```

### For Responsive Design Work
```
I'm making [COMPONENT] responsive following these patterns already used in the project:

Responsive grid:
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

Responsive flex:
  className="flex flex-col md:flex-row gap-4"

Mobile/Desktop toggle:
  className="hidden md:block" // Desktop only
  className="md:hidden"       // Mobile only

Mobile menu pattern:
  const [isOpen, setIsOpen] = useState(false);
  
  // Hamburger button (mobile only)
  <button className="md:hidden" onClick={() => setIsOpen(true)}>
    <Menu />
  </button>
  
  // Desktop menu
  <nav className="hidden md:flex">...</nav>
  
  // Mobile drawer
  {isOpen && <div className="fixed inset-0 z-50 md:hidden">...</div>}

Tables to cards on mobile:
  <div className="hidden md:block">
    <Table>...</Table> {/* Desktop table */}
  </div>
  <div className="block md:hidden">
    {data.map(item => <Card>...</Card>)} {/* Mobile cards */}
  </div>

Already responsive: HomePage, ServicesPage, BookingPage, Navigation, CustomerDashboard (partial)
Need responsive: AdminDashboard, StaffDashboard
```

### For Data/State Management
```
This project uses centralized appointment management via appointmentStore.ts:

Key functions:
  getAllAppointments()                    // Get all appointments
  getAppointmentsByCustomer(customerId)   // Filter by customer
  getAppointmentsByStaff(staffId)         // Filter by staff
  getAppointmentsByDate(date)             // Filter by date
  createAppointment(data)                 // Create new appointment
  updateAppointment(id, updates)          // Update existing
  updateAppointmentStatus(id, status)     // Change status
  deleteAppointment(id)                   // Delete appointment
  getUpcomingAppointments()               // Future appointments
  getTodayAppointments()                  // Today's schedule

Appointment structure:
  {
    id: string (APT + timestamp),
    customer_id: number,
    customer_name: string,
    customer_email: string,
    staff_id: number | null,
    staff_name: string | null,
    service_id: number,
    service_name: string,
    appointment_date: "YYYY-MM-DD",
    appointment_time: "HH:MM",
    status: "pending" | "confirmed" | "completed" | "cancelled",
    notes?: string,
    booked_by: "customer" | "admin" | "staff"
  }

Authentication:
  api.auth.getCurrentUser()      // Get logged in user
  api.auth.login(credentials)    // Login
  api.auth.register(userData)    // Register (customer only)
  api.auth.logout()              // Logout

All data persists in localStorage (appointments in 'salon_appointments', user in 'user')
```

### For Bug Fixes
```
Recent bugs fixed (avoid these patterns):

❌ BAD - Infinite loop:
  useEffect(() => {
    setCurrentView('home');
  }, [currentView]); // Depends on value it modifies!

✅ GOOD:
  useEffect(() => {
    // Initialization code
  }, []); // Empty dependency array - runs once

❌ BAD - Date formatting:
  format(new Date(profile.joinDate), 'MMMM yyyy') // Crashes if empty

✅ GOOD:
  safeFormatDate(profile.joinDate, 'MMMM yyyy') // Returns 'N/A' if invalid

❌ BAD - Non-unique keys:
  {items.map((item, index) => <div key={index}>...</div>)}

✅ GOOD:
  {items.map(item => <div key={item.id}>...</div>)}

❌ BAD - Unstable image URLs:
  https://images.unsplash.com/photo-...

✅ GOOD:
  https://picsum.photos/seed/{unique}/800/600

Utilities to use:
  - safeFormatDate() for all date formatting (/components/ui/utils.ts)
  - Unique keys for all .map() iterations
  - Picsum Photos for images
```

### For Component Development
```
Component structure pattern used throughout:

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { getAppointmentsByCustomer } from "../services/appointmentStore";

interface ComponentProps {
  setCurrentView: (view: string) => void;
  setUserRole?: (role: string | null) => void;
}

export function Component({ setCurrentView, setUserRole }: ComponentProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Load data once on mount
    const loadData = async () => {
      try {
        const result = await api.someEndpoint();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Empty array - run once
  
  const handleAction = () => {
    // Handle user action
    toast.success('Action completed');
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Component content */}
      </div>
    </div>
  );
}

Design patterns to follow:
- Use shadcn/ui components (Button, Card, Input, etc.)
- Soft pastel gradient background: from-purple-50 via-pink-50 to-white
- Max width container: max-w-7xl mx-auto
- Responsive padding: px-4 sm:px-6 lg:px-8
- Use toast notifications for user feedback (from "sonner")
- Check authentication: api.auth.getCurrentUser()
```

---

## 🔑 Key Files Reference

When AI needs to understand specific parts:

| File | Purpose | When to Reference |
|------|---------|-------------------|
| `/App.tsx` | Main app structure, view switching | Understanding app flow, navigation |
| `/services/appointmentStore.ts` | All appointment CRUD operations | Working with appointments |
| `/services/api.ts` | API layer, mock data | Understanding data structure, API calls |
| `/components/CustomerDashboard.tsx` | Complex dashboard example | Building dashboard features |
| `/components/BookingPage.tsx` | Multi-step wizard pattern | Creating step-by-step flows |
| `/components/Navigation.tsx` | Responsive navigation | Implementing mobile menus |
| `/components/ui/utils.ts` | Utility functions | Date formatting, helpers |
| `/styles/globals.css` | Design tokens, base styles | Understanding theme/colors |
| `/BACKEND_REQUIREMENTS.md` | Backend API specification | Building backend API |

---

## 🎨 Design System Quick Reference

### Colors (Tailwind Classes)
```css
Primary: purple-400, purple-500, purple-600 (#8b5cf6)
Secondary: pink-400, pink-500, pink-600 (#ec4899)
Background: purple-50, pink-50, white
Text: gray-600, gray-700, gray-800, gray-900
Success: green-500
Error: red-500
Warning: yellow-500
```

### Common Patterns
```tsx
// Gradient background (used everywhere)
className="bg-gradient-to-br from-purple-50 via-pink-50 to-white"

// Primary button
<Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
  Button Text
</Button>

// Card
<Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-100">
  Content
</Card>

// Status badge
<Badge className="bg-yellow-100 text-yellow-800"> {/* pending */}
<Badge className="bg-green-100 text-green-800"> {/* confirmed */}
<Badge className="bg-blue-100 text-blue-800">   {/* completed */}
<Badge className="bg-red-100 text-red-800">     {/* cancelled */}

// Stat card
<Card className="p-6">
  <div className="flex items-center gap-3">
    <div className="p-3 bg-purple-100 rounded-lg">
      <Icon className="w-6 h-6 text-purple-600" />
    </div>
    <div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  </div>
</Card>
```

---

## 🚨 Common Mistakes to Avoid

### 1. ❌ Modifying Protected Files
```
DO NOT edit: /components/figma/ImageWithFallback.tsx (system file)
```

### 2. ❌ Installing React Router
```
This project uses view switching, NOT React Router.
Use: setCurrentView('page-name')
Don't use: <Route>, <Link>, useNavigate
```

### 3. ❌ Creating Separate Appointment Arrays
```
❌ BAD: const [appointments, setAppointments] = useState([...])
✅ GOOD: Import from appointmentStore: 
         import { getAllAppointments, createAppointment } from '../services/appointmentStore'
```

### 4. ❌ Direct Date Formatting
```
❌ BAD: format(new Date(date), 'format')
✅ GOOD: safeFormatDate(date, 'format')
```

### 5. ❌ Non-Responsive Tables
```
❌ BAD: Just using <Table> component everywhere
✅ GOOD: 
  <div className="hidden md:block"><Table /></div>
  <div className="md:hidden">{data.map(item => <Card />)}</div>
```

---

## 📋 Quick Prompts for Common Tasks

### Add New Service
```
Add a new service called "[Service Name]" to the mock data in /services/api.ts.
Include: name, description, duration (in minutes), price, and category.
Follow the existing pattern in mockAPI.services.getAll()
```

### Make Component Responsive
```
Make [Component Name] responsive by:
1. Converting the table to cards on mobile (< md breakpoint)
2. Stacking elements vertically on mobile, horizontally on desktop
3. Adjusting text sizes (text-xl sm:text-2xl lg:text-3xl)
4. Following patterns from Navigation.tsx and HomePage.tsx

Current component code: [PASTE CODE]
```

### Fix Appointment Display Issue
```
Appointments aren't showing in [Dashboard]. 

Current implementation: [PASTE CODE]

Make sure to:
1. Import from appointmentStore: import { getAppointmentsByCustomer } from '../services/appointmentStore'
2. Get current user: const currentUser = api.auth.getCurrentUser()
3. Filter appointments: const userAppointments = getAppointmentsByCustomer(currentUser.id)
4. Update on mount: useEffect(() => { /* load */ }, [])
```

### Add New Dashboard Tab
```
Add a new tab called "[Tab Name]" to CustomerDashboard with:
- Tab button in the sidebar
- Content section in main area
- State update: activeTab === 'new-tab-name'

Follow the pattern of existing tabs (Overview, Services, Appointments, Profile)
```

---

## 🔍 Debugging Checklist

When something's not working:

**Authentication Issues:**
- [ ] Check localStorage: console.log(localStorage.getItem('user'))
- [ ] Verify getCurrentUser() returns user object
- [ ] Check userRole state is set correctly

**Appointment Issues:**
- [ ] Check appointments in localStorage: console.log(localStorage.getItem('salon_appointments'))
- [ ] Verify filter logic (customer_id matches, date format correct)
- [ ] Ensure status is one of: 'pending', 'confirmed', 'completed', 'cancelled'

**Rendering Issues:**
- [ ] Check for unique keys in .map()
- [ ] Look for console errors (date formatting, missing dependencies)
- [ ] Verify useEffect dependencies are correct (no circular deps)

**Styling Issues:**
- [ ] Check Tailwind classes are correct (no typos)
- [ ] Verify responsive breakpoints (sm, md, lg, xl)
- [ ] Ensure parent has proper layout (flex, grid)

---

## 🎯 Priority Tasks (Current)

**High Priority:**
1. Make AdminDashboard mobile-responsive (tables → cards)
2. Make StaffDashboard mobile-responsive (simplified schedule view)
3. Complete CustomerDashboard responsiveness (remaining tab content)

**Medium Priority:**
4. Add appointment reminders
5. Implement loyalty program features
6. Add review/rating system

**Low Priority:**
7. Dark mode toggle
8. Multi-language support
9. Export reports feature

---

## ✨ Success Criteria

A change is successful if:
- ✅ Works on mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- ✅ Uses appointmentStore for appointment data (not separate state)
- ✅ Uses safeFormatDate for date formatting
- ✅ Follows design system (lavender/pink colors, rounded corners)
- ✅ Uses shadcn/ui components (not custom HTML elements)
- ✅ Has proper TypeScript types
- ✅ No console errors or warnings
- ✅ Maintains role-based access control
- ✅ Shows toast notifications for user actions
- ✅ Handles loading and error states

---

**Last Updated:** April 8, 2026

**Quick Links:**
- Frontend Guide: `/COMPLETE_PROJECT_GUIDE.md`
- Backend Requirements: `/BACKEND_REQUIREMENTS.md`
- Bug Fix Docs: `/BUGFIX_*.md`
- Customer Guide: `/CUSTOMER_REGISTRATION_GUIDE.md`