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
         label: "Register order",
         description: "Create drafts from the cookbook · Accept pulls stock FIFO.",
         value: ready ? String(newCount) : "—",
      },
      {
         href: "/orders/list",
         label: "Order list",
         description: "Full queue with recipe names from your cookbook.",
         value: ready ? String(orders.length) : "—",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Orders</h1>
            <p className="text-text-500 mt-1">
               Operational view for order registration — draft then accept when stock is confirmed.
            </p>
         </div>
         <HubNavigationGrid items={items} />
         {ordersGroup ? <FeatureSection group={ordersGroup} /> : null}
      </div>
   )
}

export default OrdersPage
