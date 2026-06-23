'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Patient } from '@/lib/types';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().min(6, 'Phone number is too short'),
  dob: z.string().min(1, 'Date of birth is required'),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

type PatientFormProps = {
  defaultValues?: Partial<Patient>;
  onSubmit: (values: PatientFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
};

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      phoneNumber: defaultValues?.phoneNumber ?? '',
      dob: defaultValues?.dob ?? '',
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName?.message}>
          <Input {...register('firstName')} />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <Input {...register('lastName')} />
        </Field>
      </div>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" {...register('email')} />
      </Field>
      <Field label="Phone" error={errors.phoneNumber?.message}>
        <Input {...register('phoneNumber')} />
      </Field>
      <Field label="Date of birth" error={errors.dob?.message}>
        <Input type="date" {...register('dob')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
