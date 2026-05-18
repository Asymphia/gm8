"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { consumeStockFifo, mergeStockDemands } from "@/lib/stock-fifo-consume"
import {
   saveOperationalBrowser,
   loadOperationalBrowser,
   createSeedOperational,
   readRecipeCatalogForOps,
   buildDemandsFromRecipe,
   type OperationalPersisted,
} from "@/lib/operational-mock-storage"
import { RECIPE_CATALOG_UPDATED_EVENT } from "@/lib/recipe-catalog-storage"

import type { OrderStatus, StockRow } from "@/lib/mock-db"
import type { StoredDeliveryItem } from "@/lib/deliveries-storage"

type AcceptResult =
   | { ok: true }
   | { ok: false; error: string; shortage?: { product_id: number; missing: number }[] }

interface OperationalContextValue {
   ready: boolean
   recipeCatalogRevision: number

   stock: OperationalPersisted["stock"]
   orders: OperationalPersisted["orders"]
   order_items: OperationalPersisted["order_items"]

   activeRecipesPicklist: Array<{ id: number; name: string; ingredientLines: number }>

   registerOrder: (recipeId: number, portions: number) => number | null
   acceptOrder: (orderId: number) => AcceptResult
   updateOrderStatus: (orderId: number, status: OrderStatus) => void
   removeOrder: (orderId: number) => void
   receiveDeliveryItems: (items: StoredDeliveryItem[]) => void
}

const OperationalContext = createContext<OperationalContextValue | null>(null)

const DEFAULT_OPERATOR_ID = 1

