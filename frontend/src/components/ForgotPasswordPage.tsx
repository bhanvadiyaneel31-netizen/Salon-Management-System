import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  setCurrentView: (view: string) => void;
}

export function ForgotPasswordPage({ setCurrentView }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link sent if email exists');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</CardTitle>
          <p className="text-gray-600 mb-8">
            If an account exists for <span className="font-semibold">{email}</span>, you will receive a password reset link shortly.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('login')}
            className="w-full rounded-xl py-6 border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Forgot Password?
          </CardTitle>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl py-6 text-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setCurrentView('login')}
              className="flex items-center justify-center gap-2 w-full text-gray-500 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
