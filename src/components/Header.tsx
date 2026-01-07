import { Truck, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { signOut, user } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">UG Transportation LLC</h1>
              <p className="text-xs text-muted-foreground">Dispatcher & Payroll Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-9 w-9"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
