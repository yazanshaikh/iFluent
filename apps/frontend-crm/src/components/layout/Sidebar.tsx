import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Waves,
  UserPlus,
  Gem,
  ClipboardList,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { cn }          from '@/lib/utils';
import { Button }      from '@/components/ui/button';
import { MaintenanceSecret } from '@/components/layout/MaintenanceSecret';
import { Separator }   from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { authApi }      from '@/api/auth';

interface NavItem {
  label: string;
  to:    string;
  icon:  React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     to: '/dashboard',  icon: LayoutDashboard, adminOnly: true },
  { label: 'New Lead',       to: '/new-leads',        icon: UserPlus },
  { label: 'Lead Pool',      to: '/leads',            icon: Users },
  { label: 'Small Treasury', to: '/small-treasury',   icon: Gem },
  { label: 'Open Sea',       to: '/open-sea',         icon: Waves },
  { label: 'Trial Bookings',to: '/bookings',        icon: BookOpen },
  { label: 'Process Orders', to: '/process-orders', icon: ClipboardList },
  { label: 'Paid Students',  to: '/paid-students',   icon: UserCheck },
  { label: 'Employee Mg',   to: '/employees',        icon: GraduationCap, adminOnly: true },
  { label: 'الرسائل',       to: '/messages',         icon: MessageSquare, adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'super_admin',
  );

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')
    : 'U';

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar text-sidebar-foreground border-l border-sidebar-border transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        {!collapsed && (
          <span className="text-lg font-extrabold">
            <span className="text-[#FFC107]">i</span>
            <span className="text-white">Fluent</span>
            <span className="text-xs text-sidebar-foreground/50 font-normal ms-1.5">CRM</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((c) => !c)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User + Logout */}
      <div className={cn('p-3', collapsed ? 'flex flex-col items-center gap-2' : '')}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <MaintenanceSecret initials={initials} enabled={user?.role === 'super_admin'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user?.role === 'super_admin' ? 'مدير النظام' : 'وكيل CRM'}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={handleLogout}
          className={cn(
            'text-sidebar-foreground/60 hover:bg-red-500/10 hover:text-red-400',
            collapsed ? 'h-9 w-9' : 'w-full justify-start gap-2',
          )}
          title={collapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'تسجيل الخروج'}
        </Button>
      </div>
    </aside>
  );
}
