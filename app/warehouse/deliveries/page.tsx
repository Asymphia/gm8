"use client"

import BackLink from "@/components/ui/BackLink"
import { useMemo, useState, useEffect, useCallback } from "react"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { isApiEnabled } from "@/lib/api/config"
import { ApiError } from "@/lib/api/client"
import { acceptDeliveryApi, fetchDeliveries } from "@/lib/api/deliveries-api"
import {
   loadDeliveriesBrowser,
   saveDeliveriesBrowser,
   type DeliveriesPersisted,
} from "@/lib/deliveries-storage"
import { useOperational } from "@/components/operations/OperationalProvider"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
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
   const useApi = isApiEnabled()
   const { ready: opsReady, receiveDeliveryItems, refresh: refreshOps } = useOperational()
   const { products, productById } = useProductCatalog()
   const [store, setStore] = useState<DeliveriesPersisted | null>(null)
   const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<number[]>([])
   const [feedback, setFeedback] = useState<string | null>(null)
   const [pending, setPending] = useState(false)

   const loadStore = useCallback(async () => {
      if (useApi) {
         try {
            const deliveries = await fetchDeliveries()
            const nextId = deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 500
            setStore({ deliveries, nextId })
         } catch (err) {
            setFeedback(err instanceof ApiError ? err.message : "Nie udało się pobrać dostaw.")
            setStore({ deliveries: [], nextId: 500 })
         }
      } else {
         setStore(loadDeliveriesBrowser())
      }
   }, [useApi])

   useEffect(() => {
      void loadStore()
   }, [loadStore])

   const rows = useMemo((): DeliveryRow[] => {
      if (!store) return []
      return store.deliveries.map(d => ({
         id: d.id,
         supplier: d.supplier_name,
         date: d.delivered_at.slice(0, 10),
         status: d.status === "pending" ? "Oczekuje na zatwierdzenie" : "Przyjęta",
         statusKey: d.status,
         products: d.items.map(
            item => productById(item.product_id)?.name ?? `Produkt #${item.product_id}`
         ),
      }))
   }, [store, productById])

   const pendingCount = rows.filter(r => r.statusKey === "pending").length
   const canAccept = selectedDeliveryIds.length > 0 && opsReady && !pending

   const toggleDeliverySelection = (id: number) => {
      setSelectedDeliveryIds(previous => (previous.includes(id) ? previous.filter(v => v !== id) : [...previous, id]))
   }

   const handleAcceptSelected = async () => {
      if (!store || !opsReady) return
      setFeedback(null)
      setPending(true)

      const toAccept = store.deliveries.filter(
         d => selectedDeliveryIds.includes(d.id) && d.status === "pending"
      )
      if (toAccept.length === 0) {
         setFeedback("Wybrane dostawy są już przyjęte lub lista jest pusta.")
         setPending(false)
         return
      }

      try {
         if (useApi) {
            for (const delivery of toAccept) {
               await acceptDeliveryApi(delivery.id)
            }
            await refreshOps()
            await loadStore()
         } else {
            for (const delivery of toAccept) {
               receiveDeliveryItems(delivery.items)
            }
            const next: DeliveriesPersisted = {
               ...store,
               deliveries: store.deliveries.map(d =>
                  selectedDeliveryIds.includes(d.id) && d.status === "pending"
                     ? { ...d, status: "accepted" as const }
                     : d
               ),
            }
            saveDeliveriesBrowser(next)
            setStore(next)
         }
         setSelectedDeliveryIds([])
         setFeedback(
            `Przyjęto ${toAccept.length} dostaw — stany magazynowe zaktualizowane (${toAccept.reduce((n, d) => n + d.items.length, 0)} pozycji).`
         )
      } catch (error) {
         setFeedback(error instanceof Error ? error.message : "Nie udało się przyjąć dostawy.")
      } finally {
         setPending(false)
      }
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
                  <Button type="button" variant="outline" disabled={!canAccept} onClick={() => void handleAcceptSelected()}>
                     {pending ? "Przyjmowanie…" : "Przyjmij zaznaczone"}
                  </Button>
                  <Link
                     href="/warehouse/deliveries/register"
                     className="bg-primary-500 hover:bg-primary-700 inline-flex items-center justify-center rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
                  >
                     Zarejestruj dostawę
                  </Link>
               </>
            }
         />

         {feedback ? <p className="text-primary-500 text-sm">{feedback}</p> : null}

         <StatGrid
            items={[
               { label: "Wszystkie dostawy", value: rows.length },
               { label: "Oczekujące", value: pendingCount },
               { label: "Produkty w katalogu", value: products.length },
            ]}
         />

         <ResponsiveDataView
            rows={rows}
            rowKey={r => r.id}
            desktopGridClass="grid-cols-[3rem_minmax(0,1fr)_8rem_12rem_minmax(0,1fr)]"
            desktopMinWidth="min-w-[48rem]"
            columns={[
               {
                  id: "select",
                  header: "",
                  cell: r =>
                     r.statusKey === "pending" ? (
                        <input
                           type="checkbox"
                           checked={selectedDeliveryIds.includes(r.id)}
                           onChange={() => toggleDeliverySelection(r.id)}
                           aria-label={`Zaznacz dostawę ${r.id}`}
                        />
                     ) : (
                        <span className="text-text-300">—</span>
                     ),
               },
               { id: "supplier", header: "Dostawca", cell: r => r.supplier },
               { id: "date", header: "Data", cell: r => r.date },
               { id: "status", header: "Status", cell: r => r.status },
               {
                  id: "products",
                  header: "Produkty",
                  cell: r => (
                     <span className="text-text-500 text-xs">{r.products.join(", ") || "—"}</span>
                  ),
               },
            ]}
         />
      </div>
   )
}


export default DeliveriesPage
