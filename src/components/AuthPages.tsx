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