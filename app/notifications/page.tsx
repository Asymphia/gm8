"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { notificationsNavHref } from "@/lib/auth"

const ANNOUNCEMENTS = [
   { title: "Jutrzejsza inwentaryzacja", author: "Kierownik", publishedAt: "2026-05-07 14:00" },
   { title: "Zaktualizowana lista higieny", author: "Odpowiedzialny za jakość", publishedAt: "2026-05-06 18:30" },
   { title: "Aktualizacja obsady na weekend", author: "Kadry", publishedAt: "2026-05-05 12:00" },
]

const hubItems = [
   {
      href: "/notifications",
      label: "Kanał ogłoszeń",
      description: "Opublikowane wpisy z datami w kolejności chronologicznej.",
      value: String(ANNOUNCEMENTS.length),
   },
   {
      href: "/notifications/board",
      label: "Tablica",
      description: "Operacyjny widok tablicy wpisów.",
      value: "Otwórz",
   },
]

const NotificationPage = () => {
   const router = useRouter()
   const { session, ready } = useAuth()

   useEffect(() => {
      if (!ready || !session) return
      if (session.appRole === "employee") {
         router.replace(notificationsNavHref("employee"))
      }
   }, [ready, router, session])

   if (!ready || session?.appRole === "employee") {
      return null
   }

   return (
      <div className="space-y-6">
         <div>
            <h1>Ogłoszenia</h1>
            <p className="text-text-500 mt-1">Przegląd opublikowanych komunikatów zespołu.</p>
         </div>
         <HubNavigationGrid items={hubItems} />
         <div className="space-y-3">
            {ANNOUNCEMENTS.map(item => (
               <article key={item.title} className="rounded-sm border border-border-300 bg-background p-4">
                  <p className="text-text-700 font-medium">{item.title}</p>
                  <p className="text-sm text-text-500">
                     {item.author} · {item.publishedAt}
                  </p>
               </article>
            ))}
         </div>
      </div>
   )
}

export default NotificationPage
