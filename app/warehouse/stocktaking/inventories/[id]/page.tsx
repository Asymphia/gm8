"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import type { InventoryOperation } from "@/lib/inventory-operations"
import { INVENTORY_OPERATIONS_STORAGE_KEY, readInventoryOperations } from "@/lib/inventory-operations"

const InventoryDetailPage = () => {
   const params = useParams()
   const id = typeof params?.id === "string" ? params.id : ""
   const [operation, setOperation] = useState<InventoryOperation | null | undefined>(undefined)

   useEffect(() => {
      const load = () => {
         if (!id) {
            setOperation(null)
            return
         }
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
   }, [id])

   if (operation === undefined) {
      return (
         <div className="space-y-4">
            <BackLink href="/warehouse/stocktaking/inventories" label="Back to inventory list" />
            <p className="text-text-500 text-sm">Loading…</p>
         </div>
      )
   }

   if (operation === null) {
      return (
         <div className="space-y-4">
            <BackLink href="/warehouse/stocktaking/inventories" label="Back to inventory list" />
            <div className="rounded-sm border border-border-300 bg-background p-6">
               <p className="text-text-700 font-medium">Inventory not found</p>
               <p className="text-text-500 mt-1 text-sm">This operation may have been removed or the link is invalid.</p>
            </div>
         </div>
      )
   }

   const details = operation.details ?? []

   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <BackLink href="/warehouse/stocktaking/inventories" label="Back to inventory list" />
            <Link
               href="/warehouse/stocktaking"
               className="text-primary-500 hover:text-primary-700 text-sm font-medium sm:pt-1"
            >
               Continue stocktaking →
            </Link>
         </div>

         <div className="rounded-sm border border-border-300 bg-background p-4">
            <h1 className="text-text-700 text-xl font-medium">Inventory operation</h1>
            <dl className="text-text-500 mt-3 grid gap-2 text-sm sm:grid-cols-2">
               <div>
                  <dt className="text-text-300">Recorded at</dt>
                  <dd className="text-text-700 font-medium">{new Date(operation.createdAt).toLocaleString()}</dd>
               </div>
               <div>
                  <dt className="text-text-300">Corrected lines</dt>
                  <dd className="text-text-700 font-medium">{operation.changedItems}</dd>
               </div>
               <div className="sm:col-span-2">
                  <dt className="text-text-300">Summary</dt>
                  <dd>{operation.summary}</dd>
               </div>
               <div className="sm:col-span-2">
                  <dt className="text-text-300">Operation id</dt>
                  <dd className="font-mono text-xs">{operation.id}</dd>
               </div>
            </dl>
         </div>

         {details.length === 0 ? (
            <p className="text-text-500 rounded-sm border border-border-300 bg-background p-4 text-sm">
               This record was saved before line-level details were stored. Summary only is available.
            </p>
         ) : (
            <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
               <div className="grid min-w-[52rem] grid-cols-[minmax(0,1fr)_6rem_8rem_8rem_8rem_9rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
                  <p>Product</p>
                  <p>Unit</p>
                  <p>System before</p>
                  <p>Counted (real)</p>
                  <p>System after</p>
                  <p>Delta</p>
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
