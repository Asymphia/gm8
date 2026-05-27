"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { isApiEnabled } from "@/lib/api/config"
import { getAccessToken } from "@/lib/api/tokens"
import { ApiError } from "@/lib/api/client"
import {
   createProduct as createProductApi,
   deactivateProduct as deactivateProductApi,
   fetchProducts,
   updateProduct as updateProductApi,
} from "@/lib/api/products-api"
import { mockDb, type ProductCatalogRow, type ProductUnit } from "@/lib/mock-db"

interface ProductCatalogContextValue {
   ready: boolean
   loadError: string | null
   products: ProductCatalogRow[]
   refresh: () => Promise<void>
   productById: (id: number) => ProductCatalogRow | undefined
   addProduct: (payload: { name: string; unit: ProductUnit }) => Promise<void>
   updateProduct: (id: number, payload: { name: string; unit: ProductUnit }) => Promise<void>
   removeProducts: (ids: number[]) => Promise<void>
}

const ProductCatalogContext = createContext<ProductCatalogContextValue | null>(null)

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
   const { session } = useAuth()
   const [ready, setReady] = useState(false)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [products, setProducts] = useState<ProductCatalogRow[]>(() => mockDb.product_catalog.map(p => ({ ...p })))

   const refresh = useCallback(async () => {
      if (isApiEnabled()) {
         if (!session || !getAccessToken()) return
         try {
            const list = await fetchProducts()
            setProducts(list)
            setLoadError(null)
         } catch (err) {
            setLoadError(err instanceof ApiError ? err.message : "Nie udało się pobrać produktów.")
         }
      } else {
         setProducts(mockDb.product_catalog.map(p => ({ ...p })))
         setLoadError(null)
      }
   }, [session])

   useEffect(() => {
      void refresh().finally(() => setReady(true))
   }, [refresh, session])

   const productById = useCallback((id: number) => products.find(p => p.id === id), [products])

   const addProduct = useCallback(
      async (payload: { name: string; unit: ProductUnit }) => {
         const name = payload.name.trim()
         if (!name) throw new Error("Podaj nazwę produktu.")
         if (isApiEnabled()) {
            const row = await createProductApi({ name, unit: payload.unit })
            setProducts(prev => [...prev, row].sort((a, b) => a.name.localeCompare(b.name, "pl")))
            setLoadError(null)
            return
         }
         const nextId = products.length === 0 ? 1 : Math.max(...products.map(p => p.id)) + 1
         setProducts(prev => [...prev, { id: nextId, name, unit: payload.unit, is_active: true }])
      },
      [products]
   )

   const updateProduct = useCallback(
      async (id: number, payload: { name: string; unit: ProductUnit }) => {
         const name = payload.name.trim()
         if (!name) throw new Error("Podaj nazwę produktu.")
         if (isApiEnabled()) {
            const row = await updateProductApi(id, { name, unit: payload.unit })
            setProducts(prev => prev.map(p => (p.id === id ? row : p)))
            setLoadError(null)
            return
         }
         setProducts(prev =>
            prev.map(p => (p.id === id ? { ...p, name, unit: payload.unit } : p))
         )
      },
      []
   )

   const removeProducts = useCallback(
      async (ids: number[]) => {
         if (ids.length === 0) return
         if (isApiEnabled()) {
            for (const id of ids) {
               await deactivateProductApi(id)
            }
            await refresh()
            setLoadError(null)
            return
         }
         setProducts(prev => prev.filter(p => !ids.includes(p.id)))
      },
      [refresh]
   )

   const value = useMemo(
      () => ({
         ready,
         loadError,
         products,
         refresh,
         productById,
         addProduct,
         updateProduct,
         removeProducts,
      }),
      [ready, loadError, products, refresh, productById, addProduct, updateProduct, removeProducts]
   )

   return <ProductCatalogContext.Provider value={value}>{children}</ProductCatalogContext.Provider>
}

export function useProductCatalog(): ProductCatalogContextValue {
   const ctx = useContext(ProductCatalogContext)
   if (!ctx) throw new Error("useProductCatalog must be used inside ProductCatalogProvider")
   return ctx
}
