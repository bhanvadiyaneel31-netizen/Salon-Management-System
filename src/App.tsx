import { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ServicesPage } from './components/ServicesPage';
import { AuthPages } from './components/AuthPages';
import { BookingPage } from './components/BookingPage';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { api } from './services/api';
import { initializeSampleAppointments } from './services/appointmentStore';
export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('salon_dark_mode');
    return saved === 'true';
  });

  // Check for existing authentication on app load
  useEffect(() => {
    // Initialize sample appointments for demo
    initializeSampleAppointments();
    
    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
      setUserRole(currentUser.role);
      
      // Auto-redirect to appropriate dashboard if user is logged in
      // Only redirect on initial load (when current view is one of the public pages)
      if (currentView === 'home' || currentView === 'login' || currentView === 'register') {
        switch (currentUser.role) {
          case 'admin':
            setCurrentView('admin-dashboard');
            break;
          case 'staff':
            setCurrentView('staff-dashboard');
            break;
          case 'customer':
            setCurrentView('customer-dashboard');
            break;
        }
      }
    }
  }, []); // Empty dependency array - only run once on mount

  // Apply/remove dark class on <html> whenever isDark changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('salon_dark_mode', String(isDark));
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage setCurrentView={setCurrentView} />;
      case 'login':
        return <AuthPages view="login" setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'register':
        return <AuthPages view="register" setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'booking':
        return <BookingPage setCurrentView={setCurrentView} />;
      case 'customer-dashboard':
        return <CustomerDashboard setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'admin-dashboard':
        return <AdminDashboard setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'staff-dashboard':
        return <StaffDashboard setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'services':
        return <ServicesPage setCurrentView={setCurrentView} />;
      case 'contact':
        return <HomePage setCurrentView={setCurrentView} />; // Reusing homepage for now
      default:
        return <HomePage setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        userRole={userRole}
        setUserRole={setUserRole}
        isDark={isDark}
        toggleDark={toggleDark}
      />
      {renderView()}
      <Toaster />
    </div>
  );
}