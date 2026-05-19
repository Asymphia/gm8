"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { loadAuthSession } from "@/lib/auth"
import { getAccessToken } from "@/lib/api/tokens"
import { ApiError } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import {
   acceptOrderApi,
   createOrder,
   deleteOrderApi,
   fetchOperationalSnapshot,
   updateOrderStatusApi,
} from "@/lib/api/orders-api"
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
   loadError: string | null
   recipeCatalogRevision: number

   stock: OperationalPersisted["stock"]
   orders: OperationalPersisted["orders"]
   order_items: OperationalPersisted["order_items"]

   activeRecipesPicklist: Array<{ id: number; name: string; ingredientLines: number }>

   refresh: () => Promise<void>
   registerOrder: (recipeId: number, portions: number) => Promise<number | null>
   acceptOrder: (orderId: number) => Promise<AcceptResult>
   updateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>
   removeOrder: (orderId: number) => Promise<void>
   receiveDeliveryItems: (items: StoredDeliveryItem[]) => void
}

const OperationalContext = createContext<OperationalContextValue | null>(null)

const DEFAULT_OPERATOR_ID = 1

export function OperationalProvider({ children }: { children: ReactNode }) {
   const { session } = useAuth()
   const { catalog, ready: recipesReady } = useRecipeCatalog()
   const useApi = isApiEnabled()
   const [ready, setReady] = useState(false)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [operational, setOperational] = useState<OperationalPersisted>(() => createSeedOperational())
   const [recipeCatalogRevision, bumpRecipeRevision] = useState(0)

   const applySnapshot = useCallback((snapshot: OperationalPersisted) => {
      setOperational(snapshot)
   }, [])

   const refresh = useCallback(async () => {
      if (useApi) {
         if (!session || !getAccessToken()) return
         try {
            const snapshot = await fetchOperationalSnapshot()
            applySnapshot(snapshot)
            setLoadError(null)
         } catch (err) {
            setLoadError(err instanceof ApiError ? err.message : "Nie udało się pobrać danych operacyjnych.")
         }
      } else {
         const stored = loadOperationalBrowser()
         applySnapshot(stored ?? createSeedOperational())
         setLoadError(null)
      }
   }, [applySnapshot, session, useApi])

   useEffect(() => {
      if (useApi && (!session || !getAccessToken())) {
         setReady(true)
         return
      }
      void (async () => {
         if (useApi) {
            await refresh()
         } else {
            const stored = loadOperationalBrowser()
            if (stored) applySnapshot(stored)
            else {
               const seed = createSeedOperational()
               saveOperationalBrowser(seed)
               applySnapshot(seed)
            }
         }
         setReady(true)
      })()
   }, [applySnapshot, refresh, session, useApi])

   useEffect(() => {
      const onRecipeUpdate = () => bumpRecipeRevision(n => n + 1)
      window.addEventListener(RECIPE_CATALOG_UPDATED_EVENT, onRecipeUpdate)
      return () => window.removeEventListener(RECIPE_CATALOG_UPDATED_EVENT, onRecipeUpdate)
   }, [])

   useEffect(() => {
      if (!ready || useApi) return
      saveOperationalBrowser(operational)
   }, [operational, ready, useApi])

   const activeRecipesPicklist = useMemo(() => {
      void recipeCatalogRevision
      if (!recipesReady) return []
      return [...catalog.recipes]
         .filter(r => r.is_active)
         .sort((a, b) => a.name.localeCompare(b.name))
         .map(r => ({
            id: r.id,
            name: r.name,
            ingredientLines: catalog.ingredients.filter(i => i.recipe_id === r.id).length,
         }))
   }, [catalog, recipeCatalogRevision, recipesReady])

   const registerOrder = useCallback(
      async (recipeId: number, portions: number): Promise<number | null> => {
         const portionsN = Number(portions)
         if (!Number.isFinite(portionsN) || portionsN < 1) return null

         const recipe = catalog.recipes.find(r => r.id === recipeId)
         if (!recipe?.is_active) return null

         const lines = catalog.ingredients.filter(i => i.recipe_id === recipeId)
         if (lines.length === 0) return null

         if (useApi) {
            const authSession = loadAuthSession()
            if (!authSession?.userId) return null
            try {
               const created = await createOrder(authSession.userId, recipeId, portionsN)
               await refresh()
               return created.id
            } catch (err) {
               throw err
            }
         }

         let createdId = -1
         setOperational(prev => {
            const id = prev.nextOrderId
            createdId = id
            return {
               ...prev,
               orders: [
                  ...prev.orders,
                  { id, created_at: new Date().toISOString(), status: "new", user_id: DEFAULT_OPERATOR_ID },
               ],
               order_items: [...prev.order_items, { order_id: id, recipe_id: recipeId, portions: Math.floor(portionsN) }],
               nextOrderId: id + 1,
            }
         })
         return createdId < 0 ? null : createdId
      },
      [catalog, refresh, useApi]
   )

   const acceptOrder = useCallback(
      async (orderId: number): Promise<AcceptResult> => {
         if (useApi) {
            try {
               const res = await acceptOrderApi(orderId)
               await refresh()
               if (!res.ok) {
                  return {
                     ok: false,
                     error: res.error ?? "Nie udało się przyjąć zamówienia.",
                     shortage: res.shortage?.map(s => ({ product_id: s.product_Id, missing: s.missing })),
                  }
               }
               return { ok: true }
            } catch (err) {
               const message = err instanceof ApiError ? err.message : "Nie udało się przyjąć zamówienia."
               return { ok: false, error: message }
            }
         }

         let result: AcceptResult = { ok: false, error: "Nie znaleziono zamówienia." }

         setOperational(prev => {
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
      },
      [catalog, refresh, useApi]
   )

   const removeOrder = useCallback(
      async (orderId: number) => {
         if (useApi) {
            try {
               await deleteOrderApi(orderId)
               await refresh()
            } catch (err) {
               throw err
            }
            return
         }
         setOperational(prev => ({
            ...prev,
            orders: prev.orders.filter(o => o.id !== orderId),
            order_items: prev.order_items.filter(i => i.order_id !== orderId),
         }))
      },
      [refresh, useApi]
   )

   const updateOrderStatus = useCallback(
      async (orderId: number, status: OrderStatus) => {
         if (useApi) {
            try {
               await updateOrderStatusApi(orderId, status)
               await refresh()
            } catch (err) {
               throw err
            }
            return
         }
         setOperational(prev => ({
            ...prev,
            orders: prev.orders.map(o => (o.id === orderId ? { ...o, status } : o)),
         }))
      },
      [refresh, useApi]
   )

   const receiveDeliveryItems = useCallback((items: StoredDeliveryItem[]) => {
      if (items.length === 0 || useApi) return
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
   }, [useApi])

   const value = useMemo(
      () =>
         ({
            ready,
            loadError,
            recipeCatalogRevision,
            stock: operational.stock,
            orders: operational.orders,
            order_items: operational.order_items,
            activeRecipesPicklist,
            refresh,
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
         loadError,
         ready,
         refresh,
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
