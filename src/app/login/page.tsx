'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already authenticated or auth not required
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/login');
        const data = await response.json();

        if (data.authenticated) {
          // Already authenticated, redirect
          router.replace(redirect);
          return;
        }

        if (!data.authRequired) {
          // Auth not required, redirect
          router.replace(redirect);
          return;
        }
      } catch {
        // Failed to check auth, show login form
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the original page
        router.replace(redirect);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-xl font-medium text-zinc-100">
              OpenClaw Dashboard
            </CardTitle>
            <p className="text-sm text-zinc-400 mt-2">
              Enter your access token to continue
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="token" className="text-sm text-zinc-400">
                  Access Token
                </label>
                <Input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your token..."
                  disabled={isLoading}
                  autoFocus
                  className="bg-zinc-800/50 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 focus:border-zinc-600 focus:ring-zinc-600"
                />
              </div>

              <Button
                type="submit"
                disabled={!token.trim() || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Token is set via OPENCLAW_DASHBOARD_TOKEN environment variable
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
