import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ResetPasswordPageProps {
  token: string;
  setCurrentView: (view: string) => void;
}

export function ResetPasswordPage({ token, setCurrentView }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const isLengthValid = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLengthValid || !hasNumber || !passwordsMatch) {
      toast.error('Please ensure password requirements are met');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
      toast.success('Password reset successfully!');
      redirectTimeoutRef.current = setTimeout(() => setCurrentView('login'), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl text-center p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-4">Password Updated!</CardTitle>
          <p className="text-gray-600 mb-8">
            Your password has been changed successfully. You will be redirected to the login page in a few seconds.
          </p>
          <Button 
            onClick={() => setCurrentView('login')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl py-6"
          >
            Go to Login Now
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
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Set New Password
          </CardTitle>
          <p className="text-gray-600">
            Please enter your new password below to secure your account.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Validation indicators */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                {isLengthValid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-300" />}
                <span className={isLengthValid ? 'text-green-700 font-medium' : 'text-gray-500'}>Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasNumber ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-300" />}
                <span className={hasNumber ? 'text-green-700 font-medium' : 'text-gray-500'}>At least one number</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-gray-300" />}
                <span className={passwordsMatch ? 'text-green-700 font-medium' : 'text-gray-500'}>Passwords match</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !isLengthValid || !hasNumber || !passwordsMatch}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl py-6 text-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
