import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Clock, XCircle, Package, Truck } from "lucide-react"

// Enhanced Status Badge combining component functionality with Tailwind styling
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string
  variant?: "default" | "pill" | "dot"
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({ 
  status, 
  variant = "default", 
  size = "md", 
  className, 
  ...props 
}: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'available':
      case 'completed':
      case 'operational':
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        }
      case 'pending':
      case 'in_progress':
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
          label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      case 'out_for_delivery':
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Truck,
          label: "On Delivery"
        }
      case 'inactive':
      case 'unavailable':
      case 'cancelled':
      case 'broken':
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        }
      case 'maintenance':
      case 'under_maintenance':
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: AlertTriangle,
          label: "Under Maintenance"
        }
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Package,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1 [&>svg]:size-3",
    md: "text-sm px-2.5 py-1 gap-1.5 [&>svg]:size-3.5",
    lg: "text-base px-3 py-1.5 gap-2 [&>svg]:size-4"
  }

  const variantClasses = {
    default: "inline-flex items-center rounded-md border font-medium",
    pill: "inline-flex items-center rounded-full border font-medium",
    dot: "inline-flex items-center gap-2 text-sm font-medium"
  }

  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)} {...props}>
        <span className={cn("w-2 h-2 rounded-full", config.color.split(' ')[0])} />
        <span className={cn("text-sm font-medium", config.color.split(' ')[1])}>
          {config.label}
        </span>
      </span>
    )
  }

  return (
    <Badge
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        config.color,
        "border-0 shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    >
      <Icon />
      {config.label}
    </Badge>
  )
}

// Enhanced Data Table Cell Component
interface DataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  variant?: "default" | "numeric" | "status" | "action"
  align?: "left" | "center" | "right"
}

export function DataCell({ 
  variant = "default", 
  align = "left", 
  className, 
  children, 
  ...props 
}: DataCellProps) {
  const variantClasses = {
    default: "text-gray-900",
    numeric: "text-gray-900 font-mono",
    status: "text-gray-600",
    action: "text-gray-500"
  }

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right"
  }

  return (
    <td 
      className={cn(
        "px-4 py-3 text-sm transition-colors",
        variantClasses[variant],
        alignClasses[align],
        "border-b border-gray-100 last:border-b-0",
        className
      )} 
      {...props}
    >
      {children}
    </td>
  )
}