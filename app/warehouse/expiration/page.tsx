"use client"

import BackLink from "@/components/ui/BackLink"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useOperational } from "@/components/operations/OperationalProvider"

const DAY_MS = 86_400_000

function todayIsoLocal(): string {
   const d = new Date()
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${y}-${m}-${day}`
}

const ExpirationPage = () => {
   const today = todayIsoLocal()
   const { ready, stock } = useOperational()
   const { productById } = useProductCatalog()

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie stanów…</p>
   }

   const expirationRows = stock
      .map(stockRow => {
         const product = productById(stockRow.product_id)
         const daysLeft =
            (new Date(`${stockRow.expiry_date}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / DAY_MS
         return {
            key: stockRow.id,
            product: product?.name ?? `Produkt #${stockRow.product_id}`,
            expiresAt: stockRow.expiry_date,
            stock: `${stockRow.quantity} ${product?.unit ?? "pcs"}`,
            supplier: stockRow.supplier_name,
            daysLeft,
         }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Powrót do magazynu" />
         <div>
            <h1>Kontrola ważności</h1>
            <p className="text-text-500 mt-1">Kolejka wg terminu ważności — ten sam stan operacyjny co przy zużyciu z zamówień.</p>
         </div>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[44rem] grid-cols-[minmax(0,1fr)_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Produkt</p>
               <p className="text-right">Dni do końca</p>
               <p>Ważne do</p>
               <p>Stan</p>
               <p>Dostawca</p>
            </div>
            {expirationRows.map(row => (
               <div
                  key={row.key}
                  className="grid min-w-[44rem] grid-cols-[minmax(0,1fr)_8rem_10rem_minmax(0,1fr)_8rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p className="text-text-700 font-medium">{row.product}</p>
                  <p className="text-right tabular-nums">{Math.round(row.daysLeft)}</p>
                  <p>{row.expiresAt}</p>
                  <p>{row.stock}</p>
                  <p className="min-w-0 truncate" title={row.supplier}>
                     {row.supplier}
                  </p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default ExpirationPage
