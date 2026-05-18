"use client"

import { canAccessPath } from "@/lib/auth"
import { useAuth } from "@/components/auth/AuthProvider"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

const PUBLIC_PATHS = ["/login"]

interface AuthGateProps {
   children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
   const { ready, session } = useAuth()
   const pathname = usePathname()
   const router = useRouter()

   const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))

   useEffect(() => {
      if (!ready) return

      if (!session && !isPublic) {
         router.replace("/login")
         return
      }

      if (session && pathname === "/login") {
         router.replace("/")
         return
      }

      if (session && !canAccessPath(pathname, session.appRole)) {
         router.replace("/schedule")
      }
   }, [ready, session, isPublic, pathname, router])

   if (!ready) {
      return (
         <div className="flex min-h-screen items-center justify-center bg-foreground p-6">
            <p className="text-text-500 text-sm">Ładowanie…</p>
         </div>
      )
   }

   if (!session && !isPublic) return null
   if (session && pathname === "/login") return null
   if (session && !canAccessPath(pathname, session.appRole)) return null

   return <>{children}</>
}
