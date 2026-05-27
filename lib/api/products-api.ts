import { apiRequest } from "@/lib/api/client"
import { productDtoToRow, productUnitToApi } from "@/lib/api/mappers"
import type { ProductCatalogRow, ProductUnit } from "@/lib/mock-db"
import type { ProductCreateRequest, ProductDto, ProductUpdateRequest } from "@/lib/api/types"

export async function fetchProducts(): Promise<ProductCatalogRow[]> {
   const list = await apiRequest<ProductDto[]>("/api/Product")
   return list.map(productDtoToRow).filter(p => p.is_active)
}

export async function createProduct(payload: {
   name: string
   unit: ProductUnit
   isActive?: boolean
}): Promise<ProductCatalogRow> {
   const body: ProductCreateRequest = {
      name: payload.name.trim(),
      unit: productUnitToApi(payload.unit),
      isActive: payload.isActive ?? true,
   }
   const dto = await apiRequest<ProductDto>("/api/Product", { method: "POST", body })
   return productDtoToRow(dto)
}

export async function updateProduct(
   id: number,
   payload: { name?: string; unit?: ProductUnit; isActive?: boolean }
): Promise<ProductCatalogRow> {
   const body: ProductUpdateRequest = {}
   if (payload.name !== undefined) body.name = payload.name.trim()
   if (payload.unit !== undefined) body.unit = productUnitToApi(payload.unit)
   if (payload.isActive !== undefined) body.isActive = payload.isActive
   const dto = await apiRequest<ProductDto>(`/api/Product/${id}`, { method: "PUT", body })
   return productDtoToRow(dto)
}

export async function deactivateProduct(id: number): Promise<void> {
   await apiRequest<void>(`/api/Product/${id}`, { method: "DELETE" })
}
