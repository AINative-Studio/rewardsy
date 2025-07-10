'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Gift, 
  Settings, 
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Today',
    href: '/dashboard/today',
    icon: Calendar,
  },
  {
    title: 'Goals',
    href: '/dashboard/goals',
    icon: Target,
  },
  {
    title: 'Rewards',
    href: '/dashboard/rewards',
    icon: Gift,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('/dashboard');

  const handleNavigation = (href: string) => {
    setActiveItem(href);
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={activeItem === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2" : "px-4",
                activeItem === item.href && "bg-primary/10 text-primary"
              )}
              onClick={() => handleNavigation(item.href)}
            >
              <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Button>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10",
          isCollapsed && "justify-center"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Gift className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">Premium</p>
              <p className="text-xs text-muted-foreground">Unlock AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}