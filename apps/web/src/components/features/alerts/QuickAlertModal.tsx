'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCreateJobAlert } from '@/hooks/useJobAlerts';

const quickAlertSchema = z.object({
  name: z.string().min(1, 'Alert name is required'),
  keywords: z.string().optional(),
  location: z.string().optional(),
  notificationFrequency: z.enum(['instant', 'daily', 'weekly']),
});

type QuickAlertFormData = z.infer<typeof quickAlertSchema>;

interface QuickAlertModalProps {
  open: boolean;
  onClose: () => void;
  defaultKeywords?: string;
  defaultLocation?: string;
}

export function QuickAlertModal({
  open,
  onClose,
  defaultKeywords,
  defaultLocation,
}: QuickAlertModalProps) {
  const createAlert = useCreateJobAlert();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickAlertFormData>({
    resolver: zodResolver(quickAlertSchema),
    defaultValues: {
      name: '',
      keywords: defaultKeywords || '',
      location: defaultLocation || '',
      notificationFrequency: 'daily',
    },
  });

  const handleFormSubmit = async (data: QuickAlertFormData) => {
    const formattedData = {
      ...data,
      keywords: data.keywords
        ? data.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : undefined,
      isActive: true,
    };

    await createAlert.mutateAsync(formattedData);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Quick Alert"
      description="Set up a job alert based on your current search"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Alert Name"
          placeholder="e.g., Frontend Jobs in SF"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Keywords"
          placeholder="e.g., React, JavaScript, TypeScript"
          helperText="Comma-separated keywords"
          error={errors.keywords?.message}
          {...register('keywords')}
        />

        <Input
          label="Location"
          placeholder="e.g., San Francisco, CA"
          error={errors.location?.message}
          {...register('location')}
        />

        <Select
          label="Notification Frequency"
          error={errors.notificationFrequency?.message}
          {...register('notificationFrequency')}
        >
          <option value="instant">Instant (as soon as jobs match)</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Summary</option>
        </Select>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAlert.isPending}>
            {createAlert.isPending ? 'Creating...' : 'Create Alert'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
