"use client"

import { AuthProvider, useAuth } from "@/components/auth/AuthProvider"
import { AuthGate } from "@/components/auth/AuthGate"
import { ProductCatalogProvider } from "@/components/catalog/ProductCatalogProvider"
import { OperationalProvider } from "@/components/operations/OperationalProvider"
import { RecipeCatalogProvider } from "@/components/recipes/RecipeCatalogProvider"
import AppShell from "@/components/layout/AppShell"
import { getAccessToken } from "@/lib/api/tokens"
import { isApiEnabled } from "@/lib/api/config"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

function AuthenticatedShell({ children }: { children: ReactNode }) {
   const { session, ready } = useAuth()
   const useApi = isApiEnabled()
   const hasToken = Boolean(getAccessToken())

   if (!ready) {
      return (
         <div className="flex min-h-screen items-center justify-center p-6">
            <p className="text-text-500 text-sm">Ładowanie…</p>
         </div>
      )
   }

   if (useApi && (!session || !hasToken)) {
      return null
   }

   return (
      <AppShell>
         <ProductCatalogProvider>
            <RecipeCatalogProvider>
               <OperationalProvider>{children}</OperationalProvider>
            </RecipeCatalogProvider>
         </ProductCatalogProvider>
      </AppShell>
   )
}

function ShellOrBare({ children }: { children: ReactNode }) {
   const pathname = usePathname()
   if (pathname === "/login") {
      return <>{children}</>
   }
   return <AuthenticatedShell>{children}</AuthenticatedShell>
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
