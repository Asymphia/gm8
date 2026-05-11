"use client"

import { useMemo, useState } from "react"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { mockDb } from "@/lib/mock-db"

interface DraftItem {
   productId: number
   selected: boolean
   quantity: string
   expiryDate: string
}

const RegisterDeliveryPage = () => {
   const [supplierName, setSupplierName] = useState("")
   const [deliveryDate, setDeliveryDate] = useState("")
   const [deliveryType, setDeliveryType] = useState<"supplier" | "internal_transfer">("supplier")
   const [items, setItems] = useState<DraftItem[]>(
      mockDb.product_catalog.map(product => ({
         productId: product.id,
         selected: false,
         quantity: "",
         expiryDate: "",
      }))
   )

   const selectedItemsCount = useMemo(() => items.filter(item => item.selected).length, [items])

   const isDraftReady =
      supplierName.trim().length > 0 &&
      deliveryDate.trim().length > 0 &&
      items.some(item => item.selected && Number(item.quantity) > 0 && item.expiryDate.length > 0)

   const toggleItemSelection = (productId: number) => {
      setItems(previous =>
         previous.map(item => (item.productId === productId ? { ...item, selected: !item.selected } : item))
      )
   }

   const updateItemField = (productId: number, field: "quantity" | "expiryDate", value: string) => {
      setItems(previous => previous.map(item => (item.productId === productId ? { ...item, [field]: value } : item)))
   }

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse/deliveries" label="Back to deliveries" />
         <div>
            <h1>Register Delivery</h1>
            <p className="text-text-500 mt-1">Create delivery draft with supplier and item quantities.</p>
         </div>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <h2 className="text-text-700 mb-3 text-lg font-medium">Delivery data</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Supplier</span>
                  <input
                     type="text"
                     placeholder="e.g. FreshFarm"
                     value={supplierName}
                     onChange={event => setSupplierName(event.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Delivery date</span>
                  <input
                     type="date"
                     value={deliveryDate}
                     onChange={event => setDeliveryDate(event.target.value)}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Delivery type</span>
                  <select
                     value={deliveryType}
                     onChange={event => setDeliveryType(event.target.value as "supplier" | "internal_transfer")}
                     className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  >
                     <option value="supplier">supplier</option>
                     <option value="internal_transfer">internal_transfer</option>
                  </select>
               </label>
            </div>
         </section>

         <section className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[56rem] grid-cols-[3rem_minmax(0,1fr)_8rem_10rem_10rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p />
               <p>Product</p>
               <p>Unit</p>
               <p>Quantity</p>
               <p>Expiry date</p>
            </div>
            {items.map(item => {
               const product = mockDb.product_catalog.find(row => row.id === item.productId)
               return (
                  <div
                     key={item.productId}
                     className="grid min-w-[56rem] grid-cols-[3rem_minmax(0,1fr)_8rem_10rem_10rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
                  >
                     <div className="flex justify-center">
                        <input
                           type="checkbox"
                           checked={item.selected}
                           onChange={() => toggleItemSelection(item.productId)}
                           aria-label={`Include ${product?.name ?? "product"}`}
                           className="h-4 w-4 accent-primary-500"
                        />
                     </div>
                     <p>{product?.name ?? "Unknown product"}</p>
                     <p>{product?.unit ?? "-"}</p>
                     <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={event => updateItemField(item.productId, "quantity", event.target.value)}
                        disabled={!item.selected}
                        className="border-border-300 disabled:bg-foreground rounded-sm border px-2 py-1 text-sm outline-none disabled:opacity-70"
                     />
                     <input
                        type="date"
                        value={item.expiryDate}
                        onChange={event => updateItemField(item.productId, "expiryDate", event.target.value)}
                        disabled={!item.selected}
                        className="border-border-300 disabled:bg-foreground rounded-sm border px-2 py-1 text-sm outline-none disabled:opacity-70"
                     />
                  </div>
               )
            })}
         </section>

         <div className="flex flex-col justify-between gap-3 rounded-sm border border-border-300 bg-background p-4 sm:flex-row sm:items-center">
            <p className="text-text-500 text-sm">
               Selected products: <span className="text-text-700 font-medium">{selectedItemsCount}</span>
            </p>
            <div className="flex gap-2">
               <Button type="button" variant="outline">
                  Cancel
               </Button>
               <Button type="button" disabled={!isDraftReady}>
                  Save delivery draft
               </Button>
            </div>
         </div>
      </div>
   )
}

export default RegisterDeliveryPage
