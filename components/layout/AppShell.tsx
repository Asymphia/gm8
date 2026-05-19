"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
   ArchiveBoxIcon,
   BookmarkIcon,
   CalendarDaysIcon,
   CubeIcon,
   HomeIcon,
   Bars3Icon,
   XMarkIcon,
   MegaphoneIcon,
   ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/components/auth/AuthProvider"
import { appRoleLabel, canAccessMainNav, initials, isMainNavActive, resolveMainNavHref } from "@/lib/auth"
import type { AppRole } from "@/lib/auth"

const MAIN_NAV_ITEMS = [
   { href: "/", label: "Pulpit", icon: HomeIcon, shortLabel: "Pulpit" },
   { href: "/notifications", label: "Powiadomienia", icon: MegaphoneIcon, shortLabel: "Ogłoszenia" },
   { href: "/warehouse", label: "Magazyn", icon: CubeIcon, shortLabel: "Magazyn" },
   { href: "/recipes", label: "Przepisy", icon: BookmarkIcon, shortLabel: "Przepisy" },
   { href: "/orders", label: "Zamówienia", icon: ArchiveBoxIcon, shortLabel: "Zamów." },
   { href: "/schedule", label: "Harmonogram", icon: CalendarDaysIcon, shortLabel: "Grafik" },
]

const WAREHOUSE_SUB_ITEMS = [
   { href: "/warehouse", label: "Przegląd" },
   { href: "/warehouse/products", label: "Produkty" },
   { href: "/warehouse/stock", label: "Stany magazynowe" },
   { href: "/warehouse/deliveries", label: "Dostawy" },
   { href: "/warehouse/expiration", label: "Ważność" },
   { href: "/warehouse/stocktaking", label: "Inwentaryzacja" },
   { href: "/warehouse/stocktaking/inventories", label: "Lista inwentaryzacji" },
]

const RECIPES_SUB_ITEMS = [
   { href: "/recipes", label: "Przegląd" },
   { href: "/recipes/definitions", label: "Wszystkie przepisy" },
   { href: "/recipes/new", label: "Nowy przepis" },
   { href: "/recipes/templates", label: "Szablony" },
   { href: "/recipes/editing", label: "Cykl życia" },
]

const ORDERS_SUB_ITEMS = [
   { href: "/orders", label: "Przegląd" },
   { href: "/orders/register", label: "Rejestracja zamówienia" },
   { href: "/orders/list", label: "Lista zamówień" },
]

function scheduleSubItems(role: AppRole) {
   const base = [{ href: "/schedule", label: "Harmonogram" }]
   if (role === "owner") {
      return [
         ...base,
         { href: "/schedule/plan", label: "Kalendarz zmian" },
         { href: "/schedule/employees", label: "Pracownicy" },
      ]
   }
   return base
}

const NOTIFICATIONS_SUB_ITEMS = [
   { href: "/notifications", label: "Ogłoszenia" },
   { href: "/notifications/board", label: "Tablica" },
]

function warehouseSubItems(role: AppRole) {
   if (role === "owner") return WAREHOUSE_SUB_ITEMS
   return WAREHOUSE_SUB_ITEMS.filter(
      item =>
         item.href === "/warehouse" ||
         item.href === "/warehouse/stock" ||
         item.href === "/warehouse/deliveries" ||
         item.href === "/warehouse/expiration"
   )
}

function mainNavForRole(role: AppRole) {
   return MAIN_NAV_ITEMS.filter(item => canAccessMainNav(item.href, role))
}

function moduleSubNav(role: AppRole): Partial<Record<string, { href: string; label: string }[]>> {
   const nav: Partial<Record<string, { href: string; label: string }[]>> = {
      "/warehouse": warehouseSubItems(role),
      "/orders": ORDERS_SUB_ITEMS,
      "/schedule": scheduleSubItems(role),
   }
   if (role === "owner") {
      nav["/recipes"] = RECIPES_SUB_ITEMS
      nav["/notifications"] = NOTIFICATIONS_SUB_ITEMS
   }
   return nav
}

interface AppShellProps {
   children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => {
   const pathname = usePathname()
   const { session, logout } = useAuth()
   const [isDrawerOpen, setIsDrawerOpen] = useState(false)

   const role = session?.appRole ?? "employee"
   const mainNav = useMemo(() => mainNavForRole(role), [role])
   const subNav = useMemo(() => moduleSubNav(role), [role])

   useEffect(() => {
      if (!isDrawerOpen) return
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
         document.body.style.overflow = prev
      }
   }, [isDrawerOpen])

   const isMainItemActive = (href: string) => isMainNavActive(href, pathname, role)

   const userInitials = session ? initials(session) : "?"
   const roleLabel = session ? appRoleLabel(session.appRole) : ""

   const handleLogout = () => {
      void logout().then(() => {
         window.location.href = "/login"
      })
   }

