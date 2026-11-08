import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Ban,
  Inbox,
  UserCircle,
} from 'lucide-react';
import { cn }          from '@/lib/utils';
import { Button }      from '@/components/ui/button';
import { MaintenanceSecret } from '@/components/layout/MaintenanceSecret';
import { Separator }   from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { authApi }      from '@/api/auth';
import { paidStudentsApi } from '@/api/paidStudents';

interface NavItem {
  label: string;
  to:    string;
  icon:  React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  lpOnly?: boolean;      // SS (LP) only
  ccOnly?: boolean;      // CC only
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
  { label: 'Cancellation Requests', to: '/cancellation-requests', icon: Ban, adminOnly: true },
  { label: 'Cancellation Requests', to: '/my-requests',      icon: Inbox, lpOnly: true },
  { label: 'Teachers',       to: '/teachers',         icon: GraduationCap, lpOnly: true },
  { label: 'My Profile',     to: '/my-profile',       icon: UserCircle, ccOnly: true },
  { label: 'Employee Mg',   to: '/employees',        icon: GraduationCap, adminOnly: true },
  { label: 'Messages',      to: '/messages',         icon: MessageSquare, adminOnly: true },
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

  const isAdmin = user?.role === 'super_admin';

  // Badge on Paid Students: packages ending soon (admin + LP)
  const { data: nearEndCount = 0 } = useQuery({
    queryKey: ['paid-students-near-end-count'],
    queryFn:  paidStudentsApi.nearEndCount,
    enabled:  isAdmin || user?.role === 'ss',
    refetchInterval: 60_000,
  });
  const visibleItems = NAV_ITEMS.filter(
    (item) => (!item.adminOnly || isAdmin) && (!item.lpOnly || user?.role === 'ss') && (!item.ccOnly || user?.role === 'cc'),
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
                <span className="relative shrink-0">
                  <item.icon className="h-5 w-5" />
                  {item.to === '/paid-students' && nearEndCount > 0 && collapsed && (
                    <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.to === '/paid-students' && nearEndCount > 0 && (
                  <span
                    className="ms-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center"
                    title={`${nearEndCount} packages ending soon`}
                  >
                    {nearEndCount}
                  </span>
                )}
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
                {user?.role === 'super_admin' ? 'Admin' : user?.role === 'ss' ? 'LP' : user?.role === 'cc' ? 'CC' : 'CRM agent'}
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
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </Button>
      </div>
    </aside>
  );
}
