import { useState, useEffect, Component, ReactNode } from 'react';
import { Toaster } from './components/ui/sonner';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { ServicesPage } from './components/ServicesPage';
import { AuthPages } from './components/AuthPages';
import { BookingPage } from './components/BookingPage';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Sidebar } from './components/Sidebar';
import { Sheet, SheetContent } from './components/ui/sheet';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { api } from './services/api';
import { initializeSampleAppointments } from './services/appointmentStore';

// ✅ FIX STB-018: Error Boundary prevents one crash from killing the entire app
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">An unexpected error occurred. Please reload the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Reload Page
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-6 text-left text-xs text-red-500 max-w-xl overflow-auto">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [bookingResumeState, setBookingResumeState] = useState<any>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('salon_dark_mode');
    return saved === 'true';
  });

  // ✅ useEffect 1 — auth check on app load
  useEffect(() => {
    initializeSampleAppointments();

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const path = window.location.pathname;

    // Google OAuth code exchange
    if (path === '/auth-success' && code) {
      window.history.replaceState({}, document.title, '/');

      fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then(res => res.json())
        .then(async ({ token, error }) => {
          if (!token || error) throw new Error(error || 'Exchange failed');
          localStorage.setItem('auth_token', token);
          const user = await api.auth.getMe();
          localStorage.setItem('user', JSON.stringify(user));
          setUserRole(user.role);

          // Check if user was in the middle of booking before Google login
          const savedBooking = sessionStorage.getItem('booking_resume');
          if (savedBooking && user.role === 'customer') {
            const parsed = JSON.parse(savedBooking);
            sessionStorage.removeItem('booking_resume');
            // Pass token so BookingPage can set it before fetching loyalty info
            setBookingResumeState({ ...parsed, token });
            setCurrentView('booking');
          } else if (user.role === 'customer') setCurrentView('customer-dashboard');
          else if (user.role === 'admin') setCurrentView('admin-dashboard');
          else if (user.role === 'staff') setCurrentView('staff-dashboard');
        })
        .catch(err => {
          console.error('Failed Google Auth exchange:', err);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setCurrentView('login');
        });
      return;
    }

    // Password reset token in URL
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/').pop();
      if (token) {
        setResetToken(token);
        setCurrentView('reset-password');
        window.history.replaceState({}, document.title, '/');
        return;
      }
    }

    // ✅ FIX STB-013: use localStorage for instant UI, verify with server
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

      api.auth.getMe()
        .then(freshUser => {
          localStorage.setItem('user', JSON.stringify(freshUser));
          if (freshUser.role !== currentUser.role) {
            setUserRole(freshUser.role);
            switch (freshUser.role) {
              case 'admin': setCurrentView('admin-dashboard'); break;
              case 'staff': setCurrentView('staff-dashboard'); break;
              case 'customer': setCurrentView('customer-dashboard'); break;
            }
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUserRole(null);
          setCurrentView('home');
        });
    }
  }, []);

  // ✅ useEffect 2 — dark mode
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
        return <BookingPage
          setCurrentView={setCurrentView}
          initialServiceId={preselectedServiceId}
          onResetSelection={() => setPreselectedServiceId(null)}
          resumeState={bookingResumeState}
          onResumeConsumed={() => setBookingResumeState(null)}
        />;
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
    <ErrorBoundary>
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
              <aside className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 p-4 overflow-y-auto z-10">
                <Sidebar
                  role={userRole}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  handleLogout={handleLogout}
                />
              </aside>

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
    </ErrorBoundary>
  );
}