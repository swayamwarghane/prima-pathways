import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GraduationCap, LogOut, User, LayoutDashboard, Users, ClipboardList, Download, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/interns', label: 'Interns', icon: Users },
    { href: '/admin/tasks', label: 'Review Tasks', icon: ClipboardList },
    { href: '/admin/assign', label: 'Assign Tasks', icon: UserPlus },
    { href: '/admin/export', label: 'Export', icon: Download },
  ];

  return (
    <div className="min-h-screen gradient-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-display font-bold text-foreground">Prima Interns</span>
              {isAdmin && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
          </Link>

          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "gradient-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="gradient-primary text-primary-foreground font-medium">
                    {getInitials(user?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
