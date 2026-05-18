"use client"

import {
   authenticate,
   clearAuthSession,
   loadAuthSession,
   saveAuthSession,
   type AuthSession,
} from "@/lib/auth"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

interface AuthContextValue {
   ready: boolean
   session: AuthSession | null
   login: (email: string, password: string) => { ok: true } | { ok: false; error: string }
   logout: () => void
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

   const login = useCallback((email: string, password: string) => {
      const next = authenticate(email, password)
      if (!next) {
         return { ok: false as const, error: "Nieprawidłowy e-mail lub hasło (użyj hasła „demo”)." }
      }
      saveAuthSession(next)
      setSession(next)
      return { ok: true as const }
   }, [])

   const logout = useCallback(() => {
      clearAuthSession()
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
