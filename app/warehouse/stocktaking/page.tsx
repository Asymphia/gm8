"use client"

import { useEffect, useMemo, useState } from "react"
import { mockDb } from "@/lib/mock-db"
import Link from "next/link"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import {
   INVENTORY_OPERATIONS_STORAGE_KEY,
   type InventoryOperation,
   readInventoryOperations,
} from "@/lib/inventory-operations"

const INITIAL_STOCKTAKING_ROWS = mockDb.inventory_items.map(item => {
   const stock = mockDb.stock.find(stockRow => stockRow.id === item.stock_id)
   const product = mockDb.product_catalog.find(productRow => productRow.id === stock?.product_id)
   const unit = product?.unit ?? "pcs"

   return {
      stockId: item.stock_id,
      product: product?.name ?? "Unknown product",
      unit,
      systemQuantity: item.system_quantity,
      realQuantity: item.real_quantity,
   }
})

const StocktakingPage = () => {
   const [rows, setRows] = useState(INITIAL_STOCKTAKING_ROWS)
   const [operations, setOperations] = useState<InventoryOperation[]>(readInventoryOperations)

   const rowsWithStatus = useMemo(
      () =>
         rows.map(row => {
            const delta = Number((row.realQuantity - row.systemQuantity).toFixed(2))
            return {
               ...row,
               delta,
               deltaLabel: `${delta > 0 ? "+" : ""}${delta} ${row.unit}`,
               action: delta === 0 ? "No action" : "Correction needed",
            }
         }),
      [rows]
   )

   const pendingCorrections = rowsWithStatus.filter(row => row.delta !== 0).length

   useEffect(() => {
      if (typeof window === "undefined") return
      window.localStorage.setItem(INVENTORY_OPERATIONS_STORAGE_KEY, JSON.stringify(operations))
   }, [operations])

   const updateRealQuantity = (stockId: number, value: string) => {
      const parsed = Number(value)
      setRows(previous =>
         previous.map(row => (row.stockId === stockId ? { ...row, realQuantity: Number.isNaN(parsed) ? 0 : parsed } : row))
      )
   }

   const applyCorrections = () => {
      const changedRows = rowsWithStatus.filter(row => row.delta !== 0)
      if (changedRows.length === 0) return

      const summary = changedRows
         .slice(0, 3)
         .map(row => `${row.product} (${row.deltaLabel})`)
         .join(", ")

      const details = changedRows.map(row => ({
         product: row.product,
         unit: row.unit,
         systemBefore: row.systemQuantity,
         realCounted: row.realQuantity,
         systemAfter: row.realQuantity,
         delta: row.delta,
      }))

      const operation: InventoryOperation = {
         id: `inv-${Date.now()}`,
         createdAt: new Date().toISOString(),
         changedItems: changedRows.length,
         summary: changedRows.length > 3 ? `${summary}...` : summary,
         details,
      }

      setRows(previous => previous.map(row => ({ ...row, systemQuantity: row.realQuantity })))
      setOperations(previous => [operation, ...previous])
   }

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Back to warehouse" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Stocktaking</h1>
               <p className="text-text-500 mt-1">Compare system levels with physical count and apply corrections.</p>
            </div>
            <Button type="button" variant="outline" onClick={applyCorrections} disabled={pendingCorrections === 0}>
               Apply corrections
            </Button>
         </div>
         <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Items in stocktaking</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{rowsWithStatus.length}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Pending corrections</p>
               <p className="text-warning mt-1 text-xl font-semibold">{pendingCorrections}</p>
            </article>
         </div>
         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_12rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Product</p>
               <p>System qty</p>
               <p>Real qty</p>
               <p>Difference</p>
               <p>Action</p>
            </div>
            {rowsWithStatus.map(row => (
               <div
                  key={row.stockId}
                  className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_12rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p className="text-text-700 font-medium">{row.product}</p>
                  <p>
                     {row.systemQuantity} {row.unit}
                  </p>
                  <div>
                     <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.realQuantity}
                        onChange={event => updateRealQuantity(row.stockId, event.target.value)}
                        className="border-border-300 w-full rounded-sm border px-2 py-1 text-sm outline-none"
                     />
                  </div>
                  <p className={row.delta === 0 ? "text-text-500" : "text-warning font-medium"}>{row.deltaLabel}</p>
                  <p>{row.action}</p>
               </div>
            ))}
         </div>

         <section className="space-y-3 rounded-sm border border-border-300 bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <h2 className="text-text-700 text-lg font-medium">Recent inventory operations</h2>
               <div className="flex flex-wrap items-center gap-2">
                  <span className="text-text-300 text-xs">{operations.length} saved</span>
                  <Link
                     href="/warehouse/stocktaking/inventories"
                     className="text-primary-500 hover:text-primary-700 text-sm font-medium"
                  >
                     Open full list →
                  </Link>
               </div>
            </div>
            {operations.length === 0 ? (
               <p className="text-text-500 text-sm">
                  No saved corrections yet. Apply corrections to create first inventory operation.
               </p>
            ) : (
               <div className="space-y-2">
                  {operations.slice(0, 5).map(operation => (
                     <Link
                        key={operation.id}
                        href={`/warehouse/stocktaking/inventories/${operation.id}`}
                        className="flex flex-col gap-1 rounded-sm border border-border-300 px-3 py-2 transition-colors hover:border-primary-300 hover:bg-foreground sm:flex-row sm:items-center sm:justify-between"
                     >
                        <div>
                           <p className="text-text-700 text-sm font-medium">{new Date(operation.createdAt).toLocaleString()}</p>
                           <p className="text-text-500 text-xs">{operation.summary}</p>
                        </div>
                        <p className="text-primary-500 text-xs font-medium">{operation.changedItems} items · Open</p>
                     </Link>
                  ))}
               </div>
            )}
         </section>
      </div>
   )
}

export default StocktakingPage
