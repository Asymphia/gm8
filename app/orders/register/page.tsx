"use client"

import { useMemo, useState } from "react"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { useOperational } from "@/components/operations/OperationalProvider"
import { buildDemandsFromRecipe } from "@/lib/operational-mock-storage"
import { mergeStockDemands } from "@/lib/stock-fifo-consume"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { ApiError } from "@/lib/api/client"
import type { OrderStatus } from "@/lib/mock-db"

const STATUS_LABELS: Record<OrderStatus, string> = {
   new: "Nowe",
   accepted: "Przyjęte",
   in_progress: "W realizacji",
   done: "Zrobione",
   cancelled: "Anulowane",
}

const OrderRegistrationPage = () => {
   const { productById } = useProductCatalog()
   const { catalog } = useRecipeCatalog()

   function formatStockImpact(recipeId: number, portions: number): string {
      const demands = mergeStockDemands(buildDemandsFromRecipe(catalog, recipeId, portions))
      if (demands.length === 0) return "Brak składników w księdze dla tego przepisu."

      return demands
         .map(d => {
            const product = productById(d.product_id)
            const unit = product?.unit ?? ""
            return `${product?.name ?? `Produkt #${d.product_id}`} −${d.quantity} ${unit}`.trim()
         })
         .join(" · ")
   }

   const {
      ready,
      loadError,
      orders,
      order_items,
      activeRecipesPicklist,
      registerOrder,
      acceptOrder,
      recipeCatalogRevision,
   } = useOperational()

   const [recipeSelection, setRecipeSelection] = useState<string>("")
   const [portionsField, setPortionsField] = useState("2")
   const [feedback, setFeedback] = useState<string | null>(null)

   const rows = useMemo(() => {
      void recipeCatalogRevision

      return [...orders].sort((a, b) => b.id - a.id).map(order => {
         const item = order_items.find(i => i.order_id === order.id)
         const recipe = item ? catalog.recipes.find(r => r.id === item.recipe_id) : undefined
         const stockImpact =
            item !== undefined ? formatStockImpact(item.recipe_id, item.portions) : "—"

         return {
            ticket: `ORD-${order.id}`,
            recipe: recipe?.name ?? "Nieznany przepis",
            stockImpact,
            status: order.status,
            statusLabel: STATUS_LABELS[order.status] ?? order.status,
            orderId: order.id,
         }
      })
   }, [catalog.recipes, orders, order_items, recipeCatalogRevision])

   const handleCreateDraft = async () => {
      setFeedback(null)
      const recipeId = Number.parseInt(recipeSelection, 10)
      const portions = Number.parseInt(portionsField, 10)
      if (!Number.isFinite(recipeId) || recipeId < 1) {
         setFeedback("Wybierz przepis z listy.")
         return
      }
      if (!Number.isFinite(portions) || portions < 1) {
         setFeedback("Podaj co najmniej 1 porcję.")
         return
      }
      try {
         const id = await registerOrder(recipeId, portions)
         if (id === null) {
            setFeedback(
               "Nie udało się utworzyć szkicu — przepis nieaktywny, brak w księdze lub brak linii składników."
            )
            return
         }
         setFeedback(
            `Utworzono ORD-${id} (nowe). Użyj Przyjmij, aby odjąć stan magazynowy metodą FIFO wg ważności.`
         )
      } catch (err) {
         setFeedback(err instanceof ApiError ? err.message : "Nie udało się utworzyć zamówienia.")
      }
   }

   const handleAccept = async (orderId: number) => {
      setFeedback(null)
      const res = await acceptOrder(orderId)
      if (!res.ok) {
         const shortage =
            res.shortage
               ?.map(s => {
                  const n = productById(s.product_id)?.name
                  return `${n ?? `#${s.product_id}`}: brakuje ${s.missing}`
               })
               .join("; ") ?? ""
         setFeedback(shortage ? `${res.error} (${shortage})` : res.error)
         return
      }
      setFeedback(`ORD-${orderId} przyjęte — zaktualizowano stan magazynu.`)
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie operacji…</p>
   }

   return (
      <div className="space-y-6">
         {loadError ? (
            <p className="text-warning rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm">{loadError}</p>
         ) : null}
         <BackLink href="/orders" label="Powrót do zamówień" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Rejestracja zamówień</h1>
               <p className="text-text-500 mt-1 max-w-2xl">
                  Wybierz danie i liczbę porcji. Szkic nie zmienia stanu; <span className="text-text-700">Przyjmij</span>{" "}
                  korzysta z księgi przepisów (składniki × porcje) i odejmuje partie magazynowe metodą FIFO (API).
               </p>
            </div>
         </div>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <p className="text-text-700 text-sm font-medium">Nowy szkic zamówienia</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
               <label className="flex flex-col gap-1">
                  <span className="text-text-500 text-xs">Przepis</span>
                  <select
                     value={recipeSelection}
                     onChange={event => setRecipeSelection(event.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 min-w-[12rem] rounded-sm border px-3 py-2 text-sm outline-none"
                  >
                     <option value="">Wybierz…</option>
                     {activeRecipesPicklist.map(r => (
                        <option key={r.id} value={String(r.id)}>
                           {r.name} · {r.ingredientLines} produktów
                        </option>
                     ))}
                  </select>
               </label>
               <label className="flex flex-col gap-1">
                  <span className="text-text-500 text-xs">Porcje</span>
                  <input
                     type="number"
                     min={1}
                     step={1}
                     value={portionsField}
                     onChange={event => setPortionsField(event.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-24 rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <Button type="button" size="sm" onClick={handleCreateDraft}>
                  Utwórz szkic
               </Button>
            </div>
            {feedback ? (
               <p className="text-text-500 border-border-300 mt-3 rounded-sm border border-dashed px-3 py-2 text-sm">
                  {feedback}
               </p>
            ) : null}
         </section>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_10rem_7rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Zamówienie</p>
               <p>Przepis</p>
               <p>Wpływ na magazyn (księga × porcje)</p>
               <p>Status</p>
               <p className="text-right">Akcja</p>
            </div>
            {rows.map(row => (
               <div
                  key={row.ticket}
                  className="grid min-w-[52rem] grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_10rem_7rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p className="font-mono text-xs">{row.ticket}</p>
                  <p className="text-text-700">{row.recipe}</p>
                  <p className="min-w-0 break-words">{row.stockImpact}</p>
                  <p>{row.statusLabel}</p>
                  <p className="text-right">
                     {row.status === "new" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => handleAccept(row.orderId)}>
                           Przyjmij
                        </Button>
                     ) : (
                        <span className="text-text-300 text-xs">—</span>
                     )}
                  </p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default OrderRegistrationPage
