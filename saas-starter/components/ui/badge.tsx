import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

function Badge({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };

