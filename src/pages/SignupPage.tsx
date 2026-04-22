import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Database, Key, Loader2, Mail, User } from 'lucide-react';
import { FloatingField } from '../components/ui/FloatingField';

export function SignupPage() {
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || undefined } },
    });

    if (error) {
      setError(error.message);
    } else {
      setCheckInbox(true);
    }
    setLoading(false);
  }

  if (checkInbox) {
    return (
      <AuthFrame>
        <div className="panel p-8 text-center animate-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-black tracking-tight text-foreground">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{email}</p>
          <Link to="/login" className="btn-outline btn-md mt-6 w-full">Back to Sign In</Link>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <div className="panel overflow-hidden animate-in">
        <div className="border-b border-border px-6 py-5">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Authentication</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Create Account</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 p-6">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <FloatingField
            label="Full name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            disabled={loading}
            leading={<User className="h-4 w-4" />}
          />

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
            minLength={6}
            autoComplete="new-password"
            disabled={loading}
            leading={<Key className="h-4 w-4" />}
          />

          <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-foreground transition-colors hover:text-primary">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">Quantum Scaling</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Contact Enrichment</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
