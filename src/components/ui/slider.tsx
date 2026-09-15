import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/cn';

export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex h-7 w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-track">
        <SliderPrimitive.Range className="absolute h-full bg-accent-brand" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-2.5 rounded-full bg-foreground opacity-0 shadow-none transition-opacity hover:opacity-100 focus-visible:opacity-100 data-[active]:opacity-100" />
    </SliderPrimitive.Root>
  );
}
