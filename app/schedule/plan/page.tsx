"use client"

import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import EmployeeShiftCalendar from "@/components/schedule/EmployeeShiftCalendar"
import ShiftEditorModal from "@/components/schedule/ShiftEditorModal"
import { useSchedulePlanner } from "@/components/schedule/SchedulePlannerProvider"
import { mockDb } from "@/lib/mock-db"
import type { PlannerShift } from "@/lib/schedule-planner-storage"
import { useMemo, useState } from "react"

type PlannerOverlay =
   | { kind: "closed" }
   | { kind: "add"; rangeStart: Date; rangeEnd: Date }
   | { kind: "edit"; shift: PlannerShift }

const defaultWorkdayAnchors = () => {
   const rangeStart = new Date()
   rangeStart.setMinutes(0, 0, 0)
   rangeStart.setHours(9, 0, 0, 0)
   const rangeEnd = new Date(rangeStart)
   rangeEnd.setHours(17, 0, 0, 0)
   return { rangeStart, rangeEnd }
}

const SchedulePlanPage = () => {
   const planner = useSchedulePlanner()
   const sortedUsers = useMemo(
      () =>
         [...mockDb.users].sort((a, b) =>
            a.last_name.localeCompare(b.last_name, undefined, { sensitivity: "base" })
         ),
      []
   )

   const [employeeIdStr, setEmployeeIdStr] = useState(() => String(mockDb.users[0]?.id ?? ""))

   const [overlay, setOverlay] = useState<PlannerOverlay>({ kind: "closed" })

   const employeeId = Number.parseInt(employeeIdStr, 10)
   const selectedUser = sortedUsers.find(u => String(u.id) === employeeIdStr)

   const shifts = useMemo(
      () =>
         Number.isFinite(employeeId) ? planner.shifts.filter(s => s.user_id === employeeId) : [],
      [employeeId, planner.shifts]
   )

   const tableRows = useMemo(
      () =>
         [...shifts].sort(
            (a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
         ),
      [shifts]
   )

   const closeOverlay = () => setOverlay({ kind: "closed" })

   const onCommitModal = (row: Omit<PlannerShift, "id">, editingId: number | null) => {
      if (!selectedUser || !Number.isFinite(employeeId) || employeeId < 1) return
      if (editingId !== null && shifts.every(s => s.id !== editingId)) return
      const rowOwned = { ...row, user_id: employeeId }
      if (editingId !== null) planner.updateShift(editingId, rowOwned)
      else planner.addShift(rowOwned)
   }

   if (!planner.ready) {
      return <p className="text-text-500 text-sm">Ładowanie harmonogramów…</p>
   }

   return (
      <div className="space-y-8">
         <BackLink href="/schedule" label="Powrót do harmonogramów" />

         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
               <h1>Zmiany pracowników</h1>
               <p className="text-text-500 mt-1 max-w-2xl">
                  Wybierz osobę, potem przeciągnij blok w tygodniu/pojedynczym dniu albo dopisz zmianę ręcznie. Wszystko zapisuje
                  się lokalnie w tej przeglądarce.
               </p>
            </div>
            <Button
               type="button"
               variant="primary"
               size="sm"
               disabled={!Number.isFinite(employeeId)}
               onClick={() => {
                  if (!Number.isFinite(employeeId)) return
                  const anchors = defaultWorkdayAnchors()
                  setOverlay({ kind: "add", rangeStart: anchors.rangeStart, rangeEnd: anchors.rangeEnd })
               }}
            >
               Dodaj zmianę…
            </Button>
         </div>

         <section className="border-border-300 rounded-md border bg-background p-3 shadow-sm sm:p-4 md:p-5">
            <label className="text-text-700 mb-4 flex max-w-xl flex-col gap-1">
               <span className="text-sm font-medium">Pracownik</span>
               <select
                  value={employeeIdStr}
                  onChange={e => {
                     setOverlay({ kind: "closed" })
                     setEmployeeIdStr(e.target.value)
                  }}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {sortedUsers.map(u => (
                     <option key={u.id} value={String(u.id)}>
                        {u.last_name}, {u.first_name}
                        {u.is_active ? "" : " (nieaktywny)"}
                     </option>
                  ))}
               </select>
            </label>

            {!Number.isFinite(employeeId) ? (
               <p className="text-text-500 text-sm">Wybierz pracownika z listy.</p>
            ) : (
               <EmployeeShiftCalendar
                  plannerShifts={shifts}
                  onSelectSlot={(rangeStart, rangeEnd) =>
                     setOverlay({ kind: "add", rangeStart, rangeEnd })
                  }
                  onEventClickShift={shift => setOverlay({ kind: "edit", shift })}
               />
            )}
         </section>

         <div>
            <h2 className="text-text-700 mb-3 text-lg font-semibold tracking-tight">Lista zmian (wybrany pracownik)</h2>
            <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
               <div className="grid min-w-[36rem] grid-cols-[6.5rem_minmax(0,1fr)_4.5rem_4.5rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
                  <p>Data</p>
                  <p>Notka</p>
                  <p>Od</p>
                  <p>Do</p>
               </div>
               {tableRows.length === 0 ? (
                  <div className="text-text-500 px-4 py-6 text-center text-sm">Brak zmian — dodaj blok w kalendarzu.</div>
               ) : (
                  tableRows.map(row => (
                     <button
                        type="button"
                        key={row.id}
                        onClick={() => setOverlay({ kind: "edit", shift: row })}
                        className="hover:bg-surface grid w-full min-w-[36rem] cursor-pointer grid-cols-[6.5rem_minmax(0,1fr)_4.5rem_4.5rem] border-b border-border-300 px-4 py-3 text-left text-sm text-text-500 transition-colors last:border-0"
                     >
                        <p className="font-mono text-xs text-text-700">{row.date}</p>
                        <p className="text-text-700">{row.note || "—"}</p>
                        <p className="tabular-nums">{row.start_time}</p>
                        <p className="tabular-nums">{row.end_time}</p>
                     </button>
                  ))
               )}
            </div>
         </div>

         {overlay.kind !== "closed" && Number.isFinite(employeeId) ? (
            <ShiftEditorModal
               key={
                  overlay.kind === "edit"
                     ? `e-${overlay.shift.id}`
                     : `a-${overlay.rangeStart.valueOf()}-${overlay.rangeEnd.valueOf()}`
               }
               onClose={closeOverlay}
               employeeId={employeeId}
               employeeDisplayName={
                  selectedUser
                     ? `${selectedUser.first_name} ${selectedUser.last_name}`
                     : "Nie wybrano pracownika"
               }
               editingShift={overlay.kind === "edit" ? overlay.shift : null}
               presetStart={overlay.kind === "add" ? overlay.rangeStart : defaultWorkdayAnchors().rangeStart}
               presetEnd={overlay.kind === "add" ? overlay.rangeEnd : defaultWorkdayAnchors().rangeEnd}
               onCommit={onCommitModal}
               onDelete={planner.removeShift}
            />
         ) : null}
      </div>
   )
}

export default SchedulePlanPage
