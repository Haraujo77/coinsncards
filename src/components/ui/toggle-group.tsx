import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';

export function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn('inline-flex h-7 items-center rounded-md bg-well p-0.5', className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'inline-flex h-6 items-center rounded-[5px] px-2 text-[11.5px] text-muted-foreground',
        'data-[state=on]:bg-surface-raised data-[state=on]:text-foreground data-[state=on]:shadow-[var(--shadow-segment)]',
        className,
      )}
      {...props}
    />
  );
}
