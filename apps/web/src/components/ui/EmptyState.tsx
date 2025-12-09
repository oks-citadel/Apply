import { ReactNode, isValidElement } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } | ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;

    // If icon is already a React element (JSX), render it directly
    if (isValidElement(icon)) {
      return (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      );
    }

    // Otherwise, treat it as a LucideIcon component
    const Icon = icon as LucideIcon;
    return (
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  };

  const renderAction = () => {
    if (!action) return null;

    // If action is already a React element, render it directly
    if (isValidElement(action)) {
      return action;
    }

    // Otherwise, treat it as action config object
    const actionConfig = action as { label: string; onClick: () => void };
    return (
      <Button onClick={actionConfig.onClick}>
        {actionConfig.label}
      </Button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {renderIcon()}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{description}</p>
      )}
      {renderAction()}
    </div>
  );
}
