'use client';

import { Switch } from '@/components/ui/Switch';
import { useAutoApplyStatus, useStartAutoApply, useStopAutoApply } from '@/hooks/useApplications';
import { Loader2 } from 'lucide-react';

interface AutoApplyToggleProps {
  className?: string;
}

export function AutoApplyToggle({ className }: AutoApplyToggleProps) {
  const { data: status, isLoading } = useAutoApplyStatus();
  const startAutoApply = useStartAutoApply();
  const stopAutoApply = useStopAutoApply();

  const isRunning = status?.isRunning || false;
  const isPending = startAutoApply.isPending || stopAutoApply.isPending;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await startAutoApply.mutateAsync(undefined);
    } else {
      await stopAutoApply.mutateAsync();
    }
  };

  if (isLoading) {
    return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
  }

  return (
    <div className={className}>
      <Switch
        checked={isRunning}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label="Toggle auto-apply"
      />
    </div>
  );
}
