"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { isApiEnabled } from "@/lib/api/config"
import { createDelivery } from "@/lib/api/deliveries-api"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useOperational } from "@/components/operations/OperationalProvider"
import { loadDeliveriesBrowser, saveDeliveriesBrowser } from "@/lib/deliveries-storage"

interface DraftItem {
   productId: number
   selected: boolean
   quantity: string
   expiryDate: string
}

const RegisterDeliveryPage = () => {
   const useApi = isApiEnabled()
   const router = useRouter()
   const { receiveDeliveryItems, refresh: refreshOps } = useOperational()
   const { products, ready: productsReady } = useProductCatalog()
   const [supplierName, setSupplierName] = useState("")
   const [deliveryDate, setDeliveryDate] = useState("")
   const [deliveryType, setDeliveryType] = useState<"supplier" | "internal_transfer">("supplier")
   const [items, setItems] = useState<DraftItem[]>([])
   const [pending, setPending] = useState(false)
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
      if (productsReady && items.length === 0) {
         setItems(
            products.map(product => ({
               productId: product.id,
               selected: false,
               quantity: "",
               expiryDate: "",
            }))
         )
      }
   }, [products, productsReady, items.length])

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

   const handleSave = async () => {
      setError(null)
      setPending(true)
      const selectedLines = items
         .filter(item => item.selected && Number(item.quantity) > 0 && item.expiryDate)
         .map(item => ({
            product_id: item.productId,
            quantity: Number(item.quantity),
            expiry_date: item.expiryDate,
            supplier_name: supplierName.trim(),
         }))

      if (selectedLines.length === 0) {
         setPending(false)
         return
      }

      try {
         const isInternal = deliveryType === "internal_transfer"
         const deliveredAt = `${deliveryDate}T08:00:00.000Z`

         if (useApi) {
            await createDelivery({
               supplierName: supplierName.trim(),
               kind: deliveryType,
               type: isInternal ? "Delivered" : "Pending",
               deliveredAt: isInternal ? deliveredAt : null,
               items: selectedLines.map(l => ({
                  product_Id: l.product_id,
                  quantity: l.quantity,
                  expiryDate: `${l.expiry_date}T12:00:00Z`,
                  supplierName: l.supplier_name,
               })),
            })
            if (isInternal) {
               await refreshOps()
            }
         } else {
            const store = loadDeliveriesBrowser()
            const id = store.nextId
            store.deliveries.unshift({
               id,
               delivered_at: deliveredAt,
               type: deliveryType,
               supplier_name: supplierName.trim(),
               status: isInternal ? "accepted" : "pending",
               items: selectedLines,
            })
            store.nextId = id + 1
            saveDeliveriesBrowser(store)
            if (isInternal) {
               receiveDeliveryItems(selectedLines)
            }
         }

         router.push("/warehouse/deliveries")
      } catch (err) {
         setError(err instanceof Error ? err.message : "Nie udało się zapisać dostawy.")
      } finally {
         setPending(false)
      }
   }

   if (!productsReady) {
      return <p className="text-text-500 text-sm">Ładowanie produktów…</p>
   }

   return (
      <div className="space-y-6">
         <BackLink href="/warehouse/deliveries" label="Powrót do dostaw" />
         <div>
            <h1>Rejestracja dostawy</h1>
            <p className="text-text-500 mt-1">Utwórz szkic dostawy z dostawcą i ilościami pozycji.</p>
         </div>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <h2 className="text-text-700 mb-3 text-lg font-medium">Dane dostawy</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Dostawca</span>
                  <input
                     type="text"
                     value={supplierName}
                     onChange={e => setSupplierName(e.target.value)}
                     className="border-border-300 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Data dostawy</span>
                  <input
                     type="date"
                     value={deliveryDate}
                     onChange={e => setDeliveryDate(e.target.value)}
                     className="border-border-300 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
               <label className="space-y-1">
                  <span className="text-text-700 text-sm font-medium">Typ</span>
                  <select
                     value={deliveryType}
                     onChange={e => setDeliveryType(e.target.value as "supplier" | "internal_transfer")}
                     className="border-border-300 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                  >
                     <option value="supplier">Dostawca zewnętrzny</option>
                     <option value="internal_transfer">Transfer wewnętrzny</option>
                  </select>
               </label>
            </div>
         </section>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <h2 className="text-text-700 mb-3 text-lg font-medium">Pozycje dostawy</h2>
            <div className="space-y-2">
               {items.map(item => {
                  const product = products.find(p => p.id === item.productId)
                  return (
                     <div
                        key={item.productId}
                        className="grid grid-cols-1 items-center gap-2 rounded-sm border border-border-300 p-3 md:grid-cols-[auto_minmax(0,1fr)_8rem_10rem]"
                     >
                        <input
                           type="checkbox"
                           checked={item.selected}
                           onChange={() => toggleItemSelection(item.productId)}
                        />
                        <span className="text-text-700 text-sm">{product?.name ?? `Produkt #${item.productId}`}</span>
                        <input
                           type="number"
                           min="0"
                           step="0.01"
                           placeholder="Ilość"
                           value={item.quantity}
                           onChange={e => updateItemField(item.productId, "quantity", e.target.value)}
                           className="border-border-300 rounded-sm border px-2 py-1 text-sm outline-none"
                        />
                        <input
                           type="date"
                           value={item.expiryDate}
                           onChange={e => updateItemField(item.productId, "expiryDate", e.target.value)}
                           className="border-border-300 rounded-sm border px-2 py-1 text-sm outline-none"
                        />
                     </div>
                  )
               })}
            </div>
            <p className="text-text-300 mt-2 text-xs">Zaznaczono pozycji: {selectedItemsCount}</p>
         </section>

         {error ? <p className="text-warning text-sm">{error}</p> : null}

         <Button type="button" disabled={!isDraftReady || pending} onClick={() => void handleSave()}>
            {pending ? "Zapisywanie…" : "Zapisz dostawę"}
         </Button>
      </div>
   )
}

export default RegisterDeliveryPage
