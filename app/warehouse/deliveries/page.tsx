"use client"

import BackLink from "@/components/ui/BackLink"
import { useMemo, useState, useEffect } from "react"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import {
   loadDeliveriesBrowser,
   saveDeliveriesBrowser,
   type DeliveriesPersisted,
} from "@/lib/deliveries-storage"
import { useOperational } from "@/components/operations/OperationalProvider"
import { PageToolbar } from "@/components/ui/PageToolbar"
import { StatGrid } from "@/components/ui/StatGrid"
import { ResponsiveDataView } from "@/components/ui/ResponsiveDataView"

type DeliveryRow = {
   id: number
   supplier: string
   date: string
   status: string
   statusKey: string
   products: string[]
}

const DeliveriesPage = () => {
   const { ready: opsReady, receiveDeliveryItems } = useOperational()
   const [store, setStore] = useState<DeliveriesPersisted | null>(null)
   const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([])
   const [feedback, setFeedback] = useState<string | null>(null)

   useEffect(() => {
      queueMicrotask(() => setStore(loadDeliveriesBrowser()))
   }, [])

   const rows = useMemo((): DeliveryRow[] => {
      if (!store) return []
      return store.deliveries.map(d => ({
         id: d.id,
         supplier: d.supplier_name,
         date: d.delivered_at.slice(0, 10),
         status: d.status === "pending" ? "Oczekuje na zatwierdzenie" : "Przyjęta",
         statusKey: d.status,
         products: d.items.map(
            item =>
               mockDb.product_catalog.find(p => p.id === item.product_id)?.name ?? `Produkt #${item.product_id}`
         ),
      }))
   }, [store])

   const pendingCount = rows.filter(r => r.statusKey === "pending").length
   const canAccept = selectedDeliveryIds.length > 0 && opsReady

   const toggleDeliverySelection = (id: number) => {
      setSelectedDeliveryIds(previous => (previous.includes(id) ? previous.filter(v => v !== id) : [...previous, id]))
   }

   const handleAcceptSelected = () => {
      if (!store || !opsReady) return
      setFeedback(null)

      const toAccept = store.deliveries.filter(
         d => selectedDeliveryIds.includes(d.id) && d.status === "pending"
      )
      if (toAccept.length === 0) {
         setFeedback("Wybrane dostawy są już przyjęte lub lista jest pusta.")
         return
      }

      for (const delivery of toAccept) {
         receiveDeliveryItems(delivery.items)
      }

      const next: DeliveriesPersisted = {
         ...store,
         deliveries: store.deliveries.map(d =>
            selectedDeliveryIds.includes(d.id) && d.status === "pending" ? { ...d, status: "accepted" as const } : d
         ),
      }
      saveDeliveriesBrowser(next)
      setStore(next)
      setSelectedDeliveryIds([])
      setFeedback(
         `Przyjęto ${toAccept.length} dostaw — stany magazynowe zaktualizowane (${toAccept.reduce((n, d) => n + d.items.length, 0)} pozycji).`
      )
   }

   if (!store) {
      return <p className="text-text-500 text-sm">Ładowanie dostaw…</p>
   }

   return (
      <div className="page-stack">
         <PageToolbar
            back={<BackLink href="/warehouse" label="Powrót do magazynu" />}
            title="Dostawy magazynowe"
            description="Przyjęcie dostawy aktualizuje operacyjny magazyn (partie wg produktu, ważności i dostawcy)."
            actions={
               <>
                  <Link
                     href="/warehouse/deliveries/register"
                     className="bg-primary-500 hover:bg-primary-700 inline-flex items-center justify-center rounded-sm px-6 py-3 text-center text-sm font-medium text-white transition-colors"
                  >
                     Zarejestruj dostawę
                  </Link>
                  <Button type="button" variant="outline" disabled={!canAccept} onClick={handleAcceptSelected}>
                     Przyjmij dostawę
                  </Button>
               </>
            }
         />

         {feedback ? (
            <p className="text-text-500 border-border-300 rounded-sm border border-dashed px-3 py-2 text-sm">{feedback}</p>
         ) : null}

         <StatGrid
            items={[
               { label: "Wszystkie dostawy", value: rows.length },
               { label: "Oczekuje", value: pendingCount, valueClassName: "text-warning" },
               { label: "Wybrane", value: selectedDeliveryIds.length, valueClassName: "text-primary-500" },
            ]}
         />

         <ResponsiveDataView
            rows={rows}
            rowKey={r => r.id}
            desktopGridClass="grid-cols-[3rem_minmax(0,1fr)_10rem_12rem_minmax(0,1fr)]"
            desktopMinWidth="min-w-[52rem]"
            rowPrefix={row =>
               row.statusKey === "pending" ? (
                  <input
                     type="checkbox"
                     checked={selectedDeliveryIds.includes(row.id)}
                     onChange={() => toggleDeliverySelection(row.id)}
                     aria-label={`Zaznacz dostawę ${row.id}`}
                     className="h-4 w-4 accent-primary-500"
                     onClick={e => e.stopPropagation()}
                  />
               ) : (
                  <span className="text-text-300 text-xs">—</span>
               )
            }
            columns={[
               { id: "supplier", header: "Dostawca", cell: r => <p className="text-text-700 font-medium">{r.supplier}</p> },
               { id: "date", header: "Data", cell: r => r.date },
               {
                  id: "status",
                  header: "Status",
                  cell: r => (
                     <span className={r.statusKey === "pending" ? "text-warning" : "text-text-500"}>{r.status}</span>
                  ),
               },
               {
                  id: "products",
                  header: "Produkty",
                  cell: r => <p className="line-clamp-2 sm:line-clamp-none">{r.products.join(", ")}</p>,
               },
            ]}
         />
      </div>
   )
}

export default DeliveriesPage
