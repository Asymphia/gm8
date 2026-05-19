import { apiRequest } from "@/lib/api/client"
import type {
   InventoryCompleteRequest,
   InventoryCreateRequest,
   InventoryDto,
   InventoryItemRequest,
} from "@/lib/api/types"
import type { InventoryOperation, InventoryOperationLine } from "@/lib/inventory-operations"
import type { ProductCatalogRow } from "@/lib/mock-db"
import type { StockRow } from "@/lib/mock-db"

export async function fetchInventories(): Promise<InventoryDto[]> {
   return apiRequest<InventoryDto[]>("/api/Inventory")
}

export async function fetchInventoryById(id: number): Promise<InventoryDto> {
   return apiRequest<InventoryDto>(`/api/Inventory/${id}`)
}

export async function completeInventory(
   inventoryId: number,
   items: InventoryCompleteRequest["items"]
): Promise<InventoryDto> {
   return apiRequest<InventoryDto>(`/api/Inventory/${inventoryId}/complete`, {
      method: "POST",
      body: { items },
   })
}

export function buildStocktakingRows(stock: StockRow[], products: ProductCatalogRow[]) {
   return stock.map(row => {
      const product = products.find(p => p.id === row.product_id)
      return {
         stockId: row.id,
         product: product?.name ?? `Produkt #${row.product_id}`,
         unit: product?.unit ?? "pcs",
         systemQuantity: row.quantity,
         realQuantity: row.quantity,
      }
   })
}

export function inventoryDtoToOperation(
   dto: InventoryDto,
   stock: StockRow[],
   products: ProductCatalogRow[]
): InventoryOperation {
   const details: InventoryOperationLine[] = dto.items.map(item => {
      const stockRow = stock.find(s => s.id === item.stock_Id)
      const product = products.find(p => p.id === stockRow?.product_id)
      const unit = product?.unit ?? "pcs"
      const delta = Number((item.realQuantity - item.systemQuantity).toFixed(2))
      return {
         product: product?.name ?? `Produkt #${item.stock_Id}`,
         unit,
         systemBefore: item.systemQuantity,
         realCounted: item.realQuantity,
         systemAfter: item.realQuantity,
         delta,
      }
   })
   const summary = details
      .filter(d => d.delta !== 0)
      .slice(0, 3)
      .map(d => `${d.product} (${d.delta > 0 ? "+" : ""}${d.delta} ${d.unit})`)
      .join(", ")
   return {
      id: `inv-${dto.id}`,
      createdAt: dto.completedAt ?? dto.startedAt,
      changedItems: details.filter(d => d.delta !== 0).length,
      summary: summary || "Bez zmian",
      details,
   }
}

export async function runStocktakingCorrection(
   stock: StockRow[],
   products: ProductCatalogRow[],
   rows: { stockId: number; systemQuantity: number; realQuantity: number }[]
): Promise<{ inventoryId: number; operation: InventoryOperation }> {
   const items: InventoryItemRequest[] = rows.map(r => ({
      stock_Id: r.stockId,
      systemQuantity: r.systemQuantity,
      realQuantity: r.realQuantity,
   }))
   const created = await apiRequest<InventoryDto>("/api/Inventory", {
      method: "POST",
      body: { items } satisfies InventoryCreateRequest,
   })
   const completed = await apiRequest<InventoryDto>(`/api/Inventory/${created.id}/complete`, {
      method: "POST",
      body: { items } satisfies InventoryCompleteRequest,
   })
   return { inventoryId: completed.id, operation: inventoryDtoToOperation(completed, stock, products) }
}
