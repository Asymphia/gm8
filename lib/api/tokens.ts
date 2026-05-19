export const AUTH_TOKENS_STORAGE_KEY = "gm8_auth_tokens_v1"

export interface StoredAuthTokens {
   accessToken: string
   accessTokenExpiresAtUtc: string
}

export function loadAuthTokens(): StoredAuthTokens | null {
   if (typeof window === "undefined") return null
   try {
      const raw = window.localStorage.getItem(AUTH_TOKENS_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredAuthTokens
      if (!parsed?.accessToken) return null
      return parsed
   } catch {
      return null
   }
}

export function saveAuthTokens(tokens: StoredAuthTokens): void {
   if (typeof window === "undefined") return
   window.localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearAuthTokens(): void {
   if (typeof window === "undefined") return
   window.localStorage.removeItem(AUTH_TOKENS_STORAGE_KEY)
}

export function getAccessToken(): string | null {
   return loadAuthTokens()?.accessToken ?? null
}
