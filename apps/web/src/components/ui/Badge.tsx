import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
        secondary:
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        destructive:
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        outline:
          'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300',
        success:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
