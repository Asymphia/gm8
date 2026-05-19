"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useOperational } from "@/components/operations/OperationalProvider"
import { isApiEnabled } from "@/lib/api/config"
import { fetchDeliveries } from "@/lib/api/deliveries-api"
import { fetchInventories } from "@/lib/api/inventory-api"
import { mockDb } from "@/lib/mock-db"

const OWNER_ONLY_WAREHOUSE_HREFS = ["/warehouse/products", "/warehouse/stocktaking", "/warehouse/stocktaking/inventories"]

const WarehousePage = () => {
   const { isOwner } = useAuth()
   const useApi = isApiEnabled()
   const { ready, stock } = useOperational()
   const { products, ready: productsReady } = useProductCatalog()

   const [deliveryCount, setDeliveryCount] = useState<number | null>(null)
   const [inventoryCount, setInventoryCount] = useState<number | null>(null)

   useEffect(() => {
      if (!useApi) return
      void (async () => {
         try {
            const [deliveries, inventories] = await Promise.all([fetchDeliveries(), fetchInventories()])
            setDeliveryCount(deliveries.length)
            setInventoryCount(inventories.filter(i => i.completedAt).length)
         } catch {
            setDeliveryCount(0)
            setInventoryCount(0)
         }
      })()
   }, [useApi])

   const stockLineCount = ready ? stock.length : mockDb.stock.length
   const productCount =
      productsReady ? products.length : useApi ? "—" : String(mockDb.product_catalog.length)
   const deliveriesValue =
      deliveryCount !== null ? String(deliveryCount) : useApi ? "—" : String(mockDb.deliveries.length)
   const inventoryValue =
      inventoryCount !== null ? String(inventoryCount) : useApi ? "—" : String(mockDb.inventory_items.length)

   const allItems = [
      {
         href: "/warehouse/products",
         label: "Katalog produktów",
         description: "Przeglądaj i zarządzaj listą produktów.",
         value: String(productCount),
      },
      {
         href: "/warehouse/stock",
         label: "Stany magazynowe",
         description: "Ilości i dostawcy — aktualizacja przy zużyciu z zamówień.",
         value: String(stockLineCount),
      },
      {
         href: "/warehouse/deliveries",
         label: "Dostawy",
         description: "Rejestracja i zatwierdzanie dostaw produktów.",
         value: deliveriesValue,
      },
      {
         href: "/warehouse/expiration",
         label: "Kontrola ważności",
         description: "Produkty bliskie terminowi — ten sam stan co widok poziomów.",
         value: String(stockLineCount),
      },
      {
         href: "/warehouse/stocktaking",
         label: "Inwentaryzacja",
         description: "Porównanie stanów, korekty i zapis operacji.",
         value: inventoryValue,
      },
      {
         href: "/warehouse/stocktaking/inventories",
         label: "Lista inwentaryzacji",
         description: "Zapisane operacje inwentaryzacji ze szczegółami pozycji.",
         value: inventoryValue,
      },
   ]

   const items = isOwner
      ? allItems
      : allItems.filter(item => !OWNER_ONLY_WAREHOUSE_HREFS.includes(item.href))

   return (
      <div className="space-y-6">
         <div>
            <h1>Magazyn</h1>
            <p className="text-text-500 mt-1">Operacje magazynowe, dostawy i kontrola stanów.</p>
         </div>
         <HubNavigationGrid items={items} />
      </div>
   )
}

export default WarehousePage
