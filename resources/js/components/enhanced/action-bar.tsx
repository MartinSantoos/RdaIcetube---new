import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, Plus, RefreshCw } from "lucide-react"

// Enhanced Action Bar combining components with Tailwind layout
interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  showFilter?: boolean
  showExport?: boolean
  showRefresh?: boolean
  onFilterClick?: () => void
  onExportClick?: () => void
  onRefreshClick?: () => void
  children?: React.ReactNode
}

export function ActionBar({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilter = true,
  showExport = true,
  showRefresh = false,
  onFilterClick,
  onExportClick,
  onRefreshClick,
  className,
  children,
  ...props
}: ActionBarProps) {
  return (
    <div 
      className={cn(
        "flex flex-col gap-4 p-6 bg-white border-b border-gray-200",
        "lg:flex-row lg:items-center lg:justify-between",
        className
      )} 
      {...props}
    >
      {/* Title Section */}
      {(title || subtitle) && (
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Actions Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        {showSearch && (
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {showFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilterClick}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          )}

          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshClick}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          )}

          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportClick}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}

          {/* Custom Actions */}
          {children}
        </div>
      </div>
    </div>
  )
}

// Enhanced Page Header Component
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "border-b border-gray-200 bg-white px-6 py-4",
        className
      )} 
      {...props}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="text-gray-400 mx-2">/</span>
                )}
                {crumb.href ? (
                  <a 
                    href={crumb.href} 
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 leading-5">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}