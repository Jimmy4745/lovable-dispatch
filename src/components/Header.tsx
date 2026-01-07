import { Truck } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">UG Transportation LLC</h1>
            <p className="text-xs text-muted-foreground">Dispatcher & Payroll Platform</p>
          </div>
        </div>
      </div>
    </header>
  );
}
