import { mockDb, type OrderItemRow, type OrderRow, type StockRow } from "@/lib/mock-db"
import type { StockDemand } from "@/lib/stock-fifo-consume"
import { loadRecipeCatalogBrowser, createSeedRecipeCatalog } from "@/lib/recipe-catalog-storage"
import type { RecipeCatalogPersisted } from "@/lib/recipe-catalog-storage"

export const OPERATIONAL_STORAGE_KEY = "gm8_operational_mock_v1"

/** Minimal ops snapshot: orders reference recipes; stock deducts on Accept from cookbook × portions */
export interface OperationalPersisted {
   stock: StockRow[]
   orders: OrderRow[]
   order_items: OrderItemRow[]
   nextOrderId: number
}

export function createSeedOperational(): OperationalPersisted {
   return {
      stock: mockDb.stock.map(s => ({ ...s })),
      orders: mockDb.orders.map(o => ({ ...o })),
      order_items: mockDb.order_items.map(i => ({ ...i })),
      nextOrderId: mockDb.orders.length > 0 ? Math.max(...mockDb.orders.map(o => o.id)) + 1 : 400,
   }
}

/** Discard legacy cashier fields when loading older localStorage */
export function normalizeOperationalPersisted(parsed: unknown): OperationalPersisted | null {
   if (
      parsed === null ||
      typeof parsed !== "object" ||
      !("stock" in parsed && "orders" in parsed && "order_items" in parsed && "nextOrderId" in parsed)
   ) {
      return null
   }
   const p = parsed as Record<string, unknown>
   if (!Array.isArray(p.stock) || !Array.isArray(p.orders) || !Array.isArray(p.order_items)) return null
   if (typeof p.nextOrderId !== "number") return null

   return {
      stock: p.stock as StockRow[],
      orders: p.orders as OrderRow[],
      order_items: p.order_items as OrderItemRow[],
      nextOrderId: p.nextOrderId,
   }
}

export function loadOperationalBrowser(): OperationalPersisted | null {
   if (typeof window === "undefined") return null
   try {
      const raw = window.localStorage.getItem(OPERATIONAL_STORAGE_KEY)
      if (!raw) return null
      return normalizeOperationalPersisted(JSON.parse(raw) as unknown)
   } catch {
      return null
   }
}

export function saveOperationalBrowser(data: OperationalPersisted): void {
   if (typeof window === "undefined") return
   window.localStorage.setItem(OPERATIONAL_STORAGE_KEY, JSON.stringify(data))
}

export function readRecipeCatalogForOps(): RecipeCatalogPersisted {
   return loadRecipeCatalogBrowser() ?? createSeedRecipeCatalog()
}

export function buildDemandsFromRecipe(catalog: RecipeCatalogPersisted, recipeId: number, portions: number): StockDemand[] {
   const portionsN = Number(portions)
   const safePortions = Number.isFinite(portionsN) && portionsN > 0 ? portionsN : 0
   return catalog.ingredients
      .filter(i => i.recipe_id === recipeId)
      .map(i => ({
         product_id: i.product_id,
         quantity: Number((i.quantity_per_portion * safePortions).toFixed(5)),
      }))
}
