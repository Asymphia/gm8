"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { notificationsNavHref } from "@/lib/auth"
import { isApiEnabled } from "@/lib/api/config"
import { fetchPublishedAnnouncements } from "@/lib/api/announcements-api"
import { mockDb, type AnnouncementRow } from "@/lib/mock-db"

function formatDate(iso: string): string {
   const d = new Date(iso)
   if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ")
   return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
   }).format(d)
}

const NotificationPage = () => {
   const router = useRouter()
   const { session, ready } = useAuth()
   const useApi = isApiEnabled()
   const [posts, setPosts] = useState<AnnouncementRow[]>(() =>
      useApi ? [] : mockDb.announcements.filter(a => a.is_published)
   )
   const [loading, setLoading] = useState(useApi)

   const reload = useCallback(async () => {
      if (!useApi) {
         setPosts(mockDb.announcements.filter(a => a.is_published))
         return
      }
      setLoading(true)
      try {
         const rows = await fetchPublishedAnnouncements()
         setPosts(rows)
      } catch {
         setPosts([])
      } finally {
         setLoading(false)
      }
   }, [useApi])

   useEffect(() => {
      if (!ready || !session) return
      if (session.appRole === "employee") {
         router.replace(notificationsNavHref("employee"))
         return
      }
      void reload()
   }, [ready, reload, router, session])

   if (!ready || session?.appRole === "employee") {
      return null
   }

   const publishedCount = posts.filter(p => p.is_published).length

   const hubItems = [
      {
         href: "/notifications/board",
         label: "Tablica ogłoszeń",
         description: "Dodawanie, edycja i publikacja wpisów.",
         value: loading ? "…" : String(publishedCount),
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Ogłoszenia</h1>
            <p className="text-text-500 mt-1">
               {useApi
                  ? "Opublikowane komunikaty z API. Zarządzanie wpisami na tablicy."
                  : "Tryb demo — dane z mocków w przeglądarce."}
            </p>
         </div>
         <HubNavigationGrid items={hubItems} />
         {loading ? <p className="text-text-500 text-sm">Ładowanie ogłoszeń…</p> : null}
         <div className="space-y-3">
            {!loading && posts.length === 0 ? (
               <p className="text-text-500 text-sm">Brak opublikowanych ogłoszeń.</p>
            ) : null}
            {posts.map(item => (
               <article key={item.id} className="rounded-sm border border-border-300 bg-background p-4">
                  <p className="text-text-700 font-medium">{item.title}</p>
                  <p className="text-text-500 mt-1 text-sm line-clamp-3">{item.content || "—"}</p>
                  <p className="text-text-300 mt-2 text-xs">{formatDate(item.created_at)}</p>
               </article>
            ))}
         </div>
      </div>
   )
}

export default NotificationPage
