import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { User, Mail, Lock, Phone, UserCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { api, LoginRequest, RegisterRequest } from "../services/api";
import { toast } from "sonner@2.0.3";

interface AuthPagesProps {
  view: 'login' | 'register';
  setCurrentView: (view: string) => void;
  setUserRole: (role: string) => void;
}

export function AuthPages({ view, setCurrentView, setUserRole }: AuthPagesProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials: LoginRequest = {
        email: formData.email,
        password: formData.password
      };

      const response = await api.auth.login(credentials);
      setUserRole(response.user.role);
      
      toast.success('Login successful!');
      
      // Navigate based on user role
      if (response.user.role === 'customer') setCurrentView('customer-dashboard');
      else if (response.user.role === 'admin') setCurrentView('admin-dashboard');
      else if (response.user.role === 'staff') setCurrentView('staff-dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData: RegisterRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'customer' // Always register as customer
      };

      const response = await api.auth.register(userData);
      setUserRole(response.user.role);
      
      toast.success('Account created successfully!');
      
      // Always redirect to customer dashboard since only customers can register
      setCurrentView('customer-dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Pass mode (login or signup) to the backend
    const mode = view === 'login' ? 'login' : 'signup';
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google?mode=${mode}`;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {view === 'login' ? 'Welcome Back' : 'Create Customer Account'}
          </CardTitle>
          <p className="text-gray-600">
            {view === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Join us as a customer and start your beauty journey'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {view === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {view === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentView('forgot-password')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>



            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl py-6 text-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {view === 'login' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                view === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 rounded-xl py-6 flex items-center justify-center gap-3 transition-all duration-300 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="font-semibold text-gray-700">Continue with Google</span>
          </Button>


          <div className="text-center space-y-4">
            <p className="text-gray-600">
              {view === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setCurrentView(view === 'login' ? 'register' : 'login')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {view === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <button
              onClick={() => setCurrentView('home')}
              className="text-gray-500 hover:text-gray-600 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}