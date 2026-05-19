"use client"

import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { PageToolbar } from "@/components/ui/PageToolbar"
import { ResponsiveDataView } from "@/components/ui/ResponsiveDataView"
import { useOperational } from "@/components/operations/OperationalProvider"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { ApiError } from "@/lib/api/client"
import type { OrderStatus } from "@/lib/mock-db"
import { useMemo, useState } from "react"

const STATUS_LABELS: Record<OrderStatus, string> = {
   new: "Nowe",
   accepted: "Przyjęte",
   in_progress: "W realizacji",
   done: "Zrobione",
   cancelled: "Anulowane",
}

const STATUS_OPTIONS: OrderStatus[] = ["new", "accepted", "in_progress", "done", "cancelled"]

const OrdersListPage = () => {
   const { isOwner } = useAuth()
   const { catalog } = useRecipeCatalog()
   const {
      ready,
      loadError,
      orders,
      order_items,
      recipeCatalogRevision,
      updateOrderStatus,
      removeOrder,
   } = useOperational()

   const [editOpen, setEditOpen] = useState(false)
   const [removeOpen, setRemoveOpen] = useState(false)
   const [editModalKey, setEditModalKey] = useState(0)
   const [removeModalKey, setRemoveModalKey] = useState(0)

   const ORDER_LIST_ROWS = useMemo(() => {
      void recipeCatalogRevision

      return [...orders]
         .sort((a, b) => b.id - a.id)
         .map(order => {
            const item = order_items.find(i => i.order_id === order.id)
            const recipe = item ? catalog.recipes.find(r => r.id === item.recipe_id) : undefined

            return {
               id: order.id,
               ticket: `ORD-${order.id}`,
               recipe: recipe?.name ?? "Nieznany przepis",
               createdAt: order.created_at.slice(11, 16),
               status: order.status,
               portions: item?.portions ?? "—",
            }
         })
   }, [catalog.recipes, orders, order_items, recipeCatalogRevision])

   const orderSelectOptions = useMemo(
      () =>
         ORDER_LIST_ROWS.map(row => ({
            value: String(row.id),
            label: `${row.ticket} · ${row.recipe} · ${STATUS_LABELS[row.status] ?? row.status}`,
         })),
      [ORDER_LIST_ROWS]
   )

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie zamówień…</p>
   }

   return (
      <div className="page-stack">
         {loadError ? (
            <p className="text-warning rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 text-sm">{loadError}</p>
         ) : null}
         <PageToolbar
            back={<BackLink href="/orders" label="Powrót do zamówień" />}
            title="Lista zamówień"
            description="Kolejka operacyjna — edycja statusu lub usunięcie po wyborze zamówienia z listy."
            actions={
               <>
                  <Button
                     type="button"
                     variant="outline"
                     size="sm"
                     disabled={ORDER_LIST_ROWS.length === 0}
                     onClick={() => {
                        setEditModalKey(previous => previous + 1)
                        setEditOpen(true)
                     }}
                  >
                     Edytuj zamówienie…
                  </Button>
                  {isOwner ? (
                     <Button
                        type="button"
                        variant="warning"
                        size="sm"
                        disabled={ORDER_LIST_ROWS.length === 0}
                        onClick={() => {
                           setRemoveModalKey(previous => previous + 1)
                           setRemoveOpen(true)
                        }}
                     >
                        Usuń zamówienie…
                     </Button>
                  ) : null}
               </>
            }
         />

         {editOpen ? (
            <EditOrderModal
               key={editModalKey}
               open={editOpen}
               onClose={() => setEditOpen(false)}
               orders={ORDER_LIST_ROWS}
               options={orderSelectOptions}
               onSave={(orderId, status) => updateOrderStatus(orderId, status)}
            />
         ) : null}
         {removeOpen ? (
            <RemoveOrderModal
               key={removeModalKey}
               open={removeOpen}
               onClose={() => setRemoveOpen(false)}
               options={orderSelectOptions}
               onRemove={removeOrder}
            />
         ) : null}

         <ResponsiveDataView
            rows={ORDER_LIST_ROWS}
            rowKey={row => row.id}
            desktopGridClass="grid-cols-[8rem_minmax(0,1fr)_5rem_8rem_10rem]"
            desktopMinWidth="min-w-[46rem]"
            columns={[
               { id: "ticket", header: "Zamówienie", cell: r => <span className="text-text-700 font-medium">{r.ticket}</span> },
               { id: "recipe", header: "Przepis", cell: r => r.recipe },
               { id: "portions", header: "Porcje", cell: r => <span className="tabular-nums">{r.portions}</span> },
               { id: "time", header: "Godzina", cell: r => r.createdAt },
               { id: "status", header: "Status", cell: r => STATUS_LABELS[r.status] ?? r.status },
            ]}
         />
      </div>
   )
}

