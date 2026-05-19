"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import QuickActionModal from "@/components/ui/QuickActionModal"
import { mockDb, type AnnouncementRow } from "@/lib/mock-db"
import BackLink from "@/components/ui/BackLink"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { isApiEnabled } from "@/lib/api/config"
import {
   createAnnouncement,
   deleteAnnouncement,
   fetchAllAnnouncements,
   fetchPublishedAnnouncements,
   updateAnnouncement,
} from "@/lib/api/announcements-api"
import { ApiError } from "@/lib/api/client"

function nextAnnouncementId(existing: AnnouncementRow[]): number {
   return existing.length === 0 ? 1 : Math.max(...existing.map(a => a.id)) + 1
}

function isoNow(): string {
   return new Date().toISOString()
}

const NotificationsBoardPage = () => {
   const { isOwner, session } = useAuth()
   const useApi = isApiEnabled()
   const [posts, setPosts] = useState<AnnouncementRow[]>(() =>
      useApi ? [] : mockDb.announcements.map(a => ({ ...a }))
   )
   const [loading, setLoading] = useState(useApi)
   const [error, setError] = useState<string | null>(null)

   const reload = useCallback(async () => {
      if (!useApi) {
         setPosts(mockDb.announcements.map(a => ({ ...a })))
         return
      }
      setLoading(true)
      setError(null)
      try {
         const rows = isOwner ? await fetchAllAnnouncements() : await fetchPublishedAnnouncements()
         setPosts(rows)
      } catch (err) {
         setError(err instanceof ApiError ? err.message : "Nie udało się pobrać ogłoszeń.")
      } finally {
         setLoading(false)
      }
   }, [useApi, isOwner])

   useEffect(() => {
      void reload()
   }, [reload])

   const visiblePosts = useMemo(
      () => (isOwner ? posts : posts.filter(p => p.is_published)),
      [isOwner, posts]
   )

   const [editOpen, setEditOpen] = useState(false)
   const [removeOpen, setRemoveOpen] = useState(false)
   const [announcementEditKey, setAnnouncementEditKey] = useState(0)
   const [announcementRemoveKey, setAnnouncementRemoveKey] = useState(0)

   const sortedPosts = useMemo(
      () =>
         [...visiblePosts].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
         ),
      [visiblePosts]
   )

   function formatDate(iso: string): string {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
      return new Intl.DateTimeFormat("pl-PL", {
         day: "numeric",
         month: "short",
         year: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      }).format(d)
   }

   const selectOptions = useMemo(
      () =>
         (isOwner ? posts : visiblePosts).map(p => ({
            value: String(p.id),
            label: `${p.title} (#${p.id}) · ${p.is_published ? "Opublikowane" : "Szkic"}`,
         })),
      [isOwner, posts, visiblePosts]
   )

   return (
      <div className="space-y-6">
         {isOwner ? <BackLink href="/notifications" label="Powrót do ogłoszeń" /> : null}
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>{isOwner ? "Tablica ogłoszeń" : "Ogłoszenia"}</h1>
               {isOwner ? (
                  <p className="text-text-500 mt-1">
                     {useApi
                        ? "Zarządzanie ogłoszeniami przez API."
                        : "Wybór ogłoszenia z listy — edycja i publikacja tylko w tej sesji przeglądarki."}
                  </p>
               ) : null}
            </div>
            {isOwner ? (
               <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <QuickActionModal
                     triggerLabel="Nowy wpis…"
                     title="Opublikuj ogłoszenie"
                     confirmLabel="Dodaj do tablicy"
                     fields={[
                        { name: "title", label: "Tytuł", placeholder: "Tytuł" },
                        { name: "content", label: "Treść", placeholder: "Treść" },
                        {
                           kind: "select",
                           name: "published",
                           label: "Widoczność",
                           options: [
                              { value: "yes", label: "Opublikowane" },
                              { value: "no", label: "Szkic" },
                           ],
                        },
                     ]}
                     onConfirm={async vals => {
                        if (useApi) {
                           try {
                              await createAnnouncement({
                                 title: vals.title?.trim() || "Bez tytułu",
                                 content: vals.content?.trim() || "",
                                 isPublished: vals.published === "yes",
                                 user_Id: session?.userId ?? null,
                              })
                              await reload()
                           } catch (err) {
                              setError(err instanceof ApiError ? err.message : "Nie udało się dodać ogłoszenia.")
                           }
                           return
                        }

                        const id = nextAnnouncementId(posts)
                        const ts = isoNow()
                        const row: AnnouncementRow = {
                           id,
                           title: vals.title?.trim() || "Bez tytułu",
                           content: vals.content?.trim() || "",
                           created_at: ts,
                           timestamp_updated_at: ts,
                           is_published: vals.published === "yes",
                           user_id: session?.userId ?? "1",
                        }
                        setPosts(previous => [...previous, row])
                     }}
                  />
                  <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     disabled={posts.length === 0}
                     onClick={() => {
                        setAnnouncementEditKey(previous => previous + 1)
                        setEditOpen(true)
                     }}
                  >
                     Edytuj wpis…
                  </Button>
                  <Button
                     type="button"
                     variant="warning"
                     size="sm"
                     disabled={posts.length === 0}
                     onClick={() => {
                        setAnnouncementRemoveKey(previous => previous + 1)
                        setRemoveOpen(true)
                     }}
                  >
                     Usuń wpis…
                  </Button>
               </div>
            ) : null}
         </div>

         {error ? <p className="text-warning text-sm">{error}</p> : null}
         {loading ? <p className="text-text-500 text-sm">Ładowanie ogłoszeń…</p> : null}

         {isOwner && editOpen ? (
            <EditAnnouncementModal
               key={`e-${announcementEditKey}`}
               open={editOpen}
               onClose={() => setEditOpen(false)}
               posts={posts}
               options={selectOptions}
               useApi={useApi}
               onSave={async nextPosts => {
                  if (useApi) await reload()
                  else setPosts(nextPosts)
               }}
            />
         ) : null}
         {isOwner && removeOpen ? (
            <RemoveAnnouncementModal
               key={`r-${announcementRemoveKey}`}
               open={removeOpen}
               onClose={() => setRemoveOpen(false)}
               posts={posts}
               options={selectOptions}
               useApi={useApi}
               onRemove={async filtered => {
                  if (useApi) await reload()
                  else setPosts(filtered)
               }}
            />
         ) : null}

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            {!loading && sortedPosts.length === 0 ? (
               <p className="text-text-500 px-4 py-6 text-sm">Brak ogłoszeń do wyświetlenia.</p>
            ) : null}
            {sortedPosts.map(announcement => (
               <div
                  key={announcement.id}
                  className="border-b border-border-300 px-4 py-4 last:border-0"
               >
                  <p className="text-text-700 font-semibold">{announcement.title}</p>
                  <p className="text-text-500 mt-2 whitespace-pre-wrap text-sm">{announcement.content || "—"}</p>
                  <p className="text-text-300 mt-2 text-xs">
                     {announcement.is_published ? "Opublikowane" : "Szkic"} · {formatDate(announcement.created_at)}
                  </p>
               </div>
            ))}
         </div>
      </div>
   )
}

