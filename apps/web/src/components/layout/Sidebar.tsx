'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  BarChart3,
  Bell,
  User,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: FileText,
  },
  {
    name: 'Resumes',
    href: '/resumes',
    icon: FileText,
  },
  {
    name: 'AI Tools',
    href: '/ai-tools',
    icon: Sparkles,
  },
  {
    name: 'Auto Apply',
    href: '/auto-apply',
    icon: Zap,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar navigation"
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight
                    className="h-4 w-4 text-primary-600 dark:text-primary-400"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
              Need Help?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Have questions? Contact our support team
            </p>
            <Link href="/contact">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
