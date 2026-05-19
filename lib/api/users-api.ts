import { apiRequest } from "@/lib/api/client"
import type { UserCreateRequest, UserDto, UserUpdateRequest } from "@/lib/api/types"

export async function fetchUsers(): Promise<UserDto[]> {
   return apiRequest<UserDto[]>("/api/User")
}

export async function fetchUserById(id: string): Promise<UserDto> {
   return apiRequest<UserDto>(`/api/User/${encodeURIComponent(id)}`)
}

export async function createUser(body: UserCreateRequest): Promise<UserDto> {
   return apiRequest<UserDto>("/api/User", { method: "POST", body })
}

export async function updateUser(id: string, body: UserUpdateRequest): Promise<UserDto> {
   return apiRequest<UserDto>(`/api/User/${encodeURIComponent(id)}`, { method: "PUT", body })
}

export async function deleteUser(id: string): Promise<void> {
   return apiRequest<void>(`/api/User/${encodeURIComponent(id)}`, { method: "DELETE" })
}
