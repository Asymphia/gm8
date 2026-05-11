"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import BackLink from "@/components/ui/BackLink"
import type { InventoryOperation } from "@/lib/inventory-operations"
import { INVENTORY_OPERATIONS_STORAGE_KEY, readInventoryOperations } from "@/lib/inventory-operations"

const InventoriesListPage = () => {
   const [operations, setOperations] = useState<InventoryOperation[]>([])

   useEffect(() => {
      const load = () => setOperations(readInventoryOperations())
      queueMicrotask(load)

      const onStorage = (e: StorageEvent) => {
         if (e.key === INVENTORY_OPERATIONS_STORAGE_KEY || e.key === null) {
            queueMicrotask(load)
         }
      }
      window.addEventListener("storage", onStorage)
      return () => window.removeEventListener("storage", onStorage)
   }, [])

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse/stocktaking" label="Back to stocktaking" />
         <div>
            <h1>Inventory list</h1>
            <p className="text-text-500 mt-1">Saved stocktaking corrections. Open a record for full line details.</p>
         </div>

         {operations.length === 0 ? (
            <p className="text-text-500 rounded-sm border border-border-300 bg-background p-6 text-sm">
               No inventories yet. Run a stocktaking and use &quot;Apply corrections&quot; to save the first one.
            </p>
         ) : (
            <ul className="space-y-2">
               {operations.map(op => (
                  <li key={op.id}>
                     <Link
                        href={`/warehouse/stocktaking/inventories/${op.id}`}
                        className="flex flex-col gap-1 rounded-sm border border-border-300 bg-background p-4 transition-colors hover:border-primary-300 hover:bg-foreground sm:flex-row sm:items-center sm:justify-between"
                     >
                        <div>
                           <p className="text-text-700 font-medium">{new Date(op.createdAt).toLocaleString()}</p>
                           <p className="text-text-500 text-sm">{op.summary}</p>
                           <p className="text-text-300 mt-1 text-xs">{op.id}</p>
                        </div>
                        <span className="text-primary-500 text-sm font-medium">Open →</span>
                     </Link>
                  </li>
               ))}
            </ul>
         )}
      </div>
   )
}

export default InventoriesListPage
