import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'primary' &&
            'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]',
          variant === 'secondary' &&
            'border border-border bg-white hover:bg-muted',
          variant === 'ghost' && 'hover:bg-muted',
          variant === 'danger' &&
            'bg-error text-white hover:opacity-90 active:scale-[0.98]',
          size === 'sm' && 'h-8 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
