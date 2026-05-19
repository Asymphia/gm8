import { isApiEnabled } from "@/lib/api/config"
import { apiLogin, apiLogout } from "@/lib/api/auth-api"
import { clearAuthTokens, loadAuthTokens } from "@/lib/api/tokens"
import { mapApiRolesToAppRole } from "@/lib/api/mappers"
import { mockDb, type UserRole, type UserRow } from "@/lib/mock-db"

export type AppRole = "employee" | "owner"

export interface AuthSession {
   userId: string
   email: string
   firstName: string
   lastName: string
   appRole: AppRole
}

export const AUTH_STORAGE_KEY = "gm8_auth_session_v1"

export const DEMO_PASSWORD = "demo"

export const API_DEMO_ACCOUNTS = [
   {
      email: "anna.kowalska@example.com",
      password: "demo12",
      label: "Anna Kowalska",
      appRole: "owner" as const,
   },
   {
      email: "piotr.nowak@example.com",
      password: "demo12",
      label: "Piotr Nowak",
      appRole: "employee" as const,
   },
   {
      email: "admin@gm8.local",
      password: "Admin123!",
      label: "Administrator systemowy",
      appRole: "owner" as const,
   },
] as const

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
      userId: String(user.id),
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      appRole: mapDbRoleToAppRole(user.role),
   }
}

export async function loginWithBackend(email: string, password: string): Promise<AuthSession> {
   if (isApiEnabled()) {
      return apiLogin(email, password)
   }
   const session = authenticate(email, password)
   if (!session) {
      throw new Error("Nieprawidłowy e-mail lub hasło.")
   }
   return session
}

export async function logoutFromBackend(): Promise<void> {
   if (isApiEnabled()) {
      await apiLogout()
   }
   clearAuthSession()
}

export function loadAuthSession(): AuthSession | null {
   if (typeof window === "undefined") return null
   try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AuthSession
      if (!parsed?.userId || !parsed.email) return null

      if (isApiEnabled()) {
         if (!loadAuthTokens()?.accessToken) return null
         return parsed
      }

      const user = mockDb.users.find(u => String(u.id) === parsed.userId && u.is_active)
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
   clearAuthTokens()
}

export const OWNER_ONLY_PATH_PREFIXES = [
   "/schedule/employees",
   "/schedule/plan",
   "/warehouse/stocktaking",
   "/warehouse/products",
   "/recipes/new",
   "/recipes/templates",
   "/recipes/editing",
] as const

export const EMPLOYEE_MAIN_NAV_HREFS = ["/", "/notifications", "/orders", "/warehouse", "/schedule"] as const

export function isNotificationsHubPath(pathname: string): boolean {
   return pathname === "/notifications" || pathname === "/notifications/"
}

export function notificationsNavHref(role: AppRole): string {
   return role === "owner" ? "/notifications" : "/notifications/board"
}

export function resolveMainNavHref(href: string, role: AppRole): string {
   if (href === "/notifications") return notificationsNavHref(role)
   return href
}

export function isMainNavActive(navHref: string, pathname: string, role: AppRole): boolean {
   if (navHref === "/notifications") return pathname.startsWith("/notifications")
   const resolved = resolveMainNavHref(navHref, role)
   if (resolved === "/") return pathname === "/"
   return pathname === resolved || pathname.startsWith(`${resolved}/`)
}

export function isOwnerOnlyPath(pathname: string): boolean {
   if (OWNER_ONLY_PATH_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return true
   }
   if (pathname === "/recipes" || pathname === "/recipes/") return true
   if (/^\/recipes\/\d+\/edit\/?$/.test(pathname)) return true
   return false
}

export function canAccessPath(pathname: string, role: AppRole): boolean {
   if (role === "owner") return true
   if (isOwnerOnlyPath(pathname)) return false
   if (isNotificationsHubPath(pathname)) return false
   return true
}

export function canAccessMainNav(href: string, role: AppRole): boolean {
   if (role === "owner") return true
   return (EMPLOYEE_MAIN_NAV_HREFS as readonly string[]).includes(href)
}

export function initials(session: AuthSession): string {
   return `${session.firstName.charAt(0)}${session.lastName.charAt(0)}`.toUpperCase()
}

export function getDemoAccounts() {
   return isApiEnabled()
      ? [...API_DEMO_ACCOUNTS]
      : mockDb.users
           .filter(u => u.is_active)
           .map(u => ({
              email: u.email,
              password: DEMO_PASSWORD,
              label: `${u.first_name} ${u.last_name}`,
              appRole: mapDbRoleToAppRole(u.role),
           }))
}

export { mapApiRolesToAppRole }
