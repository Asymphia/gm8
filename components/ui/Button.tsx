"use client"

import type { ComponentPropsWithoutRef } from "react"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "warning"

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
   variant?: ButtonVariant
   size?: "sm" | "md" | "lg"
}

const variantClass = {
   primary: "bg-primary-500 text-white hover:bg-primary-700 active:bg-primary-700",
   secondary: "border border-border-300 bg-surface text-text-700 hover:bg-foreground",
   outline: "border border-primary-500 bg-background text-primary-500 hover:bg-foreground",
   ghost: "bg-transparent text-text-700 hover:bg-foreground",
   warning: "border border-warning bg-background text-warning hover:bg-foreground"
} as const satisfies Record<ButtonVariant, string>

const sizeClass = {
   sm: "rounded-sm px-3 py-1.5 text-xs font-medium",
   md: "rounded-sm px-6 py-3 text-sm font-medium",
   lg: "rounded-sm px-8 py-4 text-base font-medium"
} as const satisfies Record<NonNullable<ButtonProps["size"]>, string>

const Button = ({
   className = "",
   variant = "primary",
   size = "md",
   type = "button",
   children,
   onClick,
   ...props
}: ButtonProps) => {
   return (
      <button
         type={type}
         className={`transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
         onClick={onClick}
         {...props}
      >
         {children}
      </button>
   )
}

export default Button
