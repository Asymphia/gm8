import type { ApiProblemDetails } from "@/lib/api/types"

const FIELD_LABELS: Record<string, string> = {
   Password: "Hasło",
   Email: "E-mail",
   UserName: "Login",
   FirstName: "Imię",
   LastName: "Nazwisko",
   password: "Hasło",
   email: "E-mail",
   first_name: "Imię",
   last_name: "Nazwisko",
}

function fieldLabel(key: string): string {
   return FIELD_LABELS[key] ?? key
}

function translateLine(message: string): string {
   const m = message.trim()
   if (/at least 6 characters/i.test(m)) return "minimum 6 znaków"
   if (/between 2 and 50/i.test(m) && /first name/i.test(m)) return "imię: od 2 do 50 znaków"
   if (/between 2 and 50/i.test(m) && /last name/i.test(m)) return "nazwisko: od 2 do 50 znaków"
   if (/between 3 and 50/i.test(m)) return "login: od 3 do 50 znaków"
   if (/Invalid email/i.test(m)) return "nieprawidłowy format e-mail"
   if (/Email already exists/i.test(m)) return "ten e-mail jest już zajęty"
   if (/UserName already exists/i.test(m)) return "ten login jest już zajęty"
   return m
}

export function formatApiErrorBody(body: unknown, fallback: string): string {
   if (!body || typeof body !== "object") return fallback

   const problem = body as ApiProblemDetails & { message?: string; statusCode?: number }

   if (problem.errors && typeof problem.errors === "object") {
      const lines = Object.entries(problem.errors).flatMap(([key, msgs]) =>
         (msgs ?? []).map(msg => `${fieldLabel(key)}: ${translateLine(msg)}`)
      )
      if (lines.length > 0) return lines.join(" · ")
   }

   if (
      problem.message &&
      problem.message !== "Internal server error." &&
      problem.message !== "One or more validation errors occurred."
   ) {
      return translateLine(problem.message)
   }

   if (problem.detail && problem.detail !== "Internal server error.") {
      return translateLine(problem.detail)
   }

   if (problem.title && problem.title !== "One or more validation errors occurred.") {
      return problem.title
   }

   return fallback
}

export function formatCaughtError(err: unknown, fallback: string): string {
   if (err && typeof err === "object" && "body" in err && "message" in err) {
      const apiErr = err as { message?: string; body?: unknown }
      return formatApiErrorBody(apiErr.body, apiErr.message || fallback)
   }
   if (err instanceof Error && err.message) return err.message
   return fallback
}

export const EMPLOYEE_PASSWORD_HINT =
   "Hasło: minimum 6 znaków (np. demo12). Login z części e-mail przed @ — co najmniej 3 znaki (np. jan.kowalska@firma.pl)."

export function validateNewEmployeeInput(vals: Record<string, string>): string | null {
   const first = vals.first_name?.trim() ?? ""
   const last = vals.last_name?.trim() ?? ""
   if (first.length < 2) return "Imię: minimum 2 znaki."
   if (last.length < 2) return "Nazwisko: minimum 2 znaki."

   const email = vals.email?.trim() ?? ""
   if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Podaj poprawny adres e-mail."
   }

   const loginPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ?? ""
   if (loginPart.length < 3) {
      return "Część przed @ w e-mailu musi mieć co najmniej 3 znaki (litery/cyfry), np. jan.kowalska@firma.pl."
   }

   const password = vals.password?.trim() ?? ""
   if (password.length < 6) return "Hasło: minimum 6 znaków."

   return null
}

export function usernameFromEmail(email: string): string {
   const local = email
      .split("@")[0]
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "") || "user"
   if (local.length >= 3) return local.slice(0, 50)
   return `u_${local}`.slice(0, 50)
}
