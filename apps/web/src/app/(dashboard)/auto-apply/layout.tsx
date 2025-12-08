'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Settings, Activity } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/auto-apply',
    icon: LayoutDashboard,
  },
  {
    name: 'Settings',
    href: '/auto-apply/settings',
    icon: Settings,
  },
  {
    name: 'Activity',
    href: '/auto-apply/activity',
    icon: Activity,
  },
];

export default function AutoApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <nav className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
