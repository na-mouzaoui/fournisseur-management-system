'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#2db34b] focus:ring-2 focus:ring-[#2db34b] disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export { Select }