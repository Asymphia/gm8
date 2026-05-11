"use client"

import FeatureSection from "@/components/features/FeatureSection"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { useOperational } from "@/components/operations/OperationalProvider"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"
import { mockDb } from "@/lib/mock-db"

const WarehousePage = () => {
   const { ready, stock } = useOperational()
   const warehouse = APP_FEATURE_GROUPS.find(group => group.route === "/warehouse")

   const stockLineCount = ready ? stock.length : mockDb.stock.length

   const items = [
      {
         href: "/warehouse/products",
         label: "Product catalog",
         description: "Browse and manage product list.",
         value: String(mockDb.product_catalog.length),
      },
      {
         href: "/warehouse/stock",
         label: "Stock levels",
         description: "Quantities and suppliers — updates when orders consume stock.",
         value: String(stockLineCount),
      },
      {
         href: "/warehouse/deliveries",
         label: "Deliveries",
         description: "Register and approve product deliveries.",
         value: String(mockDb.deliveries.length),
      },
      {
         href: "/warehouse/expiration",
         label: "Expiration control",
         description: "Products close to expiry, same live stock as levels view.",
         value: String(stockLineCount),
      },
      {
         href: "/warehouse/stocktaking",
         label: "Stocktaking",
         description: "Compare levels, apply corrections, save operations.",
         value: String(mockDb.inventory_items.length),
      },
      {
         href: "/warehouse/stocktaking/inventories",
         label: "Inventory list",
         description: "Open saved stocktaking operations and line details.",
         value: "—",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Warehouse</h1>
            <p className="text-text-500 mt-1">Inventory operations, deliveries and stock control.</p>
         </div>
         <HubNavigationGrid items={items} />
         {warehouse ? <FeatureSection group={warehouse} /> : null}
      </div>
   )
}

export default WarehousePage
