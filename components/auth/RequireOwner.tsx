"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import Link from "next/link"
import type { ReactNode } from "react"

interface RequireOwnerProps {
   children: ReactNode
   title?: string
}

export function RequireOwner({ children, title = "Tylko dla właściciela" }: RequireOwnerProps) {
   const { isOwner, ready } = useAuth()

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie…</p>
   }

   if (!isOwner) {
      return (
         <div className="rounded-sm border border-border-300 bg-background p-6">
            <h1 className="text-text-700 text-lg font-medium">{title}</h1>
            <p className="text-text-500 mt-2 text-sm">
               Ta sekcja jest dostępna wyłącznie dla konta właściciela.
            </p>
            <Link href="/schedule" className="text-primary-500 mt-4 inline-block text-sm font-medium hover:underline">
               ← Powrót do harmonogramu
            </Link>
         </div>
      )
   }

   return <>{children}</>
}
