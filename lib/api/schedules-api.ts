import { apiRequest } from "@/lib/api/client"
import {
   plannerShiftToCreateRequest,
   plannerShiftToUpdateRequest,
   scheduleDtoToPlannerShift,
} from "@/lib/api/mappers"
import type { ScheduleDto } from "@/lib/api/types"
import type { PlannerShift } from "@/lib/schedule-planner-storage"

export async function fetchAllSchedules(): Promise<PlannerShift[]> {
   const rows = await apiRequest<ScheduleDto[]>("/api/Schedule")
   return rows.map(scheduleDtoToPlannerShift)
}

export async function fetchSchedulesForUser(userId: string): Promise<PlannerShift[]> {
   const rows = await apiRequest<ScheduleDto[]>(`/api/Schedule/user/${encodeURIComponent(userId)}`)
   return rows.map(scheduleDtoToPlannerShift)
}

function localTodayIso(): string {
   const today = new Date()
   const y = today.getFullYear()
   const m = String(today.getMonth() + 1).padStart(2, "0")
   const d = String(today.getDate()).padStart(2, "0")
   return `${y}-${m}-${d}`
}

export async function fetchSchedulesForDate(dateIso: string, forUserId?: string): Promise<PlannerShift[]> {
   const query = forUserId ? `?userId=${encodeURIComponent(forUserId)}` : ""
   const rows = await apiRequest<ScheduleDto[]>(`/api/Schedule/date/${dateIso}${query}`)
   return rows.map(scheduleDtoToPlannerShift)
}

export async function fetchTodaySchedules(forUserId?: string): Promise<PlannerShift[]> {
   const todayIso = localTodayIso()
   try {
      return await fetchSchedulesForDate(todayIso, forUserId)
   } catch {
      const all = forUserId
         ? await fetchSchedulesForUser(forUserId).catch(() => [] as PlannerShift[])
         : await fetchAllSchedules().catch(() => [] as PlannerShift[])
      return all.filter(s => s.date === todayIso)
   }
}

export async function createSchedule(shift: Omit<PlannerShift, "id">): Promise<PlannerShift> {
   const created = await apiRequest<ScheduleDto>("/api/Schedule", {
      method: "POST",
      body: plannerShiftToCreateRequest(shift),
   })
   return scheduleDtoToPlannerShift(created)
}

export async function updateSchedule(id: number, shift: Omit<PlannerShift, "id">): Promise<PlannerShift> {
   const updated = await apiRequest<ScheduleDto>(`/api/Schedule/${id}`, {
      method: "PUT",
      body: plannerShiftToUpdateRequest(shift),
   })
   return scheduleDtoToPlannerShift(updated)
}

export async function deleteSchedule(id: number): Promise<void> {
   return apiRequest<void>(`/api/Schedule/${id}`, { method: "DELETE" })
}
