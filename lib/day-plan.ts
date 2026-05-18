import { mockDb } from "@/lib/mock-db"
import { loadPlannerBrowser, type PlannerShift } from "@/lib/schedule-planner-storage"

export interface DayPlanEntry {
   id: string
   date: string
   start: string
   end: string
   note: string
   employeeName: string
   userId: number
}

function todayIsoLocal(): string {
   const d = new Date()
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${y}-${m}-${day}`
}

function userName(userId: number): string {
   const u = mockDb.users.find(row => row.id === userId)
   return u ? `${u.first_name} ${u.last_name}` : `Użytkownik #${userId}`
}

function mapShift(s: PlannerShift, idPrefix: string): DayPlanEntry {
   return {
      id: `${idPrefix}-${s.id}`,
      date: s.date,
      start: s.start_time,
      end: s.end_time,
      note: s.note,
      employeeName: userName(s.user_id),
      userId: s.user_id,
   }
}

export function collectDayPlan(forUserId?: number): DayPlanEntry[] {
   const today = todayIsoLocal()
   const planner = typeof window !== "undefined" ? loadPlannerBrowser() : null
   const shifts: PlannerShift[] = planner?.shifts ?? mockDb.schedules

   return shifts
      .filter(s => s.date === today && (forUserId === undefined || s.user_id === forUserId))
      .map(s => mapShift(s, planner ? "p" : "m"))
      .sort((a, b) => a.start.localeCompare(b.start))
}
