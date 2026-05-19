"use client"

import { RequireOwner } from "@/components/auth/RequireOwner"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import EmployeeShiftCalendar from "@/components/schedule/EmployeeShiftCalendar"
import ShiftEditorModal from "@/components/schedule/ShiftEditorModal"
import { useSchedulePlanner } from "@/components/schedule/SchedulePlannerProvider"
import { isApiEnabled } from "@/lib/api/config"
import { fetchUsers } from "@/lib/api/users-api"
import { mockDb } from "@/lib/mock-db"
import type { PlannerShift } from "@/lib/schedule-planner-storage"
import type { UserDto } from "@/lib/api/types"
import { useEffect, useMemo, useState } from "react"

type PlannerOverlay =
   | { kind: "closed" }
   | { kind: "add"; rangeStart: Date; rangeEnd: Date }
   | { kind: "edit"; shift: PlannerShift }

interface PlanUser {
   id: string
   firstName: string
   lastName: string
   isActive: boolean
}

const defaultWorkdayAnchors = () => {
   const rangeStart = new Date()
   rangeStart.setMinutes(0, 0, 0)
   rangeStart.setHours(9, 0, 0, 0)
   const rangeEnd = new Date(rangeStart)
   rangeEnd.setHours(17, 0, 0, 0)
   return { rangeStart, rangeEnd }
}

function mapApiUser(u: UserDto): PlanUser {
   return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      isActive: u.isActive,
   }
}

function mapMockUser(u: (typeof mockDb.users)[number]): PlanUser {
   return {
      id: String(u.id),
      firstName: u.first_name,
      lastName: u.last_name,
      isActive: u.is_active,
   }
}

const SchedulePlanPage = () => {
   const planner = useSchedulePlanner()
   const useApi = isApiEnabled()
   const [users, setUsers] = useState<PlanUser[]>(() =>
      [...mockDb.users].map(mapMockUser).sort((a, b) => a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" }))
   )

   useEffect(() => {
      if (!useApi) return
      void fetchUsers()
         .then(rows =>
            setUsers(
               rows
                  .map(mapApiUser)
                  .sort((a, b) => a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" }))
            )
         )
         .catch(() => {})
   }, [useApi])

   const [employeeId, setEmployeeId] = useState(() => users[0]?.id ?? "")

   useEffect(() => {
      if (users.length === 0) return
      if (!users.some(u => u.id === employeeId)) {
         setEmployeeId(users[0]!.id)
      }
   }, [users, employeeId])

   const [overlay, setOverlay] = useState<PlannerOverlay>({ kind: "closed" })

   const selectedUser = users.find(u => u.id === employeeId)

   const shifts = useMemo(
      () => (employeeId ? planner.shifts.filter(s => s.user_id === employeeId) : []),
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

   const onCommitModal = async (row: Omit<PlannerShift, "id">, editingId: number | null) => {
      if (!selectedUser || !employeeId) return
      if (editingId !== null && shifts.every(s => s.id !== editingId)) return
      const rowOwned = { ...row, user_id: employeeId }
      if (editingId !== null) await planner.updateShift(editingId, rowOwned)
      else await planner.addShift(rowOwned)
   }

   return (
      <RequireOwner title="Harmonogram pracy">
         {!planner.ready ? (
            <p className="text-text-500 text-sm">Ładowanie harmonogramów…</p>
         ) : (
            <div className="space-y-8">
               {planner.loadError ? (
                  <p className="text-warning rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
                     {planner.loadError}
                  </p>
               ) : null}
               <BackLink href="/schedule" label="Powrót do harmonogramów" />

               <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                     <h1>Zmiany pracowników</h1>
                     <p className="text-text-500 mt-1 max-w-2xl">
                        {useApi
                           ? "Wybierz osobę i zarządzaj zmianami — dane zapisują się w API."
                           : "Wybierz osobę, potem przeciągnij blok w tygodniu/pojedynczym dniu albo dopisz zmianę ręcznie. Wszystko zapisuje się lokalnie w tej przeglądarce."}
                     </p>
                  </div>
                  <Button
                     type="button"
                     variant="primary"
                     size="sm"
                     disabled={!employeeId}
                     onClick={() => {
                        if (!employeeId) return
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
                        value={employeeId}
                        onChange={e => {
                           setOverlay({ kind: "closed" })
                           setEmployeeId(e.target.value)
                        }}
                        className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
                     >
                        {users.map(u => (
                           <option key={u.id} value={u.id}>
                              {u.lastName}, {u.firstName}
                              {u.isActive ? "" : " (nieaktywny)"}
                           </option>
                        ))}
                     </select>
                  </label>

                  {!employeeId ? (
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

               {overlay.kind !== "closed" && employeeId ? (
                  <ShiftEditorModal
                     key={
                        overlay.kind === "edit"
                           ? `e-${overlay.shift.id}`
                           : `a-${overlay.rangeStart.valueOf()}-${overlay.rangeEnd.valueOf()}`
                     }
                     onClose={closeOverlay}
                     employeeId={employeeId}
                     employeeDisplayName={
                        selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : "Nie wybrano pracownika"
                     }
                     editingShift={overlay.kind === "edit" ? overlay.shift : null}
                     presetStart={overlay.kind === "add" ? overlay.rangeStart : defaultWorkdayAnchors().rangeStart}
                     presetEnd={overlay.kind === "add" ? overlay.rangeEnd : defaultWorkdayAnchors().rangeEnd}
                     onCommit={onCommitModal}
                     onDelete={planner.removeShift}
                     useApi={useApi}
                  />
               ) : null}
            </div>
         )}
      </RequireOwner>
   )
}

export default SchedulePlanPage
