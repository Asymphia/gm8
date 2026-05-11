"use client"

import { useMemo, useState } from "react"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { useOperational } from "@/components/operations/OperationalProvider"
import { readRecipeCatalogForOps, buildDemandsFromRecipe } from "@/lib/operational-mock-storage"
import { mergeStockDemands } from "@/lib/stock-fifo-consume"
import { mockDb } from "@/lib/mock-db"

function formatStockImpact(recipeId: number, portions: number): string {
   const catalog = readRecipeCatalogForOps()
   const demands = mergeStockDemands(buildDemandsFromRecipe(catalog, recipeId, portions))
   if (demands.length === 0) return "No ingredients in cookbook for this recipe."

   return demands
      .map(d => {
         const product = mockDb.product_catalog.find(p => p.id === d.product_id)
         const unit = product?.unit ?? ""
         return `${product?.name ?? `Product #${d.product_id}`} −${d.quantity} ${unit}`.trim()
      })
      .join(" · ")
}

const OrderRegistrationPage = () => {
   const {
      ready,
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
         const catalog = readRecipeCatalogForOps()
         const recipe = item ? catalog.recipes.find(r => r.id === item.recipe_id) : undefined
         const stockImpact =
            item !== undefined ? formatStockImpact(item.recipe_id, item.portions) : "—"

         return {
            ticket: `ORD-${order.id}`,
            recipe: recipe?.name ?? "Unknown recipe",
            stockImpact,
            state: order.status,
            orderId: order.id,
         }
      })
   }, [orders, order_items, recipeCatalogRevision])

   const handleCreateDraft = () => {
      setFeedback(null)
      const recipeId = Number.parseInt(recipeSelection, 10)
      const portions = Number.parseInt(portionsField, 10)
      if (!Number.isFinite(recipeId) || recipeId < 1) {
         setFeedback("Choose a recipe from the list.")
         return
      }
      if (!Number.isFinite(portions) || portions < 1) {
         setFeedback("Enter at least 1 portion.")
         return
      }
      const id = registerOrder(recipeId, portions)
      if (id === null) {
         setFeedback("Could not create draft — recipe inactive, missing from cookbook, or has no ingredient lines.")
         return
      }
      setFeedback(`Created ORD-${id} (new). Use Accept to deduct stock FIFO by expiry.`)
   }

   const handleAccept = (orderId: number) => {
      setFeedback(null)
      const res = acceptOrder(orderId)
      if (!res.ok) {
         const shortage =
            res.shortage
               ?.map(s => {
                  const n = mockDb.product_catalog.find(p => p.id === s.product_id)?.name
                  return `${n ?? `#${s.product_id}`} short by ${s.missing}`
               })
               .join("; ") ?? ""
         setFeedback(shortage ? `${res.error} (${shortage})` : res.error)
         return
      }
      setFeedback(`ORD-${orderId} accepted — warehouse stock updated.`)
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Loading operations…</p>
   }

   return (
      <div className="space-y-6">
         <BackLink href="/orders" label="Back to orders" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Register orders</h1>
               <p className="text-text-500 mt-1 max-w-2xl">
                  Pick a dish and portions. Draft does not change stock; <span className="text-text-700">Accept</span> uses
                  the cookbook (ingredients × portions) and subtracts warehouse lines FIFO. Saved in browser localStorage.
               </p>
            </div>
         </div>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <p className="text-text-700 text-sm font-medium">New order draft</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
               <label className="flex flex-col gap-1">
                  <span className="text-text-500 text-xs">Recipe</span>
                  <select
                     value={recipeSelection}
                     onChange={event => setRecipeSelection(event.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 min-w-[12rem] rounded-sm border px-3 py-2 text-sm outline-none"
                  >
                     <option value="">Select…</option>
                     {activeRecipesPicklist.map(r => (
                        <option key={r.id} value={String(r.id)}>
                           {r.name} · {r.ingredientLines} products
                        </option>
                     ))}
                  </select>
               </label>
               <label className="flex flex-col gap-1">
                  <span className="text-text-500 text-xs">Portions</span>
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
                  Create draft
               </Button>
            </div>
            {feedback ? (
               <p className="text-text-500 border-border-300 mt-3 rounded-sm border border-dashed px-3 py-2 text-sm">{feedback}</p>
            ) : null}
         </section>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_10rem_7rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Order</p>
               <p>Recipe</p>
               <p>Stock impact (cookbook × portions)</p>
               <p>Status</p>
               <p className="text-right">Action</p>
            </div>
            {rows.map(row => (
               <div
                  key={row.ticket}
                  className="grid min-w-[52rem] grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.2fr)_10rem_7rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p className="font-mono text-xs">{row.ticket}</p>
                  <p className="text-text-700">{row.recipe}</p>
                  <p className="min-w-0 break-words">{row.stockImpact}</p>
                  <p>{row.state}</p>
                  <p className="text-right">
                     {row.state === "new" ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => handleAccept(row.orderId)}>
                           Accept
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
