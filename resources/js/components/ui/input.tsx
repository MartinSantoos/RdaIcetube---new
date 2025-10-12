import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-base text-gray-900 shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-blue-500 focus-visible:ring-blue-500/20 focus-visible:ring-[3px]",
        "placeholder:text-gray-500",
        className
      )}
      style={{
        backgroundColor: '#ffffff !important',
        color: '#111827 !important',
        border: '1px solid #d1d5db !important',
        ...props.style
      }}
      {...props}
    />
  )
}

export { Input }
