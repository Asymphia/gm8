const DEFAULT_API_URL = "http://localhost:5233"

export function getApiBaseUrl(): string {
   const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
   return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, "") : DEFAULT_API_URL
}

export function isApiEnabled(): boolean {
   const flag = process.env.NEXT_PUBLIC_USE_API?.trim().toLowerCase()
   return flag === "1" || flag === "true" || flag === "yes"
}
