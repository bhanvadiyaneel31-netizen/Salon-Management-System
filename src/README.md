# 💇 Salon Appointment Booking System

A modern, responsive salon booking website built with **React 18**, **TypeScript**, and **Tailwind CSS v4**.

![Status](https://img.shields.io/badge/status-frontend_complete-success)
![Backend](https://img.shields.io/badge/backend-not_included-orange)
![Responsive](https://img.shields.io/badge/responsive-70%25-yellow)

---

## 🌟 Key Features

- ✅ **3 User Roles**: Customer, Staff, and Admin dashboards
- ✅ **4-Step Booking Wizard**: Intuitive appointment booking flow
- ✅ **Centralized State**: localStorage-based appointment management
- ✅ **Modern UI**: Soft pastel design (lavender & pink) with 40+ shadcn/ui components
- ✅ **Analytics Dashboard**: Charts and reports using Recharts
- ✅ **Role-Based Access**: Secure authentication with demo accounts
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop (70% complete)

---

## 🚀 Quick Start

### **Demo Accounts**

```
Customer: customer@example.com | password: any
Staff:    staff@example.com    | password: any
Admin:    admin@example.com    | password: any
```

### **Current State**

This is a **frontend-only** application using mock data:
- ✅ All core features implemented
- ✅ Mock authentication with localStorage
- ✅ Sample appointments for demo
- ⚠️ No backend included (see integration guide below)

---

## 📁 Project Structure

```
/
├── App.tsx                          # Main entry point
├── services/
│   ├── api.ts                       # API abstraction layer (mock data)
│   └── appointmentStore.ts          # Centralized appointment management
├── components/
│   ├── HomePage.tsx                 # Landing page
│   ├── ServicesPage.tsx             # Service catalog
│   ├── BookingPage.tsx              # 4-step booking wizard
│   ├── AuthPages.tsx                # Login/Register
│   ├── CustomerDashboard.tsx        # Customer portal
│   ├── StaffDashboard.tsx           # Staff schedule
│   ├── AdminDashboard.tsx           # Admin panel with analytics
│   └── ui/                          # 40+ shadcn/ui components
└── styles/
    └── globals.css                  # Tailwind v4 config
```

---

## 🎨 Design System

### **Colors**
- Primary: `#8b5cf6` (Purple)
- Secondary: `#ec4899` (Pink)
- Background: Gradient from purple-50 via pink-50 to white

### **Typography**
- Font: Poppins
- Base size: 16px

### **Components**
All UI components are from shadcn/ui with custom styling to match the design system.

---

## 💡 How It Works

### **1. State Management**

```typescript
// Centralized appointment store (localStorage)
import { createAppointment, getAllAppointments } from '../services/appointmentStore';

// Create appointment
const apt = createAppointment({
  customer_id: 1,
  service_id: 1,
  appointment_date: "2026-04-15",
  appointment_time: "10:00",
  status: "pending"
});

// Get all appointments
const appointments = getAllAppointments();
```

### **2. Authentication**

```typescript
// Mock authentication (no backend needed)
import { api } from '../services/api';

// Login
const { user, token } = await api.auth.login({ email, password });

// Get current user
const currentUser = api.auth.getCurrentUser();
```

### **3. View Navigation**

```typescript
// NO React Router - uses view switching
setCurrentView('customer-dashboard');
setCurrentView('booking');
setCurrentView('home');
```

---

## 🔌 Backend Integration

This frontend is **ready for backend integration**. Just follow these steps:

### **Step 1: Implement Backend**

See [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md) for complete API specification including:
- Database schema
- All API endpoints
- Request/response formats
- Security requirements
- Sample data

### **Step 2: Connect Frontend**

Open `/services/api.ts` and change:
```typescript
const USE_REAL_API = true;  // Was: false
```

That's it! Frontend will now use your backend API.

---

## 📚 Documentation

### **For Developers**
- [`COMPLETE_PROJECT_GUIDE.md`](./COMPLETE_PROJECT_GUIDE.md) - Complete frontend architecture and implementation guide
- [`AI_CONTEXT_GUIDE.md`](./AI_CONTEXT_GUIDE.md) - Quick reference for AI assistants

### **For Backend Developers**
- [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md) - Everything needed to build compatible backend

### **Other Docs**
- [`CUSTOMER_REGISTRATION_GUIDE.md`](./CUSTOMER_REGISTRATION_GUIDE.md) - User registration flow
- `BUGFIX_*.md` - Bug fixes and solutions

---

## 🐛 Known Issues & Solutions

### **Date Formatting Errors**
❌ Problem: `format(new Date(date), 'format')` crashes on empty values  
✅ Solution: Use `safeFormatDate(date, 'format')` from `/components/ui/utils.ts`

### **Infinite Loops**
❌ Problem: `useEffect(() => {...}, [state])` with circular dependency  
✅ Solution: Use `useEffect(() => {...}, [])` for initialization

### **Non-Unique Keys**
❌ Problem: `key={index}` in `.map()`  
✅ Solution: Use `key={item.id}` or `key={`${item.id}-${index}`}`

---

## 🚧 Responsive Design Status

| Component | Status | Notes |
|-----------|--------|-------|
| HomePage | ✅ Complete | Hero, services, testimonials |
| ServicesPage | ✅ Complete | Service cards, filters |
| BookingPage | ✅ Complete | 4-step wizard |
| Navigation | ✅ Complete | Hamburger menu on mobile |
| AuthPages | ✅ Complete | Login/register forms |
| CustomerDashboard | 🟡 Partial | Sidebar works, tabs need refinement |
| AdminDashboard | ❌ Todo | Tables → cards on mobile |
| StaffDashboard | ❌ Todo | Schedule needs mobile layout |

---

## 🎯 Next Steps

### **High Priority**
1. Complete AdminDashboard mobile responsiveness
2. Complete StaffDashboard mobile responsiveness
3. Finish CustomerDashboard responsive work

### **Medium Priority**
4. Integrate with backend (using BACKEND_REQUIREMENTS.md)
5. Add email notifications
6. Implement loyalty program

### **Low Priority**
7. Dark mode
8. Multi-language support
9. PDF report exports

---

## 💻 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 18 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Date Handling** | date-fns |
| **Notifications** | Sonner |
| **State** | React useState + localStorage |

---

## 🤝 For AI Assistants

When working with this project:

1. **Read** [`COMPLETE_PROJECT_GUIDE.md`](./COMPLETE_PROJECT_GUIDE.md) for full architecture
2. **Reference** [`AI_CONTEXT_GUIDE.md`](./AI_CONTEXT_GUIDE.md) for quick patterns
3. **Remember**: NO React Router, uses `setCurrentView()`
4. **Always**: Import from `appointmentStore.ts` for appointments
5. **Always**: Use `safeFormatDate()` for date formatting

---

## 📝 License

This is a demonstration project. Feel free to use as reference or starting point for your own salon booking system.

---

## 🆘 Support

- **Frontend Questions**: See [`COMPLETE_PROJECT_GUIDE.md`](./COMPLETE_PROJECT_GUIDE.md)
- **Backend Questions**: See [`BACKEND_REQUIREMENTS.md`](./BACKEND_REQUIREMENTS.md)
- **Quick Reference**: See [`AI_CONTEXT_GUIDE.md`](./AI_CONTEXT_GUIDE.md)

---

**Last Updated**: April 8, 2026  
**Status**: Frontend Complete, Backend Ready for Integration
