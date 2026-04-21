import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react';

export function Topbar() {
  const { signOut } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/30 backdrop-blur-xl px-6">
      <div />
      <div className="flex items-center gap-2">
        <button
          onClick={signOut}
          className="btn btn-ghost btn-sm"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
