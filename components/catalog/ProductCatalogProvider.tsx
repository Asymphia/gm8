"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { isApiEnabled } from "@/lib/api/config"
import { getAccessToken } from "@/lib/api/tokens"
import { ApiError } from "@/lib/api/client"
import { fetchProducts } from "@/lib/api/products-api"
import { mockDb, type ProductCatalogRow } from "@/lib/mock-db"

interface ProductCatalogContextValue {
   ready: boolean
   loadError: string | null
   products: ProductCatalogRow[]
   refresh: () => Promise<void>
   productById: (id: number) => ProductCatalogRow | undefined
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

   const value = useMemo(
      () => ({ ready, loadError, products, refresh, productById }),
      [ready, loadError, products, refresh, productById]
   )

   return <ProductCatalogContext.Provider value={value}>{children}</ProductCatalogContext.Provider>
}

export function useProductCatalog(): ProductCatalogContextValue {
   const ctx = useContext(ProductCatalogContext)
   if (!ctx) throw new Error("useProductCatalog must be used inside ProductCatalogProvider")
   return ctx
}
