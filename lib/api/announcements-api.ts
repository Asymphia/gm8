import { apiRequest } from "@/lib/api/client"
import { announcementDtoToRow } from "@/lib/api/mappers"
import type { AnnouncementCreateRequest, AnnouncementDto, AnnouncementUpdateRequest } from "@/lib/api/types"
import type { AnnouncementRow } from "@/lib/mock-db"

export async function fetchAllAnnouncements(): Promise<AnnouncementRow[]> {
   const rows = await apiRequest<AnnouncementDto[]>("/api/Announcement")
   return rows.map(announcementDtoToRow)
}

export async function fetchPublishedAnnouncements(): Promise<AnnouncementRow[]> {
   try {
      const rows = await apiRequest<AnnouncementDto[]>("/api/Announcement/published")
      return rows.map(announcementDtoToRow)
   } catch {
      try {
         const rows = await apiRequest<AnnouncementDto[]>("/api/Announcement")
         return rows.map(announcementDtoToRow).filter(a => a.is_published)
      } catch {
         return []
      }
   }
}

export async function createAnnouncement(body: AnnouncementCreateRequest): Promise<AnnouncementRow> {
   const created = await apiRequest<AnnouncementDto>("/api/Announcement", { method: "POST", body })
   return announcementDtoToRow(created)
}

export async function updateAnnouncement(id: number, body: AnnouncementUpdateRequest): Promise<AnnouncementRow> {
   const updated = await apiRequest<AnnouncementDto>(`/api/Announcement/${id}`, { method: "PUT", body })
   return announcementDtoToRow(updated)
}

export async function deleteAnnouncement(id: number): Promise<void> {
   return apiRequest<void>(`/api/Announcement/${id}`, { method: "DELETE" })
}
