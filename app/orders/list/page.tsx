"use client"

import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { useOperational } from "@/components/operations/OperationalProvider"
import { readRecipeCatalogForOps } from "@/lib/operational-mock-storage"
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
   const {
      ready,
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
            const catalog = readRecipeCatalogForOps()
            const recipe = item ? catalog.recipes.find(r => r.id === item.recipe_id) : undefined

            return {
               id: order.id,
               ticket: `ORD-${order.id}`,
               recipe: recipe?.name ?? "Unknown recipe",
               createdAt: order.created_at.slice(11, 16),
               status: order.status,
               portions: item?.portions ?? "—",
            }
         })
   }, [orders, order_items, recipeCatalogRevision])

   const orderSelectOptions = useMemo(
      () =>
         ORDER_LIST_ROWS.map(row => ({
            value: String(row.id),
            label: `${row.ticket} · ${row.recipe} · ${STATUS_LABELS[row.status] ?? row.status}`,
         })),
      [ORDER_LIST_ROWS]
   )

   if (!ready) {
      return <p className="text-text-500 text-sm">Loading orders…</p>
   }

   return (
      <div className="space-y-6">
         <BackLink href="/orders" label="Back to orders" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Order list</h1>
               <p className="text-text-500 mt-1">Kolejka operacyjna — edycja statusu lub usunięcie po wyborze zamówienia z listy.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                  Edit order…
               </Button>
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
                  Remove order…
               </Button>
            </div>
         </div>

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

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[46rem] grid-cols-[8rem_minmax(0,1fr)_5rem_8rem_10rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Order</p>
               <p>Recipe</p>
               <p className="text-right">Portions</p>
               <p>Time</p>
               <p>Status</p>
            </div>
            {ORDER_LIST_ROWS.map(row => (
               <div
                  key={row.ticket}
                  className="grid min-w-[46rem] grid-cols-[8rem_minmax(0,1fr)_5rem_8rem_10rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <p>{row.ticket}</p>
                  <p>{row.recipe}</p>
                  <p className="text-right tabular-nums">{row.portions}</p>
                  <p>{row.createdAt}</p>
                  <p>{STATUS_LABELS[row.status] ?? row.status}</p>
               </div>
            ))}
         </div>
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
   onSave: (orderId: number, status: OrderStatus) => void
}) {
   const first = orders[0]
   const [orderIdStr, setOrderIdStr] = useState(() => String(first?.id ?? ""))
   const [status, setStatus] = useState<OrderStatus>(() => first?.status ?? "new")

   const syncFromPick = (idStr: string) => {
      setOrderIdStr(idStr)
      const row = orders.find(o => String(o.id) === idStr)
      if (row) setStatus(row.status)
   }

   if (!open || options.length === 0) return null

   const handleSave = () => {
      const id = Number.parseInt(orderIdStr, 10)
      if (!Number.isFinite(id)) return
      onSave(id, status)
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Edycja zamówienia</h2>
               <p className="text-text-500 mt-1 text-sm">Wybierz rekord — bez wpisywania numeru z palca.</p>
            </div>
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
   onRemove: (orderId: number) => void
}) {
   const [orderIdStr, setOrderIdStr] = useState(() => options[0]?.value ?? "")
   const [reason, setReason] = useState("")

   if (!open || options.length === 0) return null

   const handleRemove = () => {
      const id = Number.parseInt(orderIdStr, 10)
      if (!Number.isFinite(id)) return
      const ok = typeof window !== "undefined" ? window.confirm("Na pewno usunąć to zamówienie z kolejki?") : true
      if (!ok) return
      onRemove(id)
      setReason("")
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Usuń zamówienie</h2>
               <p className="text-text-500 mt-1 text-sm">Wybierz rekord — powód pozostaje tylko informacyjny (mock).</p>
            </div>
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
