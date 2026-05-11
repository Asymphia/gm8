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
import { PLANNER_STORAGE_KEY, loadPlannerBrowser, savePlannerBrowser, seedPlannerPersisted, type PlannerShift } from "@/lib/schedule-planner-storage"

interface SchedulePlannerContextValue {
   ready: boolean
   shifts: PlannerShift[]
   shiftsForEmployee: (userId: number) => PlannerShift[]
   addShift: (row: Omit<PlannerShift, "id">) => void
   updateShift: (id: number, row: Omit<PlannerShift, "id">) => void
   removeShift: (id: number) => void
}

const SchedulePlannerContext = createContext<SchedulePlannerContextValue | null>(null)

export function SchedulePlannerProvider({ children }: { children: ReactNode }) {
   const [ready, setReady] = useState(false)
   const [{ shifts, nextId }, setState] = useState(() => seedPlannerPersisted())

   useEffect(() => {
      queueMicrotask(() => {
         try {
            const stored = loadPlannerBrowser()
            if (stored) setState(stored)
            else {
               const seed = seedPlannerPersisted()
               savePlannerBrowser(seed)
               setState(seed)
            }
         } catch {
            const seed = seedPlannerPersisted()
            setState(seed)
         }
         setReady(true)
      })
   }, [])

   useEffect(() => {
      if (!ready) return
      savePlannerBrowser({ shifts, nextId })
   }, [ready, shifts, nextId])

   useEffect(() => {
      const onStorage = (event: StorageEvent) => {
         if (event.key !== PLANNER_STORAGE_KEY) return
         const stored = loadPlannerBrowser()
         if (stored) setState(stored)
      }
      window.addEventListener("storage", onStorage)
      return () => window.removeEventListener("storage", onStorage)
   }, [])

   const shiftsForEmployee = useCallback(
      (userId: number) => shifts.filter(s => s.user_id === userId).sort((a, b) => a.date.localeCompare(b.date)),
      [shifts]
   )

   const addShift = useCallback((row: Omit<PlannerShift, "id">) => {
      setState(prev => ({
         shifts: [...prev.shifts, { ...row, id: prev.nextId }],
         nextId: prev.nextId + 1,
      }))
   }, [])

   const updateShift = useCallback((id: number, row: Omit<PlannerShift, "id">) => {
      setState(prev => ({
         ...prev,
         shifts: prev.shifts.map(s => (s.id === id ? { ...row, id } : s)),
      }))
   }, [])

   const removeShift = useCallback((id: number) => {
      setState(prev => ({
         ...prev,
         shifts: prev.shifts.filter(s => s.id !== id),
      }))
   }, [])

   const value = useMemo(
      () =>
         ({
            ready,
            shifts,
            shiftsForEmployee,
            addShift,
            updateShift,
            removeShift,
         }) satisfies SchedulePlannerContextValue,
      [addShift, ready, removeShift, shifts, shiftsForEmployee, updateShift]
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
