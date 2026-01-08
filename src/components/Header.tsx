import { useState } from 'react';
import { Truck, LogOut, Key, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { signOut, user } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="hidden sm:inline text-sm truncate max-w-[150px]">
                      {user.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <ChangePasswordDialog 
        open={isPasswordDialogOpen} 
        onClose={() => setIsPasswordDialogOpen(false)} 
      />
    </header>
  );
}
