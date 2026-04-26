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
import { Sidebar } from './components/Sidebar';
import { Sheet, SheetContent } from './components/ui/sheet';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { api } from './services/api';
import { initializeSampleAppointments } from './services/appointmentStore';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('salon_dark_mode');
    return saved === 'true';
  });

  // Check for existing authentication on app load
  useEffect(() => {
    initializeSampleAppointments();

    // Check for Google Auth success redirect
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    if (path === '/auth-success' && token) {
      // Store token and clean URL
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, "/");

      // Fetch user data with the new token
      api.auth.getMe().then(user => {
        localStorage.setItem('user', JSON.stringify(user));
        setUserRole(user.role);

        // Set view based on role
        if (user.role === 'customer') setCurrentView('customer-dashboard');
        else if (user.role === 'admin') setCurrentView('admin-dashboard');
        else if (user.role === 'staff') setCurrentView('staff-dashboard');
      }).catch(err => {
        console.error('Failed to fetch user after Google Auth:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setCurrentView('login');
      });
      return;
    }

    // Check for Password Reset token in URL
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/').pop();
      if (token) {
        setResetToken(token);
        setCurrentView('reset-password');
        window.history.replaceState({}, document.title, "/");
        return;
      }
    }

    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
      setUserRole(currentUser.role);
      if (currentView === 'home' || currentView === 'login' || currentView === 'register') {
        switch (currentUser.role) {
          case 'admin': setCurrentView('admin-dashboard'); break;
          case 'staff': setCurrentView('staff-dashboard'); break;
          case 'customer': setCurrentView('customer-dashboard'); break;
        }
      }
    }
  }, []);


  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
    localStorage.setItem('salon_dark_mode', String(isDark));
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);
  const handleLogout = () => {
    api.auth.logout();
    setUserRole(null);
    setCurrentView('home');
    setActiveSection('dashboard');
  };

  const isDashboard = currentView.includes('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage setCurrentView={setCurrentView} setPreselectedServiceId={setPreselectedServiceId} />;
      case 'login':
        return <AuthPages view="login" setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'register':
        return <AuthPages view="register" setCurrentView={setCurrentView} setUserRole={setUserRole} />;
      case 'booking':
        return <BookingPage setCurrentView={setCurrentView} initialServiceId={preselectedServiceId} onResetSelection={() => setPreselectedServiceId(null)} />;
      case 'customer-dashboard':
        return <CustomerDashboard activeSection={activeSection} setActiveSection={setActiveSection} setCurrentView={setCurrentView} setUserRole={setUserRole} setPreselectedServiceId={setPreselectedServiceId} isDark={isDark} toggleDark={toggleDark} />;
      case 'admin-dashboard':
        return <AdminDashboard activeSection={activeSection} setActiveSection={setActiveSection} setCurrentView={setCurrentView} setUserRole={setUserRole} isDark={isDark} toggleDark={toggleDark} />;
      case 'staff-dashboard':
        return <StaffDashboard activeSection={activeSection} setActiveSection={setActiveSection} setCurrentView={setCurrentView} setUserRole={setUserRole} isDark={isDark} toggleDark={toggleDark} />;
      case 'services':
        return <ServicesPage setCurrentView={setCurrentView} setPreselectedServiceId={setPreselectedServiceId} />;
      case 'forgot-password':
        return <ForgotPasswordPage setCurrentView={setCurrentView} />;
      case 'reset-password':
        return <ResetPasswordPage token={resetToken || ''} setCurrentView={setCurrentView} />;
      case 'contact':
        return <HomePage setCurrentView={setCurrentView} />;
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
        isDashboard={isDashboard}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        setActiveSection={setActiveSection}
      />

      <div className="flex">
        {isDashboard && (
          <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 p-4 overflow-y-auto z-10">
              <Sidebar
                role={userRole}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                handleLogout={handleLogout}
              />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="w-72 p-0 border-0 bg-transparent shadow-none">
                <div className="h-full bg-white dark:bg-gray-950 p-4">
                  <Sidebar
                    role={userRole}
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    handleLogout={handleLogout}
                    onNavigate={() => setIsMobileSidebarOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}

        <main className={`flex-1 min-w-0 transition-all duration-300 ${isDashboard ? 'lg:ml-64' : ''}`}>
          {renderView()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}