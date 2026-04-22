import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Database, Key, Loader2, Mail } from 'lucide-react';
import { FloatingField } from '../components/ui/FloatingField';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Enter your email address first');
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <section className="hidden w-[42vw] min-w-[28rem] border-r border-border bg-card p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">Quantum Scaling</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Contact Enrichment</div>
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Secure Workspace</div>
          <h1 className="mt-3 max-w-lg text-4xl font-black tracking-tight">Classify contacts, monitor runs, and export enriched lists.</h1>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {['Contacts', 'Pipeline', 'Exports'].map((item) => (
            <div key={item} className="rounded-md border border-border bg-background px-3 py-2 font-semibold text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      </section>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md animate-in">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight">Quantum Scaling</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Contact Enrichment</div>
              </div>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-border px-6 py-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Authentication</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Sign In</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 p-6">
              {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
              {resetSent && <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">Password reset link sent. Check your inbox.</div>}

              <FloatingField
                label="Email address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                leading={<Mail className="h-4 w-4" />}
              />

              <FloatingField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                leading={<Key className="h-4 w-4" />}
                trailing={
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot?
                  </button>
                }
              />

              <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-foreground transition-colors hover:text-primary">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