   const renderNav = (onNavigate?: () => void, compact?: boolean) =>
      mainNav.map(item => {
         const active = isMainItemActive(item.href)
         const Icon = item.icon
         const navHref = resolveMainNavHref(item.href, role)
         const subs = subNav[item.href]
         return (
            <div key={item.href}>
               <Link
                  href={navHref}
                  onClick={onNavigate}
                  className={`flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                     active ? "bg-foreground text-text-700" : "text-text-500 hover:bg-foreground hover:text-text-700"
                  }`}
               >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{compact ? item.shortLabel : item.label}</span>
               </Link>
               {active && subs && !compact ? (
                  <div className="ml-9 mt-1 space-y-0.5 pb-1">
                     {subs.map(subItem => {
                        const subActive = pathname === subItem.href
                        return (
                           <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={onNavigate}
                              className={`block rounded-sm px-2 py-1.5 text-xs ${
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
      })

   return (
      <div className="min-h-screen bg-foreground">
         <div className="flex min-h-screen w-full p-2 sm:p-3 lg:p-4">
            <aside className="border-border-300 bg-background sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col rounded-md border p-4 shadow-sm lg:flex xl:w-72">
               <p className="text-text-300 mb-3 text-xs font-medium tracking-wide uppercase">GastroM8</p>
               <p className="text-text-700 mb-5 text-3xl leading-none font-semibold tracking-tight xl:text-4xl">
                  GM<span className="text-primary-500">8</span>
               </p>
               <nav className="flex-1 space-y-0.5 overflow-y-auto">{renderNav()}</nav>
               {session ? (
                  <div className="border-border-300 mt-4 shrink-0 border-t pt-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-foreground text-text-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                           {userInitials}
                        </div>
                        <div className="min-w-0">
                           <p className="text-text-700 truncate text-sm font-medium">
                              {session.firstName} {session.lastName}
                           </p>
                           <p className="text-text-300 truncate text-xs">
                              {roleLabel}
                           </p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={handleLogout}
                        className="text-text-500 hover:text-text-700 mt-3 inline-flex items-center gap-1.5 text-xs"
                     >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        Wyloguj
                     </button>
                  </div>
               ) : null}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
               <header className="border-border-300 bg-background sticky top-0 z-30 flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 shadow-sm lg:hidden">
                  <Link href="/" className="text-text-700 text-lg font-semibold">
                     GM<span className="text-primary-500">8</span>
                  </Link>
                  <div className="flex items-center gap-1">
                     {session ? (
                        <span className="text-text-300 hidden max-w-[7rem] truncate text-xs sm:inline">
                           {session.firstName}
                        </span>
                     ) : null}
                     <button
                        type="button"
                        aria-label={isDrawerOpen ? "Zamknij menu" : "Menu i konto"}
                        onClick={() => setIsDrawerOpen(open => !open)}
                        className="text-text-700 hover:bg-foreground rounded-sm p-2"
                     >
                        {isDrawerOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                     </button>
                  </div>
               </header>

               <main className="app-main-pad mt-2 min-w-0 flex-1 px-2 py-2 sm:mt-3 sm:px-4 sm:py-3 lg:mt-0 lg:px-6 lg:pb-0">
                  {children}
               </main>
            </div>
         </div>

         {isDrawerOpen ? (
            <>
               <button
                  type="button"
                  aria-label="Zamknij menu"
                  className="fixed inset-0 z-40 bg-overlay lg:hidden"
                  onClick={() => setIsDrawerOpen(false)}
               />
               <aside className="border-border-300 bg-background fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col border-l p-4 shadow-lg lg:hidden">
                  <div className="mb-4 flex items-center justify-between">
                     <p className="text-text-700 font-semibold">Menu</p>
                     <button
                        type="button"
                        aria-label="Zamknij"
                        onClick={() => setIsDrawerOpen(false)}
                        className="text-text-500 rounded-sm p-1"
                     >
                        <XMarkIcon className="h-5 w-5" />
                     </button>
                  </div>
                  <nav className="flex-1 space-y-0.5 overflow-y-auto">{renderNav(() => setIsDrawerOpen(false))}</nav>
                  {session ? (
                     <div className="border-border-300 mt-4 border-t pt-4">
                        <p className="text-text-700 text-sm font-medium">
                           {session.firstName} {session.lastName}
                        </p>
                        <p className="text-text-300 text-xs">{session.email}</p>
                        <p className="text-text-300 mt-0.5 text-xs">{roleLabel}</p>
                        <button
                           type="button"
                           onClick={handleLogout}
                           className="text-text-500 hover:text-text-700 mt-3 flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm"
                        >
                           <ArrowRightOnRectangleIcon className="h-4 w-4" />
                           Wyloguj
                        </button>
                     </div>
                  ) : null}
               </aside>
            </>
         ) : null}

         <nav
            className="border-border-300 bg-background fixed inset-x-0 bottom-0 z-50 grid border-t px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_var(--shadow-color-300)] lg:hidden"
            style={{ gridTemplateColumns: `repeat(${mainNav.length}, minmax(0, 1fr))` }}
            aria-label="Główna nawigacja"
         >
            {mainNav.map(item => {
               const active = isMainItemActive(item.href)
               const Icon = item.icon
               const navHref = resolveMainNavHref(item.href, role)
               return (
                  <Link
                     key={item.href}
                     href={navHref}
                     onClick={() => setIsDrawerOpen(false)}
                     className={`flex flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 py-1.5 text-[10px] leading-tight font-medium transition-colors ${
                        active ? "text-primary-500" : "text-text-500"
                     }`}
                  >
                     <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary-500" : ""}`} />
                     <span className="max-w-full truncate">{item.shortLabel}</span>
                  </Link>
               )
            })}
         </nav>
      </div>
   )
}

export default AppShell
