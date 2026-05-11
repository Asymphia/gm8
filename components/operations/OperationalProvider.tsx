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

import type { OrderStatus } from "@/lib/mock-db"

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

   /** New orders only: deduct stock FIFO from recipe × portions, mark accepted */
   acceptOrder: (orderId: number) => AcceptResult

   /** Zmień status zamówienia (mock, bez walidacji workflow) */
   updateOrderStatus: (orderId: number, status: OrderStatus) => void

   /** Usuń zamówienie i pozycję (nie cofa magazynu — mock UI) */
   removeOrder: (orderId: number) => void
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
      let result: AcceptResult = { ok: false, error: "Order not found." }

      setOperational(prev => {
         const catalog = readRecipeCatalogForOps()
         const order = prev.orders.find(o => o.id === orderId)
         const item = prev.order_items.find(i => i.order_id === orderId)

         if (!order || !item) {
            result = { ok: false, error: "Order not found." }
            return prev
         }

         if (order.status !== "new") {
            result = { ok: false, error: "Only new orders can accept stock." }
            return prev
         }

         const recipe = catalog.recipes.find(r => r.id === item.recipe_id)
         if (!recipe?.is_active) {
            result = { ok: false, error: "Recipe is inactive or missing in the cookbook." }
            return prev
         }

         const ingredients = catalog.ingredients.filter(i => i.recipe_id === item.recipe_id)
         if (ingredients.length === 0) {
            result = { ok: false, error: "Recipe has no ingredient lines — add products in Recipes first." }
            return prev
         }

         const demands = mergeStockDemands(buildDemandsFromRecipe(catalog, item.recipe_id, item.portions))
         const consume = consumeStockFifo(prev.stock, demands)

         if (!consume.ok) {
            result = {
               ok: false,
               error: "Not enough stock for one or more products (FIFO by expiry).",
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
