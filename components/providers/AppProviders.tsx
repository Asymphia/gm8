"use client"

import { AuthProvider } from "@/components/auth/AuthProvider"
import { AuthGate } from "@/components/auth/AuthGate"
import { OperationalProvider } from "@/components/operations/OperationalProvider"
import AppShell from "@/components/layout/AppShell"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

function ShellOrBare({ children }: { children: ReactNode }) {
   const pathname = usePathname()
   if (pathname === "/login") {
      return <>{children}</>
   }
   return (
      <AppShell>
         <OperationalProvider>{children}</OperationalProvider>
      </AppShell>
   )
}

export function AppProviders({ children }: { children: ReactNode }) {
   return (
      <AuthProvider>
         <AuthGate>
            <ShellOrBare>{children}</ShellOrBare>
         </AuthGate>
      </AuthProvider>
   )
}
