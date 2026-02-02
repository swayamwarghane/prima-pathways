import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes to detect PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setCheckingSession(false);
      } else if (event === 'SIGNED_IN' && session) {
        // User might already be in a recovery session
        setIsValidSession(true);
        setCheckingSession(false);
      }
    });

    // Also check current session for cases where the event already fired
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setCheckingSession(false);
    };
    
    // Small delay to allow onAuthStateChange to fire first
    setTimeout(checkSession, 500);

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface p-4">
        <div className="w-full max-w-md animate-fade-in text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if no valid session
  if (!isValidSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center shadow-elevated">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Prima Interns</h1>
                <p className="text-sm text-muted-foreground">Intern Management System</p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display text-center">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground mb-4">
                Please request a new password reset link.
              </p>
              <Button 
                onClick={() => navigate('/forgot-password')}
                className="gradient-primary hover:opacity-90 transition-opacity"
              >
                Request New Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-surface p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-hero rounded-xl flex items-center justify-center shadow-elevated">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Prima Interns</h1>
              <p className="text-sm text-muted-foreground">Intern Management System</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-display text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              {success ? "Your password has been updated" : "Enter your new password"}
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
              <p className="text-muted-foreground">
                Redirecting to login...
              </p>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full gradient-primary hover:opacity-90 transition-opacity" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
