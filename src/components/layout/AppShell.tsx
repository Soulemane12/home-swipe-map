import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/swipe', label: 'Swipe', icon: Layers },
  { path: '/map', label: 'Map', icon: Map },
];

export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-2xl font-medium tracking-tight">SwipeHouse</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  location.pathname === path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
};
