import { mockDb } from "@/lib/mock-db"
import type { ScheduleRow } from "@/lib/mock-db"

export type PlannerShift = ScheduleRow

export interface PlannerPersisted {
   shifts: PlannerShift[]
   nextId: number
}

export const PLANNER_STORAGE_KEY = "gm8_employee_shift_planner_v1"

function sanitizeShift(raw: unknown): PlannerShift | null {
   if (raw === null || typeof raw !== "object") return null
   const o = raw as Record<string, unknown>
   const id = o.id
   const user_id = o.user_id
   const date = o.date
   const start_time = o.start_time
   const end_time = o.end_time
   const note = o.note
   if (typeof id !== "number" || !Number.isFinite(id) || id < 1) return null
   if (typeof user_id !== "number" || !Number.isFinite(user_id) || user_id < 1) return null
   if (typeof date !== "string" || typeof start_time !== "string" || typeof end_time !== "string" || typeof note !== "string") {
      return null
   }
   const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date)
   const timeOk =
      /^([01]?\d|2[0-3]):([0-5]\d)$/.test(start_time) && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(end_time)
   if (!dateOk || !timeOk) return null
   return {
      id,
      date,
      user_id,
      start_time: start_time.length === 5 ? start_time : start_time.padStart(5, "0"),
      end_time: end_time.length === 5 ? end_time : end_time.padStart(5, "0"),
      note,
   }
}

export function normalizePlannerPersisted(raw: unknown): PlannerPersisted | null {
   if (raw === null || typeof raw !== "object") return null
   const obj = raw as Record<string, unknown>
   const nextIdRaw = obj.nextId
   if (!Number.isFinite(nextIdRaw as number)) return null
   const shiftsRaw = obj.shifts
   if (!Array.isArray(shiftsRaw)) return null
   const shifts: PlannerShift[] = []
   for (const row of shiftsRaw) {
      const ok = sanitizeShift(row)
      if (ok) shifts.push(ok)
   }
   let nextId = Math.floor(Number(nextIdRaw))
   nextId = nextId >= 1 ? nextId : 1
   if (shifts.length > 0) {
      nextId = Math.max(nextId, Math.max(...shifts.map(s => s.id)) + 1)
   }
   return { shifts, nextId }
}

export function seedPlannerPersisted(): PlannerPersisted {
   const shifts: PlannerShift[] = mockDb.schedules.map(row => ({
      id: row.id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      note: row.note,
      user_id: row.user_id,
   }))
   const nextId =
      shifts.length === 0 ? 1 : Math.max(...shifts.map(s => s.id), 0) + 1
   return { shifts, nextId }
}

export function loadPlannerBrowser(): PlannerPersisted | null {
   try {
      if (typeof window === "undefined") return null
      const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY)
      if (!raw) return null
      return normalizePlannerPersisted(JSON.parse(raw) as unknown)
   } catch {
      return null
   }
}

export function savePlannerBrowser(data: PlannerPersisted): void {
   try {
      if (typeof window === "undefined") return
      window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(data))
   } catch {
      /* ignore quota */
   }
}