function EditAnnouncementModal({
   open,
   onClose,
   posts,
   options,
   useApi,
   onSave,
}: {
   open: boolean
   onClose: () => void
   posts: AnnouncementRow[]
   options: { value: string; label: string }[]
   useApi: boolean
   onSave: (next: AnnouncementRow[]) => void | Promise<void>
}) {
   const firstId = posts[0]?.id
   const [idStr, setIdStr] = useState(() => String(firstId ?? ""))
   const initial = posts.find(p => String(p.id) === idStr) ?? posts[0]
   const [title, setTitle] = useState(() => initial?.title ?? "")
   const [content, setContent] = useState(() => initial?.content ?? "")
   const [published, setPublished] = useState(() => initial?.is_published ?? false)
   const [saving, setSaving] = useState(false)

   if (!open) return null

   const syncFromPick = (nextIdStr: string) => {
      setIdStr(nextIdStr)
      const row = posts.find(p => String(p.id) === nextIdStr)
      if (row) {
         setTitle(row.title)
         setContent(row.content)
         setPublished(row.is_published)
      }
   }

   const handleSave = async () => {
      const id = Number.parseInt(idStr, 10)
      if (!Number.isFinite(id)) return

      if (useApi) {
         setSaving(true)
         try {
            await updateAnnouncement(id, {
               title,
               content,
               isPublished: published,
            })
            await onSave(posts)
            onClose()
         } finally {
            setSaving(false)
         }
         return
      }

      const updated = isoNow()
      await onSave(
         posts.map(p =>
            p.id === id ? { ...p, title, content, is_published: published, timestamp_updated_at: updated } : p
         )
      )
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Edytuj ogłoszenie</h2>
               <p className="text-text-500 mt-1 text-sm">Wybór z listy zamiast ręcznego wpisywania tytułu.</p>
            </div>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Wpis</span>
               <select
                  value={idStr}
                  onChange={e => syncFromPick(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Tytuł</span>
               <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Treść</span>
               <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={3}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-text-700">
               <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
               Opublikowany
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Zapisywanie…" : "Zapisz"}
               </Button>
            </div>
         </div>
      </Modal>
   )
}

function RemoveAnnouncementModal({
   open,
   onClose,
   posts,
   options,
   useApi,
   onRemove,
}: {
   open: boolean
   onClose: () => void
   posts: AnnouncementRow[]
   options: { value: string; label: string }[]
   useApi: boolean
   onRemove: (next: AnnouncementRow[]) => void | Promise<void>
}) {
   const [idStr, setIdStr] = useState(() => String(posts[0]?.id ?? ""))
   const [removing, setRemoving] = useState(false)

   if (!open) return null

   const handleRemove = async () => {
      const id = Number.parseInt(idStr, 10)
      if (!Number.isFinite(id)) return
      const ok = typeof window !== "undefined" ? window.confirm("Usunąć ten wpis z listy?") : true
      if (!ok) return

      if (useApi) {
         setRemoving(true)
         try {
            await deleteAnnouncement(id)
            await onRemove(posts.filter(p => p.id !== id))
            onClose()
         } finally {
            setRemoving(false)
         }
         return
      }

      await onRemove(posts.filter(p => p.id !== id))
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Usuń wpis</h2>
               <p className="text-text-500 mt-1 text-sm">Zaznacz wpis na liście.</p>
            </div>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Wpis</span>
               <select
                  value={idStr}
                  onChange={e => setIdStr(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="warning" onClick={() => void handleRemove()} disabled={removing}>
                  {removing ? "Usuwanie…" : "Usuń"}
               </Button>
            </div>
         </div>
      </Modal>
   )
}

export default NotificationsBoardPage
