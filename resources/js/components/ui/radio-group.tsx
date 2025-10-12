import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined)

interface RadioGroupProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
  name?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, children, defaultValue, value, onValueChange, name, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const currentValue = value !== undefined ? value : internalValue
    const groupName = name || `radio-group-${Math.random().toString(36).substr(2, 9)}`

    const handleValueChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <RadioGroupContext.Provider value={{ 
        value: currentValue, 
        onValueChange: handleValueChange,
        name: groupName 
      }}>
        <div
          className={cn("grid gap-2", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    
    if (!context) {
      throw new Error('RadioGroupItem must be used within a RadioGroup')
    }

    const { value: groupValue, onValueChange, name } = context
    const isChecked = groupValue === value

    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={isChecked}
        onChange={() => onValueChange?.(value)}
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
