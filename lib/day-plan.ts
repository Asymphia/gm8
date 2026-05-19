import { isApiEnabled } from "@/lib/api/config"
import { fetchTodaySchedules } from "@/lib/api/schedules-api"
import { userNameById } from "@/lib/api/mappers"
import { fetchUsers } from "@/lib/api/users-api"
import { mockDb } from "@/lib/mock-db"
import { loadPlannerBrowser, type PlannerShift } from "@/lib/schedule-planner-storage"

export interface DayPlanEntry {
   id: string
   date: string
   start: string
   end: string
   note: string
   employeeName: string
   userId: string
}

function todayIsoLocal(): string {
   const d = new Date()
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${y}-${m}-${day}`
}

function userNameMock(userId: string): string {
   const u = mockDb.users.find(row => String(row.id) === userId)
   return u ? `${u.first_name} ${u.last_name}` : `Użytkownik`
}

function mapShift(s: PlannerShift, idPrefix: string, resolveName: (id: string) => string): DayPlanEntry {
   return {
      id: `${idPrefix}-${s.id}`,
      date: s.date,
      start: s.start_time,
      end: s.end_time,
      note: s.note,
      employeeName: resolveName(s.user_id),
      userId: s.user_id,
   }
}

export function collectDayPlan(forUserId?: string): DayPlanEntry[] {
   const today = todayIsoLocal()
   const planner = typeof window !== "undefined" ? loadPlannerBrowser() : null
   const shifts: PlannerShift[] = planner?.shifts ?? mockDb.schedules

   return shifts
      .filter(s => s.date === today && (forUserId === undefined || s.user_id === forUserId))
      .map(s => mapShift(s, planner ? "p" : "m", userNameMock))
      .sort((a, b) => a.start.localeCompare(b.start))
}

export async function collectDayPlanFromApi(forUserId?: string): Promise<DayPlanEntry[]> {
   const today = todayIsoLocal()
   const [shifts, users] = await Promise.all([
      fetchTodaySchedules(forUserId).then(list => list.filter(s => s.date === today)),
      forUserId ? Promise.resolve([]) : fetchUsers().catch(() => []),
   ])

   const resolveName =
      users.length > 0
         ? (id: string) => userNameById(users, id)
         : userNameMock

   return shifts
      .map(s => mapShift(s, "api", resolveName))
      .sort((a, b) => a.start.localeCompare(b.start))
}

export async function loadDayPlan(forUserId?: string): Promise<DayPlanEntry[]> {
   if (isApiEnabled()) {
      return collectDayPlanFromApi(forUserId)
   }
   return collectDayPlan(forUserId)
}
