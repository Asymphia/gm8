"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import QuickActionModal from "@/components/ui/QuickActionModal"
import { mockDb, type AnnouncementRow } from "@/lib/mock-db"
import BackLink from "@/components/ui/BackLink"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"

function nextAnnouncementId(existing: AnnouncementRow[]): number {
   return existing.length === 0 ? 1 : Math.max(...existing.map(a => a.id)) + 1
}

function isoNow(): string {
   return new Date().toISOString()
}

const NotificationsBoardPage = () => {
   const { isOwner } = useAuth()
   const [posts, setPosts] = useState<AnnouncementRow[]>(() => mockDb.announcements.map(a => ({ ...a })))

   const visiblePosts = useMemo(
      () => (isOwner ? posts : posts.filter(p => p.is_published)),
      [isOwner, posts]
   )

   const [editOpen, setEditOpen] = useState(false)
   const [removeOpen, setRemoveOpen] = useState(false)
   const [announcementEditKey, setAnnouncementEditKey] = useState(0)
   const [announcementRemoveKey, setAnnouncementRemoveKey] = useState(0)

   const BOARD_ROWS = useMemo(
      () =>
         visiblePosts.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            visibility: announcement.is_published ? "Opublikowane" : "Szkic",
            type: `Autor #${announcement.user_id}`,
         })),
      [visiblePosts]
   )

   const selectOptions = useMemo(
      () =>
         visiblePosts.map(p => ({
            value: String(p.id),
            label: `${p.title} (#${p.id}) · ${p.is_published ? "Opublikowane" : "Szkic"}`,
         })),
      [visiblePosts]
   )

   return (
      <div className="space-y-6">
         <BackLink href="/notifications" label="Powrót do ogłoszeń" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Tablica ogłoszeń</h1>
               <p className="text-text-500 mt-1">
                  {isOwner
                     ? "Wybór ogłoszenia z listy — edycja i publikacja tylko w tej sesji przeglądarki."
                     : "Opublikowane komunikaty zespołu (tryb tylko do odczytu)."}
               </p>
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
                  onConfirm={vals => {
                     const id = nextAnnouncementId(posts)
                     const ts = isoNow()
                     const row: AnnouncementRow = {
                        id,
                        title: vals.title?.trim() || "Bez tytułu",
                        content: vals.content?.trim() || "",
                        created_at: ts,
                        timestamp_updated_at: ts,
                        is_published: vals.published === "yes",
                        user_id: 1,
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

         {isOwner && editOpen ? (
            <EditAnnouncementModal
               key={`e-${announcementEditKey}`}
               open={editOpen}
               onClose={() => setEditOpen(false)}
               posts={posts}
               options={selectOptions}
               onSave={nextPosts => setPosts(nextPosts)}
            />
         ) : null}
         {isOwner && removeOpen ? (
            <RemoveAnnouncementModal
               key={`r-${announcementRemoveKey}`}
               open={removeOpen}
               onClose={() => setRemoveOpen(false)}
               posts={posts}
               options={selectOptions}
               onRemove={filtered => setPosts(filtered)}
            />
         ) : null}

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[40rem] grid-cols-[minmax(0,1fr)_12rem_10rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Ogłoszenie</p>
               <p>Widoczność</p>
               <p>Typ</p>
            </div>
            {BOARD_ROWS.map(row => (
               <div
                  key={row.id}
                  className="grid min-w-[40rem] grid-cols-[minmax(0,1fr)_12rem_10rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p>{row.title}</p>
                  <p>{row.visibility}</p>
                  <p>{row.type}</p>
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
   onSave,
}: {
   open: boolean
   onClose: () => void
   posts: AnnouncementRow[]
   options: { value: string; label: string }[]
   onSave: (next: AnnouncementRow[]) => void
}) {
   const firstId = posts[0]?.id
   const [idStr, setIdStr] = useState(() => String(firstId ?? ""))
   const initial = posts.find(p => String(p.id) === idStr) ?? posts[0]
   const [title, setTitle] = useState(() => initial?.title ?? "")
   const [content, setContent] = useState(() => initial?.content ?? "")
   const [published, setPublished] = useState(() => initial?.is_published ?? false)

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

   const handleSave = () => {
      const id = Number.parseInt(idStr, 10)
      if (!Number.isFinite(id)) return
      const updated = isoNow()
      onSave(posts.map(p => (p.id === id ? { ...p, title, content, is_published: published, timestamp_updated_at: updated } : p)))
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
               <Button type="button" variant="primary" onClick={handleSave}>
                  Zapisz
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
   onRemove,
}: {
   open: boolean
   onClose: () => void
   posts: AnnouncementRow[]
   options: { value: string; label: string }[]
   onRemove: (next: AnnouncementRow[]) => void
}) {
   const [idStr, setIdStr] = useState(() => String(posts[0]?.id ?? ""))

   if (!open) return null

   const handleRemove = () => {
      const id = Number.parseInt(idStr, 10)
      if (!Number.isFinite(id)) return
      const ok = typeof window !== "undefined" ? window.confirm("Usunąć ten wpis z listy?") : true
      if (!ok) return
      onRemove(posts.filter(p => p.id !== id))
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
               <Button type="button" variant="warning" onClick={handleRemove}>
                  Usuń
               </Button>
            </div>
         </div>
      </Modal>
   )
}

export default NotificationsBoardPage
