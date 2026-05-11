"use client"

import BackLink from "@/components/ui/BackLink"
import { useOperational } from "@/components/operations/OperationalProvider"
import { mockDb } from "@/lib/mock-db"

const StockLevelsPage = () => {
   const { ready, stock } = useOperational()

   if (!ready) {
      return <p className="text-text-500 text-sm">Loading stock…</p>
   }

   const STOCK_ROWS = stock
      .map(row => {
         const product = mockDb.product_catalog.find(p => p.id === row.product_id)
         return {
            id: row.id,
            product: product?.name ?? `Product #${row.product_id}`,
            unit: product?.unit ?? "pcs",
            quantity: row.quantity,
            expiryDate: row.expiry_date,
            supplier: row.supplier_name,
            active: product?.is_active ?? true,
         }
      })
      .sort((a, b) => a.product.localeCompare(b.product))

   const totalUnits = STOCK_ROWS.reduce((sum, r) => sum + r.quantity, 0)

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Back to warehouse" />
         <div>
            <h1>Stock levels</h1>
            <p className="text-text-500 mt-1">
               Live view of the operational mock — quantities drop when orders are <span className="text-text-700">accepted</span>{" "}
               from Orders (FIFO by expiry).
            </p>
         </div>

         <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Stock lines</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{STOCK_ROWS.length}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Total quantity (sum)</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{totalUnits.toFixed(2)}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Unique products</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">
                  {new Set(STOCK_ROWS.map(r => r.product)).size}
               </p>
            </article>
         </div>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[6rem_minmax(0,1fr)_6rem_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Stock ID</p>
               <p>Product</p>
               <p>Unit</p>
               <p className="text-right">Quantity</p>
               <p>Expiry</p>
               <p>Supplier</p>
               <p className="text-center">Catalog</p>
            </div>
            {STOCK_ROWS.map(row => (
               <div
                  key={row.id}
                  className="grid min-w-[52rem] grid-cols-[6rem_minmax(0,1fr)_6rem_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p className="font-mono text-xs">{row.id}</p>
                  <p className="text-text-700 font-medium">{row.product}</p>
                  <p>{row.unit}</p>
                  <p className="text-right tabular-nums">
                     {row.quantity} {row.unit}
                  </p>
                  <p>{row.expiryDate}</p>
                  <p className="min-w-0 truncate" title={row.supplier}>
                     {row.supplier}
                  </p>
                  <p className="text-center">{row.active ? "Active" : "Inactive"}</p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default StockLevelsPage
