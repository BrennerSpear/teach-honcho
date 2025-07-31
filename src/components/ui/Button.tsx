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
            "shadow transition-colors": variant === "default",
            "shadow-sm transition-colors": variant === "destructive",
            "border shadow-sm transition-colors": variant === "outline",
            "shadow-sm": variant === "secondary",
            "transition-colors": variant === "ghost",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
          },
          className,
        )}
        style={{
          ...(variant === "default" && {
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }),
          ...(variant === "destructive" && {
            backgroundColor: "var(--destructive)",
            color: "var(--destructive-foreground)",
          }),
          ...(variant === "outline" && {
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }),
          ...(variant === "secondary" && {
            backgroundColor: "var(--secondary)",
            color: "var(--secondary-foreground)",
          }),
          ...(variant === "ghost" && {
            backgroundColor: "transparent",
            color: "var(--foreground)",
          }),
        }}
        onMouseEnter={(e) => {
          const button = e.currentTarget;
          if (variant === "default") {
            button.style.backgroundColor = "var(--primary-hover)";
          } else if (variant === "destructive") {
            button.style.backgroundColor = "var(--destructive-hover)";
          } else if (variant === "outline") {
            button.style.backgroundColor = "var(--accent)";
            button.style.color = "var(--accent-foreground)";
          } else if (variant === "secondary") {
            button.style.backgroundColor = "var(--secondary-hover)";
          } else if (variant === "ghost") {
            button.style.backgroundColor = "var(--accent)";
            button.style.color = "var(--accent-foreground)";
          }
        }}
        onMouseLeave={(e) => {
          const button = e.currentTarget;
          if (variant === "default") {
            button.style.backgroundColor = "var(--primary)";
            button.style.color = "var(--primary-foreground)";
          } else if (variant === "destructive") {
            button.style.backgroundColor = "var(--destructive)";
            button.style.color = "var(--destructive-foreground)";
          } else if (variant === "outline") {
            button.style.backgroundColor = "var(--background)";
            button.style.color = "var(--foreground)";
          } else if (variant === "secondary") {
            button.style.backgroundColor = "var(--secondary)";
            button.style.color = "var(--secondary-foreground)";
          } else if (variant === "ghost") {
            button.style.backgroundColor = "transparent";
            button.style.color = "var(--foreground)";
          }
        }}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
