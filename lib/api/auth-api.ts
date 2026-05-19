import { apiRequest } from "@/lib/api/client"
import { mapApiRolesToAppRole } from "@/lib/api/mappers"
import { clearAuthTokens, saveAuthTokens } from "@/lib/api/tokens"
import type { UserAuthDto, UserLoginRequest } from "@/lib/api/types"
import type { AuthSession } from "@/lib/auth"

export function authResponseToSession(auth: UserAuthDto): AuthSession {
   return {
      userId: auth.user.id,
      email: auth.user.email,
      firstName: auth.user.firstName,
      lastName: auth.user.lastName,
      appRole: mapApiRolesToAppRole(auth.user.roles),
   }
}

export async function apiLogin(email: string, password: string): Promise<AuthSession> {
   const auth = await apiRequest<UserAuthDto>("/api/Auth/login", {
      method: "POST",
      auth: false,
      body: { email: email.trim(), password } satisfies UserLoginRequest,
   })

   saveAuthTokens({
      accessToken: auth.accessToken,
      accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
   })

   return authResponseToSession(auth)
}

export async function apiLogout(): Promise<void> {
   try {
      await apiRequest<void>("/api/Auth/logout", { method: "POST" })
   } catch {
   } finally {
      clearAuthTokens()
   }
}
