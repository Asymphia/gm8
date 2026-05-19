import { apiRequest } from "@/lib/api/client"
import { operationalFromApi, orderStatusToApi } from "@/lib/api/mappers"
import type { OperationalPersisted } from "@/lib/operational-mock-storage"
import type { OrderStatus } from "@/lib/mock-db"
import type {
   OrderAcceptDto,
   OrderCreateRequest,
   OrderDto,
   OrderStatusUpdateRequest,
   StockDto,
} from "@/lib/api/types"

export async function fetchOperationalSnapshot(): Promise<OperationalPersisted> {
   const [stock, orders] = await Promise.all([
      apiRequest<StockDto[]>("/api/Stock"),
      apiRequest<OrderDto[]>("/api/Order"),
   ])
   return operationalFromApi(stock, orders)
}

export async function createOrder(userId: string, recipeId: number, portions: number): Promise<OrderDto> {
   const body: OrderCreateRequest = {
      user_Id: userId,
      items: [{ recipe_Id: recipeId, portions: Math.floor(portions) }],
   }
   return apiRequest<OrderDto>("/api/Order", { method: "POST", body })
}

export async function acceptOrderApi(orderId: number): Promise<OrderAcceptDto> {
   return apiRequest<OrderAcceptDto>(`/api/Order/${orderId}/accept`, { method: "POST" })
}

export async function updateOrderStatusApi(orderId: number, status: OrderStatus): Promise<OrderDto> {
   const body: OrderStatusUpdateRequest = { status: orderStatusToApi(status) }
   return apiRequest<OrderDto>(`/api/Order/${orderId}/status`, { method: "PATCH", body })
}

export async function deleteOrderApi(orderId: number): Promise<void> {
   await apiRequest<void>(`/api/Order/${orderId}`, { method: "DELETE" })
}
