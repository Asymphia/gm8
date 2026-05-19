"use client"

import {
   clearAuthSession,
   loadAuthSession,
   loginWithBackend,
   logoutFromBackend,
   saveAuthSession,
   type AuthSession,
} from "@/lib/auth"
import { ApiError, AUTH_SESSION_EXPIRED_EVENT } from "@/lib/api/client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

interface AuthContextValue {
   ready: boolean
   session: AuthSession | null
   login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
   logout: () => Promise<void>
   isOwner: boolean
   isEmployee: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
   const [ready, setReady] = useState(false)
   const [session, setSession] = useState<AuthSession | null>(null)

   useEffect(() => {
      queueMicrotask(() => {
         setSession(loadAuthSession())
         setReady(true)
      })
   }, [])

   useEffect(() => {
      const onExpired = () => {
         clearAuthSession()
         setSession(null)
      }
      window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired)
      return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired)
   }, [])

   const login = useCallback(async (email: string, password: string) => {
      try {
         const next = await loginWithBackend(email, password)
         saveAuthSession(next)
         setSession(next)
         return { ok: true as const }
      } catch (error) {
         const message =
            error instanceof ApiError
               ? error.message
               : error instanceof Error
                 ? error.message
                 : "Nie udało się zalogować."
         return { ok: false as const, error: message }
      }
   }, [])

   const logout = useCallback(async () => {
      await logoutFromBackend()
      setSession(null)
   }, [])

   const value = useMemo(
      () => ({
         ready,
         session,
         login,
         logout,
         isOwner: session?.appRole === "owner",
         isEmployee: session?.appRole === "employee",
      }),
      [login, logout, ready, session]
   )

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
   const ctx = useContext(AuthContext)
   if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
   return ctx
}
