"use client"

import {
   createContext,
   useCallback,
   useContext,
   useEffect,
   useMemo,
   useState,
   type ReactNode,
} from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ApiError } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import {
   createSchedule,
   deleteSchedule,
   fetchAllSchedules,
   fetchSchedulesForUser,
   updateSchedule,
} from "@/lib/api/schedules-api"
import {
   PLANNER_STORAGE_KEY,
   loadPlannerBrowser,
   notifyPlannerUpdated,
   savePlannerBrowser,
   seedPlannerPersisted,
   type PlannerShift,
} from "@/lib/schedule-planner-storage"

interface SchedulePlannerContextValue {
   ready: boolean
   loadError: string | null
   shifts: PlannerShift[]
   shiftsForEmployee: (userId: string) => PlannerShift[]
   addShift: (row: Omit<PlannerShift, "id">) => void | Promise<void>
   updateShift: (id: number, row: Omit<PlannerShift, "id">) => void | Promise<void>
   removeShift: (id: number) => void | Promise<void>
   reload: () => Promise<void>
}

const SchedulePlannerContext = createContext<SchedulePlannerContextValue | null>(null)

export function SchedulePlannerProvider({ children }: { children: ReactNode }) {
   const useApi = isApiEnabled()
   const { session, isOwner } = useAuth()
   const [ready, setReady] = useState(false)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [{ shifts, nextId }, setState] = useState(() => seedPlannerPersisted())

   const reload = useCallback(async () => {
      if (useApi) {
         if (!session) return
         try {
            const loaded = isOwner
               ? await fetchAllSchedules()
               : await fetchSchedulesForUser(session.userId)
            setState({ shifts: loaded, nextId: 1 })
            setLoadError(null)
            notifyPlannerUpdated()
         } catch (err) {
            setLoadError(err instanceof ApiError ? err.message : "Nie udało się pobrać grafiku.")
         }
         return
      }

      try {
         const stored = loadPlannerBrowser()
         if (stored) setState(stored)
         else {
            const seed = seedPlannerPersisted()
            savePlannerBrowser(seed)
            setState(seed)
         }
      } catch {
         setState(seedPlannerPersisted())
      }
   }, [isOwner, session, useApi])

   useEffect(() => {
      if (useApi && !session) return
      queueMicrotask(() => {
         void reload().finally(() => setReady(true))
      })
   }, [reload, session, useApi])

   useEffect(() => {
      if (!ready || useApi) return
      savePlannerBrowser({ shifts, nextId })
      notifyPlannerUpdated()
   }, [ready, shifts, nextId, useApi])

   useEffect(() => {
      if (useApi) return
      const onStorage = (event: StorageEvent) => {
         if (event.key !== PLANNER_STORAGE_KEY) return
         const stored = loadPlannerBrowser()
         if (stored) setState(stored)
      }
      window.addEventListener("storage", onStorage)
      return () => window.removeEventListener("storage", onStorage)
   }, [useApi])

   const shiftsForEmployee = useCallback(
      (userId: string) => shifts.filter(s => s.user_id === userId).sort((a, b) => a.date.localeCompare(b.date)),
      [shifts]
   )

   const addShift = useCallback(
      async (row: Omit<PlannerShift, "id">) => {
         if (useApi) {
            try {
               const created = await createSchedule(row)
               setState(prev => ({
                  shifts: [...prev.shifts, created],
                  nextId: prev.nextId,
               }))
               setLoadError(null)
               notifyPlannerUpdated()
            } catch (err) {
               const message = err instanceof ApiError ? err.message : "Nie udało się dodać zmiany."
               setLoadError(message)
               throw err instanceof Error ? err : new Error(message)
            }
            return
         }
         setState(prev => ({
            shifts: [...prev.shifts, { ...row, id: prev.nextId }],
            nextId: prev.nextId + 1,
         }))
      },
      [useApi]
   )

   const updateShift = useCallback(
      async (id: number, row: Omit<PlannerShift, "id">) => {
         if (useApi) {
            try {
               const updated = await updateSchedule(id, row)
               setState(prev => ({
                  ...prev,
                  shifts: prev.shifts.map(s => (s.id === id ? updated : s)),
               }))
               setLoadError(null)
               notifyPlannerUpdated()
            } catch (err) {
               const message = err instanceof ApiError ? err.message : "Nie udało się zaktualizować zmiany."
               setLoadError(message)
               throw err instanceof Error ? err : new Error(message)
            }
            return
         }
         setState(prev => ({
            ...prev,
            shifts: prev.shifts.map(s => (s.id === id ? { ...row, id } : s)),
         }))
      },
      [useApi]
   )

   const removeShift = useCallback(
      async (id: number) => {
         if (useApi) {
            try {
               await deleteSchedule(id)
               setState(prev => ({
                  ...prev,
                  shifts: prev.shifts.filter(s => s.id !== id),
               }))
               setLoadError(null)
               notifyPlannerUpdated()
            } catch (err) {
               const message = err instanceof ApiError ? err.message : "Nie udało się usunąć zmiany."
               setLoadError(message)
               throw err instanceof Error ? err : new Error(message)
            }
            return
         }
         setState(prev => ({
            ...prev,
            shifts: prev.shifts.filter(s => s.id !== id),
         }))
      },
      [useApi]
   )

   const value = useMemo(
      () =>
         ({
            ready,
            loadError,
            shifts,
            shiftsForEmployee,
            addShift,
            updateShift,
            removeShift,
            reload,
         }) satisfies SchedulePlannerContextValue,
      [addShift, loadError, ready, reload, removeShift, shifts, shiftsForEmployee, updateShift]
   )

   return (
      <SchedulePlannerContext.Provider value={value}>{children}</SchedulePlannerContext.Provider>
   )
}

export function useSchedulePlanner(): SchedulePlannerContextValue {
   const ctx = useContext(SchedulePlannerContext)
   if (!ctx) throw new Error("useSchedulePlanner must be used under SchedulePlannerProvider")
   return ctx
}
