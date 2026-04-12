import { Button } from "./ui/button";
import { LogIn, UserPlus, Calendar, Menu, X, Moon, Sun } from "lucide-react";
import { api } from "../services/api";
import { useState } from "react";

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: string | null;
  setUserRole: (role: string | null) => void;
  isDark: boolean;
  toggleDark: () => void;
}

export function Navigation({ currentView, setCurrentView, userRole, setUserRole, isDark, toggleDark }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="bg-white/90 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Bella Salon
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigateTo('home')}
              className={`transition-colors ${
                currentView === 'home' 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigateTo('services')}
              className={`transition-colors ${
                currentView === 'services' 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className={`transition-colors ${
                currentView === 'contact' 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Contact
            </button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!userRole ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateTo('login')}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigateTo('register')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (userRole === 'customer') navigateTo('customer-dashboard');
                    else if (userRole === 'admin') navigateTo('admin-dashboard');
                    else if (userRole === 'staff') navigateTo('staff-dashboard');
                  }}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-purple-100">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => navigateTo('home')}
                className={`px-4 py-2 text-left rounded-lg transition-colors ${
                  currentView === 'home' 
                    ? 'bg-purple-50 text-purple-600 font-medium' 
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo('services')}
                className={`px-4 py-2 text-left rounded-lg transition-colors ${
                  currentView === 'services' 
                    ? 'bg-purple-50 text-purple-600 font-medium' 
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => navigateTo('contact')}
                className={`px-4 py-2 text-left rounded-lg transition-colors ${
                  currentView === 'contact' 
                    ? 'bg-purple-50 text-purple-600 font-medium' 
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                Contact
              </button>

              {!userRole ? (
                <>
                  <Button
                    onClick={() => navigateTo('login')}
                    variant="outline"
                    className="justify-start border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => navigateTo('register')}
                    className="justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (userRole === 'customer') navigateTo('customer-dashboard');
                      else if (userRole === 'admin') navigateTo('admin-dashboard');
                      else if (userRole === 'staff') navigateTo('staff-dashboard');
                    }}
                    variant="outline"
                    className="justify-start border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="justify-start border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}