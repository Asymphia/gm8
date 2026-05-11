"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
   ArchiveBoxIcon,
   BookmarkIcon,
   BriefcaseIcon,
   CalendarDaysIcon,
   CubeIcon,
   HomeIcon,
   Bars3Icon,
   XMarkIcon,
   MegaphoneIcon,
   Squares2X2Icon,
} from "@heroicons/react/24/outline"

const MAIN_NAV_ITEMS = [
   { href: "/", label: "Dashboard", icon: HomeIcon },
   { href: "/notifications", label: "Notifications", icon: MegaphoneIcon },
   { href: "/warehouse", label: "Warehouse", icon: CubeIcon },
   { href: "/recipes", label: "Recipes", icon: BookmarkIcon },
   { href: "/orders", label: "Orders", icon: ArchiveBoxIcon },
   { href: "/schedule", label: "Harmonogram", icon: CalendarDaysIcon },
]

const WAREHOUSE_SUB_ITEMS = [
   { href: "/warehouse", label: "Overview" },
   { href: "/warehouse/products", label: "Products" },
   { href: "/warehouse/stock", label: "Stock levels" },
   { href: "/warehouse/deliveries", label: "Deliveries" },
   { href: "/warehouse/expiration", label: "Expiration" },
   { href: "/warehouse/stocktaking", label: "Stocktaking" },
   { href: "/warehouse/stocktaking/inventories", label: "Inventory list" },
]

const RECIPES_SUB_ITEMS = [
   { href: "/recipes", label: "Overview" },
   { href: "/recipes/definitions", label: "All recipes" },
   { href: "/recipes/new", label: "New recipe" },
   { href: "/recipes/templates", label: "Templates" },
   { href: "/recipes/editing", label: "Lifecycle" },
]

const ORDERS_SUB_ITEMS = [
   { href: "/orders", label: "Overview" },
   { href: "/orders/register", label: "Register order" },
   { href: "/orders/list", label: "Order list" },
]

const SCHEDULE_SUB_ITEMS = [
   { href: "/schedule", label: "Harmonogram" },
   { href: "/schedule/plan", label: "Kalendarz zmian" },
   { href: "/schedule/employees", label: "Pracownicy" },
]

const NOTIFICATIONS_SUB_ITEMS = [
   { href: "/notifications", label: "Announcements" },
   { href: "/notifications/board", label: "Board" },
]

const MODULE_SUB_NAV: Partial<Record<string, { href: string; label: string }[]>> = {
   "/warehouse": WAREHOUSE_SUB_ITEMS,
   "/recipes": RECIPES_SUB_ITEMS,
   "/orders": ORDERS_SUB_ITEMS,
   "/schedule": SCHEDULE_SUB_ITEMS,
   "/notifications": NOTIFICATIONS_SUB_ITEMS,
}

interface AppShellProps {
   children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
   const pathname = usePathname()
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

   const isMainItemActive = (href: string) => {
      if (href === "/") return pathname === "/"
      return pathname.startsWith(href)
   }

   return (
      <div className="min-h-screen bg-foreground p-2 sm:p-3">
         <div className="flex min-h-[calc(100vh-0.5rem)] gap-3 sm:min-h-[calc(100vh-0.75rem)]">
            <aside className="border-border-300 bg-background hidden w-72 rounded-md border p-4 shadow-sm md:flex md:flex-col">
               <p className="text-text-300 mb-4 text-sm">Storage</p>
               <div className="mb-5 flex items-center justify-between rounded-md px-2 py-3">
                  <p className="text-text-700 text-4xl leading-none font-semibold tracking-tight">
                     GM<span className="text-primary-500">8</span>
                  </p>
                  <button type="button" className="text-text-500 rounded-sm p-1">
                     <BriefcaseIcon className="h-5 w-5" />
                  </button>
               </div>
               <nav className="flex-1 space-y-1">
                  {MAIN_NAV_ITEMS.map(item => {
                     const active = isMainItemActive(item.href)
                     const Icon = item.icon
                     return (
                        <div key={item.href}>
                           <Link
                              href={item.href}
                              className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                                 active ? "bg-foreground text-text-700" : "text-text-500 hover:bg-foreground hover:text-text-700"
                              }`}
                           >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span>{item.label}</span>
                           </Link>
                           {active && MODULE_SUB_NAV[item.href] ? (
                              <div className="ml-9 mt-1 space-y-1">
                                 {MODULE_SUB_NAV[item.href]!.map(subItem => {
                                    const subActive = pathname === subItem.href
                                    return (
                                       <Link
                                          key={subItem.href}
                                          href={subItem.href}
                                          className={`block rounded-sm px-2 py-1 text-xs ${
                                             subActive
                                                ? "text-primary-500 font-medium"
                                                : "text-text-500 hover:text-text-700"
                                          }`}
                                       >
                                          {subItem.label}
                                       </Link>
                                    )
                                 })}
                              </div>
                           ) : null}
                        </div>
                     )
                  })}
               </nav>
               <div className="border-border-300 mt-4 border-t pt-4">
                  <div className="flex items-center gap-3">
                     <div className="bg-foreground text-text-700 flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold">
                        SZ
                     </div>
                     <div>
                        <p className="text-text-700 text-sm font-medium">Super Szop</p>
                        <p className="text-text-300 text-xs">superSzop@onet.eu</p>
                     </div>
                  </div>
                  <button
                     type="button"
                     className="text-text-500 mt-3 inline-flex items-center gap-1 text-xs hover:text-text-700"
                  >
                     <Squares2X2Icon className="h-3.5 w-3.5" />
                     Log out
                  </button>
               </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
               <header className="border-border-300 bg-background rounded-md border p-3 shadow-sm md:hidden">
                  <div className="flex items-center justify-between">
                     <p className="text-text-700 text-lg font-semibold">
                        GM<span className="text-primary-500">8</span>
                     </p>
                     <button
                        type="button"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setIsMobileMenuOpen(previous => !previous)}
                        className="text-text-700 hover:bg-foreground rounded-sm p-1.5"
                     >
                        {isMobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                     </button>
                  </div>
                  {isMobileMenuOpen ? (
                     <nav className="mt-3 space-y-1 border-t border-border-300 pt-3">
                        {MAIN_NAV_ITEMS.map(item => {
                           const active = isMainItemActive(item.href)
                           const subs = MODULE_SUB_NAV[item.href]
                           return (
                              <div key={item.href} className="space-y-0.5">
                                 <Link
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`block rounded-sm px-3 py-2 text-sm ${
                                       active ? "bg-primary-500 text-white" : "text-text-500 hover:bg-foreground hover:text-text-700"
                                    }`}
                                 >
                                    {item.label}
                                 </Link>
                                 {subs && active ? (
                                    <div className="border-border-300 mb-2 ml-4 space-y-0.5 border-l pl-3">
                                       {subs.map(subItem => (
                                          <Link
                                             key={subItem.href}
                                             href={subItem.href}
                                             onClick={() => setIsMobileMenuOpen(false)}
                                             className={`block rounded-sm px-2 py-1.5 text-xs ${
                                                pathname === subItem.href
                                                   ? "text-primary-600 font-semibold"
                                                   : "text-text-500 hover:text-text-700"
                                             }`}
                                          >
                                             {subItem.label}
                                          </Link>
                                       ))}
                                    </div>
                                 ) : null}
                              </div>
                           )
                        })}
                     </nav>
                  ) : null}
               </header>
               <main className="mt-3 min-w-0 flex-1 rounded-md bg-transparent px-2 py-2 sm:px-3 sm:py-3">{children}</main>
            </div>
         </div>
      </div>
   )
}

export default AppShell