export function OperationalProvider({ children }: { children: ReactNode }) {
   const [ready, setReady] = useState(false)
   const [operational, setOperational] = useState<OperationalPersisted>(() => createSeedOperational())
   const [recipeCatalogRevision, bumpRecipeRevision] = useState(0)

   useEffect(() => {
      queueMicrotask(() => {
         const stored = loadOperationalBrowser()
         if (stored) setOperational(stored)
         else {
            const seed = createSeedOperational()
            saveOperationalBrowser(seed)
            setOperational(seed)
         }
         setReady(true)
      })
   }, [])

   useEffect(() => {
      const onRecipeUpdate = () => bumpRecipeRevision(n => n + 1)
      window.addEventListener(RECIPE_CATALOG_UPDATED_EVENT, onRecipeUpdate)
      return () => window.removeEventListener(RECIPE_CATALOG_UPDATED_EVENT, onRecipeUpdate)
   }, [])

   useEffect(() => {
      if (!ready) return
      saveOperationalBrowser(operational)
   }, [operational, ready])

   const activeRecipesPicklist = useMemo(() => {
      void recipeCatalogRevision
      const catalog = readRecipeCatalogForOps()
      return [...catalog.recipes]
         .filter(r => r.is_active)
         .sort((a, b) => a.name.localeCompare(b.name))
         .map(r => ({
            id: r.id,
            name: r.name,
            ingredientLines: catalog.ingredients.filter(i => i.recipe_id === r.id).length,
         }))
   }, [recipeCatalogRevision])

   const registerOrder = useCallback((recipeId: number, portions: number): number | null => {
      const portionsN = Number(portions)
      if (!Number.isFinite(portionsN) || portionsN < 1) return null

      const catalog = readRecipeCatalogForOps()
      const recipe = catalog.recipes.find(r => r.id === recipeId)
      if (!recipe?.is_active) return null

      const lines = catalog.ingredients.filter(i => i.recipe_id === recipeId)
      if (lines.length === 0) return null

      let createdId = -1
      setOperational(prev => {
         const id = prev.nextOrderId
         createdId = id
         return {
            ...prev,
            orders: [...prev.orders, { id, created_at: new Date().toISOString(), status: "new", user_id: DEFAULT_OPERATOR_ID }],
            order_items: [...prev.order_items, { order_id: id, recipe_id: recipeId, portions: Math.floor(portionsN) }],
            nextOrderId: id + 1,
         }
      })
      return createdId < 0 ? null : createdId
   }, [])

   const acceptOrder = useCallback((orderId: number): AcceptResult => {
      let result: AcceptResult = { ok: false, error: "Nie znaleziono zamówienia." }

      setOperational(prev => {
         const catalog = readRecipeCatalogForOps()
         const order = prev.orders.find(o => o.id === orderId)
         const item = prev.order_items.find(i => i.order_id === orderId)

         if (!order || !item) {
            result = { ok: false, error: "Nie znaleziono zamówienia." }
            return prev
         }

         if (order.status !== "new") {
            result = { ok: false, error: "Tylko nowe zamówienia mogą zużywać stan." }
            return prev
         }

         const recipe = catalog.recipes.find(r => r.id === item.recipe_id)
         if (!recipe?.is_active) {
            result = { ok: false, error: "Przepis jest nieaktywny lub brakuje go w księdze." }
            return prev
         }

         const ingredients = catalog.ingredients.filter(i => i.recipe_id === item.recipe_id)
         if (ingredients.length === 0) {
            result = { ok: false, error: "Przepis nie ma składników — najpierw dodaj produkty w Przepisach." }
            return prev
         }

         const demands = mergeStockDemands(buildDemandsFromRecipe(catalog, item.recipe_id, item.portions))
         const consume = consumeStockFifo(prev.stock, demands)

         if (!consume.ok) {
            result = {
               ok: false,
               error: "Niewystarczający stan dla co najmniej jednego produktu (FIFO wg ważności).",
               shortage: consume.shortage,
            }
            return prev
         }

         result = { ok: true }
         return {
            ...prev,
            stock: consume.lines,
            orders: prev.orders.map(o => (o.id === orderId ? { ...o, status: "accepted" as const } : o)),
         }
      })

      return result
   }, [])

   const removeOrder = useCallback((orderId: number) => {
      setOperational(prev => ({
         ...prev,
         orders: prev.orders.filter(o => o.id !== orderId),
         order_items: prev.order_items.filter(i => i.order_id !== orderId),
      }))
   }, [])

   const updateOrderStatus = useCallback((orderId: number, status: OrderStatus) => {
      setOperational(prev => ({
         ...prev,
         orders: prev.orders.map(o => (o.id === orderId ? { ...o, status } : o)),
      }))
   }, [])

   const receiveDeliveryItems = useCallback((items: StoredDeliveryItem[]) => {
      if (items.length === 0) return
      setOperational(prev => {
         const lines: StockRow[] = prev.stock.map(s => ({ ...s }))
         let nextId = lines.length > 0 ? Math.max(...lines.map(s => s.id)) + 1 : 500

         for (const item of items) {
            const qty = Number(item.quantity)
            if (!Number.isFinite(qty) || qty <= 0) continue

            const match = lines.find(
               l =>
                  l.product_id === item.product_id &&
                  l.expiry_date === item.expiry_date &&
                  l.supplier_name === item.supplier_name
            )

            if (match) {
               match.quantity = Number((match.quantity + qty).toFixed(5))
            } else {
               lines.push({
                  id: nextId++,
                  product_id: item.product_id,
                  quantity: qty,
                  expiry_date: item.expiry_date,
                  supplier_name: item.supplier_name,
               })
            }
         }

         return { ...prev, stock: lines }
      })
   }, [])

   const value = useMemo(
      () =>
         ({
            ready,
            recipeCatalogRevision,
            stock: operational.stock,
            orders: operational.orders,
            order_items: operational.order_items,
            activeRecipesPicklist,
            registerOrder,
            acceptOrder,
            updateOrderStatus,
            removeOrder,
            receiveDeliveryItems,
         }) satisfies OperationalContextValue,
      [
         acceptOrder,
         activeRecipesPicklist,
         operational.order_items,
         operational.orders,
         operational.stock,
         ready,
         registerOrder,
         removeOrder,
         updateOrderStatus,
         receiveDeliveryItems,
         recipeCatalogRevision,
      ]
   )

   return <OperationalContext.Provider value={value}>{children}</OperationalContext.Provider>
}

export function useOperational(): OperationalContextValue {
   const ctx = useContext(OperationalContext)
   if (!ctx) throw new Error("useOperational must be used inside OperationalProvider")
   return ctx
}
