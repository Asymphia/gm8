"use client"

import FeatureSection from "@/components/features/FeatureSection"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { useOperational } from "@/components/operations/OperationalProvider"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"

const OrdersPage = () => {
   const { ready, orders } = useOperational()
   const ordersGroup = APP_FEATURE_GROUPS.find(group => group.route === "/orders")

   const newCount = orders.filter(o => o.status === "new").length
   const items = [
      {
         href: "/orders/register",
         label: "Rejestracja zamówienia",
         description: "Szkice z księgi przepisów · Przyjmij zużywa stan FIFO.",
         value: ready ? String(newCount) : "—",
      },
      {
         href: "/orders/list",
         label: "Lista zamówień",
         description: "Pełna kolejka z nazwami przepisów z Twojej księgi.",
         value: ready ? String(orders.length) : "—",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Zamówienia</h1>
            <p className="text-text-500 mt-1">
               Widok operacyjny rejestracji zamówień — szkic, potem przyjęcie po potwierdzeniu stanu.
            </p>
         </div>
         <HubNavigationGrid items={items} />
         {ordersGroup ? <FeatureSection group={ordersGroup} /> : null}
      </div>
   )
}

export default OrdersPage
