import { mockDb, type UserRole, type UserRow } from "@/lib/mock-db"

export type AppRole = "employee" | "owner"

export interface AuthSession {
   userId: number
   email: string
   firstName: string
   lastName: string
   appRole: AppRole
}

export const AUTH_STORAGE_KEY = "gm8_auth_session_v1"

export const DEMO_PASSWORD = "demo"

export function mapDbRoleToAppRole(dbRole: UserRole): AppRole {
   if (dbRole === "manager" || dbRole === "admin") return "owner"
   return "employee"
}

export function appRoleLabel(role: AppRole): string {
   return role === "owner" ? "Właściciel" : "Pracownik"
}

export function authenticate(email: string, password: string): AuthSession | null {
   const normalized = email.trim().toLowerCase()
   if (!normalized || password !== DEMO_PASSWORD) return null

   const user = mockDb.users.find(u => u.email.toLowerCase() === normalized && u.is_active)
   if (!user) return null

   return sessionFromUser(user)
}

export function sessionFromUser(user: UserRow): AuthSession {
   return {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      appRole: mapDbRoleToAppRole(user.role),
   }
}

export function loadAuthSession(): AuthSession | null {
   if (typeof window === "undefined") return null
   try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed?.userId || !parsed.email) return null
      const user = mockDb.users.find(u => u.id === parsed.userId && u.is_active)
      if (!user) return null
      return sessionFromUser(user)
   } catch {
      return null
   }
}

export function saveAuthSession(session: AuthSession): void {
   if (typeof window === "undefined") return
   window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
   if (typeof window === "undefined") return
   window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export const OWNER_ONLY_PATH_PREFIXES = ["/schedule/employees", "/schedule/plan"] as const

export function isOwnerOnlyPath(pathname: string): boolean {
   return OWNER_ONLY_PATH_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function canAccessPath(pathname: string, role: AppRole): boolean {
   if (role === "owner") return true
   if (isOwnerOnlyPath(pathname)) return false
   return true
}

export function initials(session: AuthSession): string {
   return `${session.firstName.charAt(0)}${session.lastName.charAt(0)}`.toUpperCase()
}

export const DEMO_ACCOUNTS = mockDb.users
   .filter(u => u.is_active)
   .map(u => ({
      email: u.email,
      password: DEMO_PASSWORD,
      label: `${u.first_name} ${u.last_name}`,
      appRole: mapDbRoleToAppRole(u.role),
   }))
