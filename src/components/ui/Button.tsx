import { forwardRef } from "react"
import { cn } from "~/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:ring-[var(--ring)]",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary-hover": variant === "default",
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive-hover": variant === "destructive",
            "border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover": variant === "secondary",
            "text-foreground hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
