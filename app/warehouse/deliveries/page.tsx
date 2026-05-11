"use client"

import { mockDb } from "@/lib/mock-db"
import BackLink from "@/components/ui/BackLink"
import { useMemo, useState } from "react"
import Button from "@/components/ui/Button"
import Link from "next/link"

interface DeliveryRowView {
   id: number
   supplier: string
   date: string
   status: "Pending approval" | "Accepted"
   products: string[]
}

const initialRows: DeliveryRowView[] = mockDb.deliveries.map(delivery => {
   const items = mockDb.delivery_items.filter(item => item.delivery_id === delivery.id)
   const supplier = items[0]?.supplier_name ?? "Unknown supplier"
   const products = items.map(
      item => mockDb.product_catalog.find(product => product.id === item.product_id)?.name ?? `Product #${item.product_id}`
   )

   return {
      id: delivery.id,
      supplier,
      date: delivery.delivered_at.slice(0, 10),
      status: delivery.type === "supplier" ? "Pending approval" : "Accepted",
      products,
   }
})

const DeliveriesPage = () => {
   const [rows, setRows] = useState<DeliveryRowView[]>(initialRows)
   const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([])

   const canAccept = selectedDeliveryIds.length > 0

   const pendingCount = useMemo(() => rows.filter(row => row.status === "Pending approval").length, [rows])

   const toggleDeliverySelection = (id: number) => {
      setSelectedDeliveryIds(previous => (previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]))
   }

   const handleAcceptSelected = () => {
      setRows(previous =>
         previous.map(row => (selectedDeliveryIds.includes(row.id) ? { ...row, status: "Accepted" as const } : row))
      )
      setSelectedDeliveryIds([])
   }

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Back to warehouse" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Warehouse Deliveries</h1>
               <p className="text-text-500 mt-1">Preview incoming deliveries and acceptance status.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
               <Link
                  href="/warehouse/deliveries/register"
                  className="bg-primary-500 hover:bg-primary-700 rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
               >
                  Register delivery
               </Link>
               <Button type="button" variant="outline" disabled={!canAccept} onClick={handleAcceptSelected}>
                  Accept delivery
               </Button>
            </div>
         </div>
         <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Total deliveries</p>
               <p className="text-text-700 mt-1 text-xl font-semibold">{rows.length}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Pending approval</p>
               <p className="text-warning mt-1 text-xl font-semibold">{pendingCount}</p>
            </article>
            <article className="rounded-sm border border-border-300 bg-background p-3">
               <p className="text-text-300 text-xs">Selected for approval</p>
               <p className="text-primary-500 mt-1 text-xl font-semibold">{selectedDeliveryIds.length}</p>
            </article>
         </div>
         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[52rem] grid-cols-[3rem_minmax(0,1fr)_10rem_12rem_minmax(0,1fr)] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p />
               <p>Supplier</p>
               <p>Date</p>
               <p>Status</p>
               <p>Products</p>
            </div>
            {rows.map(row => (
               <div
                  key={row.id}
                  className="grid min-w-[52rem] grid-cols-[3rem_minmax(0,1fr)_10rem_12rem_minmax(0,1fr)] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <div className="flex justify-center">
                     <input
                        type="checkbox"
                        checked={selectedDeliveryIds.includes(row.id)}
                        onChange={() => toggleDeliverySelection(row.id)}
                        aria-label={`Select delivery ${row.id}`}
                        className="h-4 w-4 accent-primary-500"
                     />
                  </div>
                  <p>{row.supplier}</p>
                  <p>{row.date}</p>
                  <p>{row.status}</p>
                  <p>{row.products.join(", ")}</p>
               </div>
            ))}
         </div>
      </div>
   )
}

export default DeliveriesPage
