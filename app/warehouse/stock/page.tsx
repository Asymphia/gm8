"use client"

import BackLink from "@/components/ui/BackLink"
import { useOperational } from "@/components/operations/OperationalProvider"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"

const StockLevelsPage = () => {
   const { ready, stock } = useOperational()
   const { productById } = useProductCatalog()

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie stanów…</p>
   }

   const STOCK_ROWS = stock
      .map(row => {
         const product = productById(row.product_id)
         return {
            id: row.id,
            product: product?.name ?? `Produkt #${row.product_id}`,
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
         <BackLink href="/warehouse" label="Powrót do magazynu" />
         <div>
            <h1>Stany magazynowe</h1>
            <p className="text-text-500 mt-1">
               Bieżący widok operacyjny — ilości maleją po <span className="text-text-700">przyjęciu</span> zamówienia w module
               Zamówienia (FIFO wg daty ważności).
            </p>
         </div>

         <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Linie stanu</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{STOCK_ROWS.length}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Suma ilości</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{totalUnits.toFixed(2)}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Unikalne produkty</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">
                  {new Set(STOCK_ROWS.map(r => r.product)).size}
               </p>
            </article>
         </div>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[6rem_minmax(0,1fr)_6rem_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>ID</p>
               <p>Produkt</p>
               <p>J.m.</p>
               <p>Ilość</p>
               <p>Ważność</p>
               <p>Dostawca</p>
               <p>Status</p>
            </div>
            {STOCK_ROWS.map(row => (
               <div
                  key={row.id}
                  className="grid min-w-[52rem] grid-cols-[6rem_minmax(0,1fr)_6rem_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm last:border-b-0"
               >
                  <p className="text-text-500 tabular-nums">{row.id}</p>
                  <p className="text-text-700">{row.product}</p>
                  <p className="text-text-500">{row.unit}</p>
                  <p className="text-text-700 tabular-nums">{row.quantity}</p>
                  <p className="text-text-500">{row.expiryDate || "—"}</p>
                  <p className="text-text-500">{row.supplier}</p>
                  <p className={row.active ? "text-primary-500" : "text-text-300"}>
                     {row.active ? "Aktywny" : "Nieaktywny"}
                  </p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default StockLevelsPage
