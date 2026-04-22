import { Button } from "./ui/button";
import { LogIn, UserPlus, Calendar, Menu, X, Moon, Sun, Bell, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import { api } from "../services/api";
import { useState, useEffect } from "react";

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  isDark: boolean;
  toggleDark: () => void;
  isDashboard?: boolean;
  onToggleMobileSidebar?: () => void;
  setActiveSection?: (section: string) => void;
}

export function Navigation({ 
  currentView, 
  setCurrentView, 
  userRole, 
  setUserRole, 
  isDark, 
  toggleDark, 
  isDashboard,
  onToggleMobileSidebar,
  setActiveSection 
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Poll for unread notifications whenever the user is logged in (and not an admin)
    // This ensures the bell icon badge is always up to date
    if (userRole && userRole !== 'admin') {
      const fetchUnread = async () => {
        try {
          const { count } = await api.notifications.getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Failed to fetch unread count for nav:', error);
        }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 10000); // 10s for more real-time feel
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserRole(null);
      setCurrentView('home');
      setIsMobileMenuOpen(false);
    }
  };

  const navigateTo = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50 transition-all duration-300 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {isDashboard && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                onClick={onToggleMobileSidebar}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Bella Salon
              </span>
            </button>
            
            {isDashboard && (
              <div className="hidden lg:flex items-center ml-4 px-3 py-1 bg-purple-50 rounded-full">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                  {userRole} Portal
                </span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigateTo('home')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'home' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Home
            </button>
            
            {userRole && (
              <button
                onClick={() => {
                  const dashboardView = `${userRole}-dashboard`;
                  navigateTo(dashboardView);
                  if (setActiveSection) setActiveSection('dashboard');
                }}
                className={`text-sm font-medium transition-colors ${
                  currentView.includes('dashboard') ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                Dashboard
              </button>
            )}

            <button
              onClick={() => navigateTo('services')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'services' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className={`text-sm font-medium transition-colors ${
                currentView === 'contact' ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Contact
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {userRole && (
              <div className="flex items-center gap-2">
                {userRole !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2 hover:bg-purple-50 rounded-xl"
                    onClick={() => {
                      if (userRole === 'staff') {
                        navigateTo('staff-dashboard');
                        setActiveSection?.('notifications');
                      } else if (userRole === 'customer') {
                        navigateTo('customer-dashboard');
                        setActiveSection?.('notifications');
                      }
                    }}
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full p-0 flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                )}
                
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-xs font-bold text-gray-900 leading-none">
                    {api.auth.getCurrentUser()?.name}
                  </span>
                  <span className="text-[10px] text-gray-500 capitalize">{userRole}</span>
                </div>
              </div>
            )}

            {!userRole ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateTo('login')}
                  className="text-purple-600 hover:bg-purple-50 rounded-xl"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigateTo('register')}
                  className="hidden sm:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl shadow-md"
                >
                  Join Now
                </Button>
              </div>
            ) : !isDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}

            {/* Mobile Menu Toggle (Non-dashboard only) */}
            {!isDashboard && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2 text-gray-600 hover:bg-purple-50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu (Non-dashboard) */}
      {!isDashboard && isMobileMenuOpen && (
        <div className="md:hidden border-t border-purple-100 bg-white/95 backdrop-blur-md">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button
              onClick={() => navigateTo('home')}
              className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
            >
              Home
            </button>
            
            {userRole && (
              <button
                onClick={() => {
                  const dashboardView = `${userRole}-dashboard`;
                  navigateTo(dashboardView);
                  if (setActiveSection) setActiveSection('dashboard');
                }}
                className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
              >
                Dashboard
              </button>
            )}

            <button
              onClick={() => navigateTo('services')}
              className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
            >
              Services
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600"
            >
              Contact
            </button>
            {!userRole && (
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full border-purple-200 text-purple-600 rounded-xl"
                  onClick={() => navigateTo('login')}
                >
                  Login
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
                  onClick={() => navigateTo('register')}
                >
                  Register
                </Button>
              </div>
            )}
            {userRole && (
              <div className="pt-4 border-t border-purple-100">
                <Button
                  variant="outline"
                  className="w-full border-red-100 text-red-600 hover:bg-red-50 rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}