"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useOperational } from "@/components/operations/OperationalProvider"
import { isApiEnabled } from "@/lib/api/config"
import { fetchInventoryById, inventoryDtoToOperation } from "@/lib/api/inventory-api"
import type { InventoryOperation } from "@/lib/inventory-operations"
import { INVENTORY_OPERATIONS_STORAGE_KEY, readInventoryOperations } from "@/lib/inventory-operations"

const InventoryDetailPage = () => {
   const useApi = isApiEnabled()
   const params = useParams()
   const id = typeof params?.id === "string" ? params.id : ""
   const { stock } = useOperational()
   const { products } = useProductCatalog()
   const [operation, setOperation] = useState<InventoryOperation | null | undefined>(undefined)

   useEffect(() => {
      if (!id) {
         setOperation(null)
         return
      }

      if (useApi) {
         void (async () => {
            const numericId = id.startsWith("inv-") ? Number.parseInt(id.slice(4), 10) : Number.parseInt(id, 10)
            if (!Number.isFinite(numericId)) {
               setOperation(null)
               return
            }
            try {
               const dto = await fetchInventoryById(numericId)
               setOperation(inventoryDtoToOperation(dto, stock, products))
            } catch {
               setOperation(null)
            }
         })()
         return
      }

      const load = () => {
         const found = readInventoryOperations().find(op => op.id === id)
         setOperation(found ?? null)
      }
      queueMicrotask(load)

      const onStorage = (e: StorageEvent) => {
         if (e.key === INVENTORY_OPERATIONS_STORAGE_KEY || e.key === null) {
            queueMicrotask(load)
         }
      }
      window.addEventListener("storage", onStorage)
      return () => window.removeEventListener("storage", onStorage)
   }, [id, useApi, stock, products])

   if (operation === undefined) {
      return (
         <div className="space-y-4">
            <BackLink href="/warehouse/stocktaking/inventories" label="Powrót do listy inwentaryzacji" />
            <p className="text-text-500 text-sm">Ładowanie…</p>
         </div>
      )
   }

   if (operation === null) {
      return (
         <div className="space-y-4">
            <BackLink href="/warehouse/stocktaking/inventories" label="Powrót do listy inwentaryzacji" />
            <div className="rounded-sm border border-border-300 bg-background p-6">
               <p className="text-text-700 font-medium">Nie znaleziono inwentaryzacji</p>
               <p className="text-text-500 mt-1 text-sm">Ta operacja mogła zostać usunięta lub link jest nieprawidłowy.</p>
            </div>
         </div>
      )
   }

   const details = operation.details ?? []

   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <BackLink href="/warehouse/stocktaking/inventories" label="Powrót do listy inwentaryzacji" />
            <Link
               href="/warehouse/stocktaking"
               className="text-primary-500 hover:text-primary-700 text-sm font-medium sm:pt-1"
            >
               Kontynuuj inwentaryzację →
            </Link>
         </div>

         <div className="rounded-sm border border-border-300 bg-background p-4">
            <h1 className="text-text-700 text-xl font-medium">Operacja inwentaryzacji</h1>
            <dl className="text-text-500 mt-3 grid gap-2 text-sm sm:grid-cols-2">
               <div>
                  <dt className="text-text-300">Zapisano</dt>
                  <dd className="text-text-700 font-medium">{new Date(operation.createdAt).toLocaleString()}</dd>
               </div>
               <div>
                  <dt className="text-text-300">Skorygowane pozycje</dt>
                  <dd className="text-text-700 font-medium">{operation.changedItems}</dd>
               </div>
               <div className="sm:col-span-2">
                  <dt className="text-text-300">Podsumowanie</dt>
                  <dd>{operation.summary}</dd>
               </div>
               <div className="sm:col-span-2">
                  <dt className="text-text-300">ID operacji</dt>
                  <dd className="font-mono text-xs">{operation.id}</dd>
               </div>
            </dl>
         </div>

         {details.length === 0 ? (
            <p className="text-text-500 rounded-sm border border-border-300 bg-background p-4 text-sm">
               Ten rekord zapisano przed wprowadzeniem szczegółów pozycji. Dostępne jest tylko podsumowanie.
            </p>
         ) : (
            <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
               <div className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_6rem_8rem_8rem_8rem_9rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
                  <p>Produkt</p>
                  <p>J.m.</p>
                  <p>Stan przed</p>
                  <p>Policzono (rzecz.)</p>
                  <p>Stan po</p>
                  <p>Różnica</p>
               </div>
               {details.map((line, index) => (
                  <div
                     key={`${line.product}-${index}`}
                     className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_6rem_8rem_8rem_8rem_9rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
                  >
                     <p className="text-text-700 font-medium">{line.product}</p>
                     <p>{line.unit}</p>
                     <p>
                        {line.systemBefore} {line.unit}
                     </p>
                     <p>
                        {line.realCounted} {line.unit}
                     </p>
                     <p>
                        {line.systemAfter} {line.unit}
                     </p>
                     <p className={line.delta === 0 ? "" : "text-warning font-medium"}>
                        {line.delta > 0 ? "+" : ""}
                        {line.delta} {line.unit}
                     </p>
                  </div>
               ))}
            </div>
         )}
      </div>
   )
}

export default InventoryDetailPage
