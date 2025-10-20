import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Enhanced Form Section Component combining component structure with Tailwind styling
interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  variant?: "default" | "bordered" | "elevated"
  children: React.ReactNode
}

export function FormSection({ 
  title, 
  description, 
  variant = "default", 
  className, 
  children, 
  ...props 
}: FormSectionProps) {
  const variants = {
    default: "space-y-6",
    bordered: "border border-gray-200 rounded-lg p-6 space-y-6 bg-white",
    elevated: "bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
  }

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 leading-6">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 leading-5">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Enhanced Form Field Component
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ 
  label, 
  description, 
  error, 
  required, 
  className, 
  children, 
  ...props 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && (
        <label className="text-sm font-medium text-gray-700 leading-5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 leading-4">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 leading-5 flex items-center gap-1">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}