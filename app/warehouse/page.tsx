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
         label: "Katalog produktów",
         description: "Przeglądaj i zarządzaj listą produktów.",
         value: String(mockDb.product_catalog.length),
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
         value: String(mockDb.deliveries.length),
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
         value: String(mockDb.inventory_items.length),
      },
      {
         href: "/warehouse/stocktaking/inventories",
         label: "Lista inwentaryzacji",
         description: "Zapisane operacje inwentaryzacji ze szczegółami pozycji.",
         value: "—",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Magazyn</h1>
            <p className="text-text-500 mt-1">Operacje magazynowe, dostawy i kontrola stanów.</p>
         </div>
         <HubNavigationGrid items={items} />
         {warehouse ? <FeatureSection group={warehouse} /> : null}
      </div>
   )
}

export default WarehousePage
