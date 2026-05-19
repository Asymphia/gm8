"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"

const LoginPage = () => {
   const { login } = useAuth()
   const router = useRouter()
   const [email, setEmail] = useState("")
   const [password, setPassword] = useState("")
   const [error, setError] = useState<string | null>(null)
   const [pending, setPending] = useState(false)

   const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault()
      setPending(true)
      setError(null)
      const result = await login(email, password)
      setPending(false)
      if (!result.ok) {
         setError(result.error)
         return
      }
      router.replace("/")
   }

   return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-foreground p-4 sm:p-6">
         <div className="border-border-300 w-full max-w-md rounded-md border bg-background p-5 shadow-sm sm:p-6">
            <p className="text-text-700 text-3xl font-semibold tracking-tight">
               GM<span className="text-primary-500">8</span>
            </p>
            <p className="text-text-500 mt-2 text-sm">Zaloguj się do systemu.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
               <label className="flex flex-col gap-1">
                  <span className="text-text-700 text-sm font-medium">E-mail</span>
                  <input
                     type="email"
                     autoComplete="username"
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="flex flex-col gap-1">
                  <span className="text-text-700 text-sm font-medium">Hasło</span>
                  <input
                     type="password"
                     autoComplete="current-password"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               {error ? <p className="text-warning text-sm">{error}</p> : null}
               <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Logowanie…" : "Zaloguj"}
               </Button>
            </form>
         </div>
      </div>
   )
}

export default LoginPage
