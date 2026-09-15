import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        ghost: 'text-muted-foreground hover:bg-hover hover:text-foreground',
        active: 'bg-surface-active text-foreground',
        fill: 'bg-accent-brand-strong text-accent-brand-foreground hover:bg-accent-brand',
        icon: 'text-inactive hover:text-foreground hover:bg-hover',
      },
      size: {
        sm: 'h-7 px-2',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'sm',
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
