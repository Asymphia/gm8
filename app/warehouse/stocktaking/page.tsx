"use client"

import { useEffect, useMemo, useState } from "react"
import { isApiEnabled } from "@/lib/api/config"
import {
   buildStocktakingRows,
   fetchInventories,
   inventoryDtoToOperation,
   runStocktakingCorrection,
} from "@/lib/api/inventory-api"
import { fetchOperationalSnapshot } from "@/lib/api/orders-api"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useOperational } from "@/components/operations/OperationalProvider"
import { ApiError } from "@/lib/api/client"
import Link from "next/link"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import {
   INVENTORY_OPERATIONS_STORAGE_KEY,
   type InventoryOperation,
   readInventoryOperations,
} from "@/lib/inventory-operations"

type StocktakingRow = {
   stockId: number
   product: string
   unit: string
   systemQuantity: number
   realQuantity: number
}

const StocktakingPage = () => {
   const useApi = isApiEnabled()
   const { isOwner } = useAuth()
   const { ready: opsReady, stock, refresh: refreshOps } = useOperational()
   const { products } = useProductCatalog()
   const [rows, setRows] = useState<StocktakingRow[]>([])
   const [operations, setOperations] = useState<InventoryOperation[]>([])
   const [pending, setPending] = useState(false)
   const [feedback, setFeedback] = useState<string | null>(null)

   useEffect(() => {
      if (!opsReady) return
      setRows(buildStocktakingRows(stock, products))
   }, [opsReady, stock, products])

   useEffect(() => {
      void (async () => {
         if (useApi) {
            try {
               const list = await fetchInventories()
               const completed = list
                  .filter(i => i.completedAt)
                  .map(dto => inventoryDtoToOperation(dto, stock, products))
               setOperations(completed)
            } catch {
               setOperations([])
            }
         } else {
            setOperations(readInventoryOperations())
         }
      })()
   }, [useApi, stock, products])

   useEffect(() => {
      if (useApi || typeof window === "undefined") return
      window.localStorage.setItem(INVENTORY_OPERATIONS_STORAGE_KEY, JSON.stringify(operations))
   }, [operations, useApi])

   const rowsWithStatus = useMemo(
      () =>
         rows.map(row => {
            const delta = Number((row.realQuantity - row.systemQuantity).toFixed(2))
            return {
               ...row,
               delta,
               deltaLabel: `${delta > 0 ? "+" : ""}${delta} ${row.unit}`,
               action: delta === 0 ? "Bez zmian" : "Wymaga korekty",
            }
         }),
      [rows]
   )

   const pendingCorrections = rowsWithStatus.filter(row => row.delta !== 0).length

   const updateRealQuantity = (stockId: number, value: string) => {
      const parsed = Number(value)
      setRows(previous =>
         previous.map(row =>
            row.stockId === stockId ? { ...row, realQuantity: Number.isNaN(parsed) ? 0 : parsed } : row
         )
      )
   }

   const applyCorrections = async () => {
      const changedRows = rowsWithStatus.filter(row => row.delta !== 0)
      if (changedRows.length === 0) return

      setPending(true)
      try {
         if (useApi) {
            const { operation } = await runStocktakingCorrection(
               stock,
               products,
               changedRows.map(r => ({
                  stockId: r.stockId,
                  systemQuantity: r.systemQuantity,
                  realQuantity: r.realQuantity,
               }))
            )
            await refreshOps()
            const snapshot = await fetchOperationalSnapshot()
            setRows(buildStocktakingRows(snapshot.stock, products))
            setOperations(prev => [operation, ...prev])
         } else {
            const summary = changedRows
               .slice(0, 3)
               .map(row => `${row.product} (${row.deltaLabel})`)
               .join(", ")

            const operation: InventoryOperation = {
               id: `inv-${Date.now()}`,
               createdAt: new Date().toISOString(),
               changedItems: changedRows.length,
               summary: changedRows.length > 3 ? `${summary}...` : summary,
               details: changedRows.map(row => ({
                  product: row.product,
                  unit: row.unit,
                  systemBefore: row.systemQuantity,
                  realCounted: row.realQuantity,
                  systemAfter: row.realQuantity,
                  delta: row.delta,
               })),
            }

            setRows(previous => previous.map(row => ({ ...row, systemQuantity: row.realQuantity })))
            setOperations(previous => [operation, ...previous])
         }
         setFeedback("Korekty zapisane.")
      } catch (err) {
         setFeedback(err instanceof ApiError ? err.message : "Nie udało się zapisać korekt.")
      } finally {
         setPending(false)
      }
   }

   if (!opsReady) {
      return <p className="text-text-500 text-sm">Ładowanie stanów…</p>
   }

   if (useApi && !isOwner) {
      return (
         <div className="space-y-4">
            <BackLink href="/warehouse" label="Powrót do magazynu" />
            <p className="text-text-500 rounded-sm border border-border-300 bg-background p-6 text-sm">
               Inwentaryzacja jest dostępna tylko dla właściciela (konto Admin). Jako pracownik możesz przeglądać stany
               magazynowe i dostawy.
            </p>
         </div>
      )
   }

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Powrót do magazynu" />
         {feedback ? <p className="text-primary-500 text-sm">{feedback}</p> : null}
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Inwentaryzacja</h1>
               <p className="text-text-500 mt-1">Porównaj stan systemu z liczeniem i zastosuj korekty.</p>
            </div>
            <Button
               type="button"
               variant="outline"
               onClick={() => void applyCorrections()}
               disabled={pendingCorrections === 0 || pending}
            >
               {pending ? "Zapisywanie…" : "Zastosuj korekty"}
            </Button>
         </div>
         <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Pozycje w inwentaryzacji</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{rowsWithStatus.length}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Oczekujące korekty</p>
               <p className="text-warning mt-1 text-xl font-semibold">{pendingCorrections}</p>
            </article>
         </div>
         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_12rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Produkt</p>
               <p>Stan systemu</p>
               <p>Stan rzeczywisty</p>
               <p>Różnica</p>
               <p>Akcja</p>
            </div>
            {rowsWithStatus.map(row => (
               <div
                  key={row.stockId}
                  className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_12rem] items-center border-b border-border-300 px-4 py-3 text-sm last:border-b-0"
               >
                  <p className="text-text-700">{row.product}</p>
                  <p className="text-text-500 tabular-nums">
                     {row.systemQuantity} {row.unit}
                  </p>
                  <input
                     type="number"
                     step="0.01"
                     value={row.realQuantity}
                     onChange={e => updateRealQuantity(row.stockId, e.target.value)}
                     className="border-border-300 max-w-[8rem] rounded-sm border px-2 py-1 text-sm outline-none"
                  />
                  <p className={row.delta !== 0 ? "text-warning tabular-nums" : "text-text-500 tabular-nums"}>
                     {row.deltaLabel}
                  </p>
                  <p className="text-text-500">{row.action}</p>
               </div>
            ))}
         </div>
         <div className="flex justify-end">
            <Link href="/warehouse/stocktaking/inventories" className="text-primary-500 text-sm hover:underline">
               Historia inwentaryzacji →
            </Link>
         </div>
      </div>
   )
}

export default StocktakingPage
