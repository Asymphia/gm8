import type { ComponentPropsWithoutRef } from "react"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
   variant?: ButtonVariant
   size?: "sm" | "md" | "lg"
}

const variantClass: Record<ButtonVariant, string> = {
   primary: "bg-primary-500 text-white hover:bg-primary-700 active:bg-primary-700",
   secondary: "border border-border-300 bg-surface text-text-700 hover:bg-foreground",
   outline: "border border-border-500 bg-background text-text-700 hover:bg-foreground",
   ghost: "bg-transparent text-text-700 hover:bg-foreground"
}

const sizeClass = {
   sm: "rounded-sm px-3 py-1.5 text-xs font-medium",
   md: "rounded-sm px-6 py-3 text-sm font-medium",
   lg: "rounded-sm px-8 py-4 text-base font-medium"
} as const

const Button = ({
   className = "",
   variant = "primary",
   size = "md",
   type = "button",
   children,
   ...props
}: ButtonProps) => {
   return (
      <button
         type={type}
         className={`transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
         {...props}
      >
         {children}
      </button>
   )
}

export default Button
