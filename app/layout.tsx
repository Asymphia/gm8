import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ReactNode } from "react"
import { AppProviders } from "@/components/providers/AppProviders"

const DMSans = DM_Sans({
   variable: "--font-dm-sans",
   subsets: ["latin"],
})

export const metadata: Metadata = {
   title: "GM8",
   description: "System operacyjny gastronomii GM8",
}

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
   return (
      <html lang="pl" className={`${DMSans.variable}`}>
         <body>
            <AppProviders>{children}</AppProviders>
         </body>
      </html>
   )
}

export default RootLayout
