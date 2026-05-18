"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { DEMO_ACCOUNTS, appRoleLabel } from "@/lib/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"

const LoginPage = () => {
   const { login } = useAuth()
   const router = useRouter()
   const [email, setEmail] = useState(DEMO_ACCOUNTS[0]?.email ?? "")
   const [password, setPassword] = useState("demo")
   const [error, setError] = useState<string | null>(null)
   const [pending, setPending] = useState(false)

   const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault()
      setPending(true)
      setError(null)
      const result = login(email, password)
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
            <p className="text-text-500 mt-2 text-sm">Zaloguj się jako pracownik lub właściciel.</p>

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
                  Zaloguj
               </Button>
            </form>

            <div className="border-border-300 mt-6 rounded-sm border bg-foreground p-3">
               <p className="text-text-700 mb-2 text-xs font-semibold uppercase">Konta demo</p>
               <ul className="text-text-500 space-y-1.5 text-xs">
                  {DEMO_ACCOUNTS.map(account => (
                     <li key={account.email}>
                        <button
                           type="button"
                           className="hover:text-primary-500 text-left"
                           onClick={() => {
                              setEmail(account.email)
                              setPassword(account.password)
                           }}
                        >
                           {account.label} · {appRoleLabel(account.appRole)} — {account.email}
                        </button>
                     </li>
                  ))}
               </ul>
               <p className="text-text-300 mt-2 text-[11px]">Hasło dla wszystkich: demo</p>
            </div>
         </div>
      </div>
   )
}

export default LoginPage
