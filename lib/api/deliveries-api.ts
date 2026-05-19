import { apiRequest } from "@/lib/api/client"
import { deliveryDtoToStored } from "@/lib/api/mappers"
import type { StoredDelivery } from "@/lib/deliveries-storage"
import type { DeliveryCreateRequest, DeliveryDto } from "@/lib/api/types"

export async function fetchDeliveries(): Promise<StoredDelivery[]> {
   const list = await apiRequest<DeliveryDto[]>("/api/Delivery")
   return list.map(deliveryDtoToStored)
}

export async function createDelivery(payload: DeliveryCreateRequest): Promise<StoredDelivery> {
   const dto = await apiRequest<DeliveryDto>("/api/Delivery", { method: "POST", body: payload })
   return deliveryDtoToStored(dto)
}

export async function acceptDeliveryApi(deliveryId: number): Promise<StoredDelivery> {
   const dto = await apiRequest<DeliveryDto>(`/api/Delivery/${deliveryId}/accept`, { method: "POST" })
   return deliveryDtoToStored(dto)
}
