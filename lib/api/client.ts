import { getApiBaseUrl } from "@/lib/api/config"
import { formatApiErrorBody } from "@/lib/format-api-error"
import { clearAuthTokens, getAccessToken, loadAuthTokens, saveAuthTokens } from "@/lib/api/tokens"
import type { UserAuthDto } from "@/lib/api/types"

export const AUTH_SESSION_EXPIRED_EVENT = "gm8:auth-session-expired"

export class ApiError extends Error {
   status: number
   body: unknown

   constructor(message: string, status: number, body: unknown) {
      super(message)
      this.name = "ApiError"
      this.status = status
      this.body = body
      Object.setPrototypeOf(this, ApiError.prototype)
   }
}

function notifySessionExpired(): void {
   if (typeof window === "undefined") return
   clearAuthTokens()
   window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

let refreshInFlight: Promise<string | null> | null = null

function parseProblemMessage(body: unknown, fallback: string): string {
   return formatApiErrorBody(body, fallback)
}

async function parseJsonSafe(response: Response): Promise<unknown> {
   const text = await response.text()
   if (!text) return null
   try {
      return JSON.parse(text) as unknown
   } catch {
      return text
   }
}

async function refreshAccessToken(): Promise<string | null> {
   const current = loadAuthTokens()
   if (!current?.accessToken) return null

   const response = await fetch(`${getApiBaseUrl()}/api/Auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: current.accessToken, refreshToken: null }),
   })

   if (!response.ok) {
      clearAuthTokens()
      return null
   }

   const auth = (await response.json()) as UserAuthDto
   saveAuthTokens({
      accessToken: auth.accessToken,
      accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
   })
   return auth.accessToken
}

async function getValidAccessToken(): Promise<string | null> {
   const token = getAccessToken()
   if (!token) return null

   const stored = loadAuthTokens()
   if (stored?.accessTokenExpiresAtUtc) {
      const expires = new Date(stored.accessTokenExpiresAtUtc).getTime()
      if (Number.isFinite(expires) && expires - Date.now() < 60_000) {
         if (!refreshInFlight) {
            refreshInFlight = refreshAccessToken().finally(() => {
               refreshInFlight = null
            })
         }
         return refreshInFlight
      }
   }

   return token
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
   body?: unknown
   auth?: boolean
   skipRefresh?: boolean
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
   const { body, auth = true, skipRefresh = false, headers: initHeaders, ...rest } = options
   const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`

   const headers = new Headers(initHeaders)
   if (body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
   }

   if (auth) {
      const token = await getValidAccessToken()
      if (!token) {
         notifySessionExpired()
         throw new ApiError("Brak aktywnej sesji — zaloguj się ponownie.", 401, null)
      }
      headers.set("Authorization", `Bearer ${token}`)
   }

   let response: Response
   try {
      response = await fetch(url, {
         ...rest,
         headers,
         credentials: "include",
         body: body === undefined ? undefined : JSON.stringify(body),
      })
   } catch {
      throw new ApiError(
         `Nie można połączyć z API (${getApiBaseUrl()}). Uruchom backend na porcie 5233.`,
         0,
         null
      )
   }

   const parsedBody = await parseJsonSafe(response)

   if (response.status === 401 && auth && !skipRefresh) {
      if (!refreshInFlight) {
         refreshInFlight = refreshAccessToken().finally(() => {
            refreshInFlight = null
         })
      }
      const newToken = await refreshInFlight
      if (newToken) {
         return apiRequest<T>(path, { ...options, skipRefresh: true })
      }
      notifySessionExpired()
      throw new ApiError(
         parseProblemMessage(parsedBody, "Sesja wygasła — zaloguj się ponownie."),
         401,
         parsedBody
      )
   }

   if (!response.ok) {
      const fallback =
         response.status === 403
            ? "Brak uprawnień do tej operacji."
            : response.statusText || `HTTP ${response.status}`
      throw new ApiError(parseProblemMessage(parsedBody, fallback), response.status, parsedBody)
   }

   if (response.status === 204) return undefined as T
   return parsedBody as T
}
