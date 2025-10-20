import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

// Enhanced Stats Card combining component structure with Tailwind styling
interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    direction: "up" | "down" | "neutral"
  }
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = "default",
  loading = false,
  className,
  ...props
}: StatsCardProps) {
  const variantClasses = {
    default: "border-gray-200 bg-white",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50", 
    danger: "border-red-200 bg-red-50"
  }

  const trendConfig = trend ? {
    up: {
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100"
    },
    down: {
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-100"
    },
    neutral: {
      icon: Minus,
      color: "text-gray-600",
      bg: "bg-gray-100"
    }
  }[trend.direction] : null

  if (loading) {
    return (
      <Card className={cn("animate-pulse", variantClasses[variant], className)} {...props}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(variantClasses[variant], "transition-shadow hover:shadow-md", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {description && (
              <p className="text-sm text-gray-500 leading-5">
                {description}
              </p>
            )}

            {trend && trendConfig && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  trendConfig.bg,
                  trendConfig.color
                )}>
                  <trendConfig.icon className="w-3 h-3" />
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">
                  {trend.label}
                </span>
              </div>
            )}
          </div>

          {icon && (
            <div className="shrink-0 ml-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Empty State Component
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300",
        className
      )} 
      {...props}
    >
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-600 mb-6 max-w-sm leading-5">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  )
}