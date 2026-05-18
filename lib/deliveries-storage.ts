import { mockDb, type DeliveryType } from "@/lib/mock-db"

export type DeliveryStatus = "pending" | "accepted"

export interface StoredDeliveryItem {
   product_id: number
   quantity: number
   expiry_date: string
   supplier_name: string
}

export interface StoredDelivery {
   id: number
   delivered_at: string
   type: DeliveryType
   supplier_name: string
   status: DeliveryStatus
   items: StoredDeliveryItem[]
}

export interface DeliveriesPersisted {
   deliveries: StoredDelivery[]
   nextId: number
}

export const DELIVERIES_STORAGE_KEY = "gm8_deliveries_v1"

function seedDeliveries(): DeliveriesPersisted {
   const deliveries: StoredDelivery[] = mockDb.deliveries.map(d => {
      const items = mockDb.delivery_items
         .filter(i => i.delivery_id === d.id)
         .map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            expiry_date: i.expiry_date,
            supplier_name: i.supplier_name,
         }))
      const supplier = items[0]?.supplier_name ?? "Nieznany dostawca"
      return {
         id: d.id,
         delivered_at: d.delivered_at,
         type: d.type,
         supplier_name: supplier,
         status: d.type === "internal_transfer" ? "accepted" : "pending",
         items,
      }
   })
   const nextId = deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 500
   return { deliveries, nextId }
}

export function loadDeliveriesBrowser(): DeliveriesPersisted {
   if (typeof window === "undefined") return seedDeliveries()
   try {
      const raw = window.localStorage.getItem(DELIVERIES_STORAGE_KEY)
      if (!raw) {
         const seed = seedDeliveries()
         saveDeliveriesBrowser(seed)
         return seed
      }
      const parsed = JSON.parse(raw) as DeliveriesPersisted
      if (!parsed?.deliveries || typeof parsed.nextId !== "number") return seedDeliveries()
      return parsed
   } catch {
      return seedDeliveries()
   }
}

export function saveDeliveriesBrowser(data: DeliveriesPersisted): void {
   if (typeof window === "undefined") return
   window.localStorage.setItem(DELIVERIES_STORAGE_KEY, JSON.stringify(data))
}
