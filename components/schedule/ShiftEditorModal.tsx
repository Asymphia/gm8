"use client"

import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import type { PlannerShift } from "@/lib/schedule-planner-storage"
import { useState } from "react"

function isoDateLocal(d: Date): string {
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${y}-${m}-${day}`
}

/** HH:mm in local timezone */
function hhmmLocal(d: Date): string {
   const h = String(d.getHours()).padStart(2, "0")
   const m = String(d.getMinutes()).padStart(2, "0")
   return `${h}:${m}`
}

function padHm(raw: string): string {
   const matched = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
   if (!matched) return raw.trim()
   const h = Number.parseInt(matched[1], 10)
   const m = Number.parseInt(matched[2], 10)
   return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function toMinutes(hm: string): number {
   const [h, m] = hm.split(":").map(Number)
   if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN
   return h * 60 + m
}

/** Domyślny czas końca dla nowego bloku wg zaznaczenia w kalendarzu */
function deriveEndHmForAdd(presetStart: Date, presetEnd: Date): string {
   const startStr = hhmmLocal(presetStart)
   let endCandidate = hhmmLocal(presetEnd > presetStart ? presetEnd : presetStart)
   const startM = toMinutes(startStr)
   const endM = toMinutes(endCandidate)
   if (presetEnd <= presetStart || !Number.isFinite(endM) || endM <= startM || endM - startM < 15) {
      const plus = new Date(presetStart)
      plus.setHours(plus.getHours() + 1)
      endCandidate = hhmmLocal(plus)
   }
   return endCandidate
}

interface ShiftEditorModalProps {
   onClose: () => void
   employeeId: number
   employeeDisplayName: string
   editingShift: PlannerShift | null
   presetStart: Date
   presetEnd: Date
   onCommit: (row: Omit<PlannerShift, "id">, editingId: number | null) => void
   onDelete: (id: number) => void
}

const ShiftEditorModal = ({
   onClose,
   employeeId,
   employeeDisplayName,
   editingShift,
   presetStart,
   presetEnd,
   onCommit,
   onDelete,
}: ShiftEditorModalProps) => {
   /** Moduł dostaje świeży `key` od rodzica — inicjalizacja tylko przy montowaniu istnieje w synch z propsami. */
   const [dateStr, setDateStr] = useState(() => editingShift?.date ?? isoDateLocal(presetStart))
   const [startHm, setStartHm] = useState(() => editingShift?.start_time ?? hhmmLocal(presetStart))
   const [endHm, setEndHm] = useState(() => editingShift?.end_time ?? deriveEndHmForAdd(presetStart, presetEnd))
   const [note, setNote] = useState(() => editingShift?.note ?? "")
   const [error, setError] = useState<string | null>(null)

   const handleSave = () => {
      const a = toMinutes(startHm)
      const b = toMinutes(endHm)
      setError(null)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
         setError("Wpisz datę w formacie RRRR-MM-DD.")
         return
      }
      if (!/^([01]?\d|2[0-3]):([0-5]\d)$/.test(startHm) || !/^([01]?\d|2[0-3]):([0-5]\d)$/.test(endHm)) {
         setError("Godziny w formacie HH:MM.")
         return
      }
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) {
         setError("Godzina końca musi być późniejsza od początku (ta sama dobę).")
         return
      }

      const row: Omit<PlannerShift, "id"> = {
         date: dateStr,
         user_id: employeeId,
         start_time: padHm(startHm),
         end_time: padHm(endHm),
         note,
      }

      onCommit(row, editingShift?.id ?? null)
      onClose()
   }

   const handleDelete = () => {
      if (!editingShift) return
      const ok =
         typeof window === "undefined" ? true : window.confirm("Usunąć tę zmianę z kalendarza?")
      if (!ok) return
      onDelete(editingShift.id)
      onClose()
   }

   return (
      <Modal isOpen onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">{editingShift ? "Edytuj zmianę" : "Nowa zmiana"}</h2>
               <p className="text-text-500 mt-1 text-sm">{employeeDisplayName}</p>
            </div>

            {error ? <p className="text-warning text-sm">{error}</p> : null}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
               <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-text-700 text-sm font-medium">Data</span>
                  <input
                     type="date"
                     value={dateStr}
                     onChange={e => setDateStr(e.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="flex flex-col gap-1">
                  <span className="text-text-700 text-sm font-medium">Start</span>
                  <input
                     type="time"
                     value={startHm}
                     onChange={e => setStartHm(e.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="flex flex-col gap-1">
                  <span className="text-text-700 text-sm font-medium">Koniec</span>
                  <input
                     type="time"
                     value={endHm}
                     onChange={e => setEndHm(e.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-text-700 text-sm font-medium">Notatka</span>
                  <textarea
                     value={note}
                     onChange={e => setNote(e.target.value)}
                     rows={2}
                     placeholder="np. rano prep, zamknięcie kasy…"
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full resize-y rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-border-300 pt-3">
               <div>
                  {editingShift ? (
                     <Button type="button" variant="warning" onClick={handleDelete}>
                        Usuń
                     </Button>
                  ) : null}
               </div>
               <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                     Anuluj
                  </Button>
                  <Button type="button" variant="primary" onClick={handleSave}>
                     Zapisz
                  </Button>
               </div>
            </div>
            <p className="text-text-300 text-[11px] leading-snug">
               Zapis w przeglądarce (localStorage). Zmiana obowiązuje dla wybranego pracownika.
            </p>
         </div>
      </Modal>
   )
}

export default ShiftEditorModal