function EditOrderModal({
   open,
   onClose,
   orders,
   options,
   onSave,
}: {
   open: boolean
   onClose: () => void
   orders: Array<{ id: number; ticket: string; status: OrderStatus }>
   options: { value: string; label: string }[]
   onSave: (orderId: number, status: OrderStatus) => void | Promise<void>
}) {
   const first = orders[0]
   const [orderIdStr, setOrderIdStr] = useState(() => String(first?.id ?? ""))
   const [status, setStatus] = useState<OrderStatus>(() => first?.status ?? "new")
   const [error, setError] = useState<string | null>(null)

   const syncFromPick = (idStr: string) => {
      setOrderIdStr(idStr)
      const row = orders.find(o => String(o.id) === idStr)
      if (row) setStatus(row.status)
   }

   if (!open || options.length === 0) return null

   const handleSave = () => {
      const id = Number.parseInt(orderIdStr, 10)
      if (!Number.isFinite(id)) return
      setError(null)
      void Promise.resolve(onSave(id, status))
         .then(() => onClose())
         .catch((err: unknown) => {
            setError(err instanceof ApiError ? err.message : "Nie udało się zapisać statusu.")
         })
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Edycja zamówienia</h2>
               <p className="text-text-500 mt-1 text-sm">Wybierz rekord — bez wpisywania numeru z palca.</p>
            </div>
            {error ? <p className="text-warning text-sm">{error}</p> : null}
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Zamówienie</span>
               <select
                  value={orderIdStr}
                  onChange={e => syncFromPick(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Status</span>
               <select
                  value={status}
                  onChange={e => setStatus(e.target.value as OrderStatus)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {STATUS_OPTIONS.map(s => (
                     <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                     </option>
                  ))}
               </select>
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="primary" onClick={handleSave}>
                  Zapisz
               </Button>
            </div>
         </div>
      </Modal>
   )
}

function RemoveOrderModal({
   open,
   onClose,
   options,
   onRemove,
}: {
   open: boolean
   onClose: () => void
   options: { value: string; label: string }[]
   onRemove: (orderId: number) => void | Promise<void>
}) {
   const [orderIdStr, setOrderIdStr] = useState(() => options[0]?.value ?? "")
   const [reason, setReason] = useState("")
   const [error, setError] = useState<string | null>(null)

   if (!open || options.length === 0) return null

   const handleRemove = () => {
      const id = Number.parseInt(orderIdStr, 10)
      if (!Number.isFinite(id)) return
      const ok = typeof window !== "undefined" ? window.confirm("Na pewno usunąć to zamówienie z kolejki?") : true
      if (!ok) return
      setError(null)
      void Promise.resolve(onRemove(id))
         .then(() => {
            setReason("")
            onClose()
         })
         .catch((err: unknown) => {
            setError(err instanceof ApiError ? err.message : "Nie udało się usunąć zamówienia.")
         })
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Usuń zamówienie</h2>
               <p className="text-text-500 mt-1 text-sm">Wybierz rekord — powód pozostaje tylko informacyjny (mock).</p>
            </div>
            {error ? <p className="text-warning text-sm">{error}</p> : null}
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Zamówienie</span>
               <select
                  value={orderIdStr}
                  onChange={e => setOrderIdStr(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Powód</span>
               <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="np. duplikat wpisu"
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="warning" onClick={handleRemove}>
                  Usuń
               </Button>
            </div>
         </div>
      </Modal>
   )
}

export default OrdersListPage
