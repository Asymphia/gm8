import { apiRequest } from "@/lib/api/client"
import { stockDtoToRow } from "@/lib/api/mappers"
import type { StockRow } from "@/lib/mock-db"
import type { StockDto } from "@/lib/api/types"

export async function fetchStock(): Promise<StockRow[]> {
   const list = await apiRequest<StockDto[]>("/api/Stock")
   return list.map(stockDtoToRow)
}
