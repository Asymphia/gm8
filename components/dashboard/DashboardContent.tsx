"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import DayPlanSection from "@/components/dashboard/DayPlanSection"
import { useOperational } from "@/components/operations/OperationalProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { isApiEnabled } from "@/lib/api/config"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { mockDb, type OrderStatus } from "@/lib/mock-db"

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
   new: "Nowe",
   accepted: "Przyjęte",
   in_progress: "W realizacji",
   done: "Zrobione",
   cancelled: "Anulowane",
}

const LOW_QTY = 12

function daysUntilExpiry(isoDate: string): number {
   const today = new Date()
   today.setHours(12, 0, 0, 0)
   const [y, m, d] = isoDate.split("-").map(Number)
   const exp = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0)
   return Math.ceil((exp.getTime() - today.getTime()) / (86400 * 1000))
}

const DashboardContent = () => {
   const { isOwner } = useAuth()
   const ops = useOperational()
   const { catalog, ready: recipesReady } = useRecipeCatalog()
   const { products } = useProductCatalog()
   const useApi = isApiEnabled()

   const primaryLinks = useMemo(() => {
      void ops.recipeCatalogRevision
      const recipesActive = recipesReady
         ? catalog.recipes.filter(r => r.is_active).length
         : mockDb.recipes.filter(r => r.is_active).length
      const newOrders = ops.ready ? ops.orders.filter(o => o.status === "new").length : 0
      const totalOrders = ops.ready ? ops.orders.length : 0

      const stockLines = ops.ready ? ops.stock.length : 0
      const skuCount = new Set(ops.ready ? ops.stock.map(l => l.product_id) : []).size

      const links = [
         {
            href: "/warehouse",
            label: "Magazyn",
            description: "Produkty, stany partii · link do kolejek magazynowych.",
            value: ops.ready ? `${stockLines}` : "…",
            sub: ops.ready ? `${skuCount} SKU` : "",
         },
         ...(isOwner
            ? [
                 {
                    href: "/recipes",
                    label: "Przepisy",
                    description: "Księga receptur i składniki per porcja.",
                    value: String(recipesActive),
                    sub: "aktywne przepisy",
                 },
              ]
            : []),
         {
            href: "/orders",
            label: "Zamówienia",
            description: "Szkic → Przyjmij (FIFO) z karty dania.",
            value: ops.ready ? `${newOrders}` : "…",
            sub: ops.ready ? `/ ${totalOrders} łącznie` : "",
         },
         {
            href: isOwner ? "/schedule/plan" : "/schedule",
            label: "Harmonogram",
            description: isOwner
               ? "Kalendarz zmian per pracownik · edycja w przeglądarce."
               : "Twój grafik — dzień i tydzień.",
            value: isOwner ? "Kalendarz" : "Grafik",
            sub: isOwner ? "edycja zmian" : "tydzień / dzień",
         },
         {
            href: isOwner ? "/notifications" : "/notifications/board",
            label: "Ogłoszenia",
            description: isOwner ? "Komunikaty i tablica ogłoszeń." : "Opublikowane komunikaty zespołu.",
            value: useApi ? "—" : String(mockDb.announcements.filter(a => a.is_published).length),
            sub: "opublikowane",
         },
      ]
      return links
   }, [isOwner, ops.orders, ops.ready, ops.recipeCatalogRevision, ops.stock, recipesReady, catalog.recipes, useApi])

   const hubItems = primaryLinks.map(({ href, label, description, value, sub }) => ({
      href,
      label,
      description: sub ? `${description} (${sub})` : description,
      value,
   }))

   const recentOrders = useMemo(() => {
      void ops.recipeCatalogRevision
      if (!ops.ready) return []

      return [...ops.orders]
         .sort((a, b) => b.id - a.id)
         .slice(0, 5)
         .map(order => {
            const item = ops.order_items.find(i => i.order_id === order.id)
            const recipe = item ? catalog.recipes.find(r => r.id === item.recipe_id) : undefined
            return {
               id: order.id,
               ticket: `ORD-${order.id}`,
               recipe: recipe?.name ?? "—",
               statusLabel: ORDER_STATUS_LABEL[order.status] ?? order.status,
            }
         })
   }, [catalog.recipes, ops.order_items, ops.orders, ops.ready, ops.recipeCatalogRevision])

   const stockAlerts = useMemo(() => {
      if (!ops.ready) return { lowQty: [], expiringSoon: [] }

      const lines = [...ops.stock]
      const lowQty = lines
         .filter(l => l.quantity > 0 && l.quantity <= LOW_QTY)
         .sort((a, b) => a.quantity - b.quantity)
         .slice(0, 5)
         .map(l => ({
            stockId: l.id,
            name: products.find(p => p.id === l.product_id)?.name ?? `Produkt #${l.product_id}`,
            qty: l.quantity,
            expiry: l.expiry_date,
            daysLeft: daysUntilExpiry(l.expiry_date),
         }))

      const expiringSoon = lines
         .map(l => ({
            stockId: l.id,
            name: products.find(p => p.id === l.product_id)?.name ?? `Produkt #${l.product_id}`,
            qty: l.quantity,
            expiry: l.expiry_date,
            daysLeft: daysUntilExpiry(l.expiry_date),
         }))
         .filter(l => l.daysLeft >= 0 && l.daysLeft <= 14)
         .sort((a, b) => a.daysLeft - b.daysLeft)
         .slice(0, 5)

      return { lowQty, expiringSoon }
   }, [ops.ready, ops.stock, products])

   const greeting = useMemo(() => new Intl.DateTimeFormat("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
   }).format(new Date()), [])

   return (
      <div className="page-stack">
         <header className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
               <p className="text-text-500 text-sm capitalize">{greeting}</p>
               <h1 className="mt-1">Pulpit</h1>
               <p className="text-text-500 mt-1 max-w-2xl">
                  Skrót do modułów i bieżące sygnały z magazynu i zamówień (API).
               </p>
            </div>
            <Link
               href="/orders/register"
               className="border-border-300 hover:border-primary-500 text-primary-700 inline-flex w-full shrink-0 items-center justify-center rounded-sm border bg-background px-4 py-3 text-sm font-medium transition-colors sm:w-auto lg:mt-0"
            >
               + Nowe zamówienie (szkic)
            </Link>
         </header>

         <section>
            <h2 className="text-text-700 mb-3 text-sm font-semibold tracking-wide uppercase">Moduły</h2>
            <HubNavigationGrid items={hubItems} />
         </section>

         <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <DayPlanSection />
            <section className="rounded-md border border-border-300 bg-background p-4 shadow-sm">
               <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-text-700 text-lg font-semibold tracking-tight">Ostatnie zamówienia</h2>
                  <Link href="/orders/list" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                     Pełna lista →
                  </Link>
               </div>
               {!ops.ready ? (
                  <p className="text-text-500 text-sm">Ładowanie operacji…</p>
               ) : recentOrders.length === 0 ? (
                  <p className="text-text-500 text-sm">Brak zamówień.</p>
               ) : (
                  <ul className="divide-border-300 divide-y">
                     {recentOrders.map(row => (
                        <li key={row.ticket} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                           <span className="text-text-700 font-medium">{row.ticket}</span>
                           <span className="text-text-500 max-w-[12rem] min-w-0 truncate sm:max-w-none">{row.recipe}</span>
                           <span className="text-text-400 text-xs tabular-nums">{row.statusLabel}</span>
                        </li>
                     ))}
                  </ul>
               )}
            </section>

            <section className="rounded-md border border-border-300 bg-background p-4 shadow-sm">
               <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-text-700 text-lg font-semibold tracking-tight">Magazyn — sygnały</h2>
                  <Link href="/warehouse/stock" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                     Stany →
                  </Link>
               </div>
               {!ops.ready ? (
                  <p className="text-text-500 text-sm">Ładowanie stanów…</p>
               ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div>
                        <p className="text-text-400 mb-1 text-xs font-medium uppercase">Niski stan ({`≤ ${LOW_QTY}`})</p>
                        {stockAlerts.lowQty.length === 0 ? (
                           <p className="text-text-500 text-sm">Brak partii poniżej progu.</p>
                        ) : (
                           <ul className="space-y-2 text-sm">
                              {stockAlerts.lowQty.map(row => (
                                 <li key={row.stockId} className="text-text-500">
                                    <span className="text-text-700">{row.name}</span>
                                    <span className="text-text-400 mx-1">·</span>
                                    <span>{row.qty}</span>
                                    <span className="text-text-300 text-xs"> · ważna do {row.expiry}</span>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                     <div>
                        <p className="text-text-400 mb-1 text-xs font-medium uppercase">Kończy się ważność (≤ 14 dni)</p>
                        {stockAlerts.expiringSoon.length === 0 ? (
                           <p className="text-text-500 text-sm">Brak w tym oknie.</p>
                        ) : (
                           <ul className="space-y-2 text-sm">
                              {stockAlerts.expiringSoon.map(row => (
                                 <li key={`${row.stockId}-exp`} className="text-text-500">
                                    <span className="text-text-700">{row.name}</span>
                                    <span className="text-text-400 mx-1">·</span>
                                    <span>pozostało {row.daysLeft} d</span>
                                    <span className="text-text-300 text-xs"> ({row.expiry})</span>
                                 </li>
                              ))}
                           </ul>
                        )}
                     </div>
                  </div>
               )}
            </section>
         </div>
      </div>
   )
}

export default DashboardContent
