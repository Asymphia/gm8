import type { AppRole } from "@/lib/auth"
import type {
   AnnouncementRow,
   OrderItemRow,
   OrderRow,
   OrderStatus,
   ProductCatalogRow,
   ProductUnit,
   RecipeIngredientRow,
   RecipeRow,
   StockRow,
} from "@/lib/mock-db"
import type { StoredDelivery, StoredDeliveryItem } from "@/lib/deliveries-storage"
import type { RecipeCatalogPersisted } from "@/lib/recipe-catalog-storage"
import type { PlannerShift } from "@/lib/schedule-planner-storage"
import type {
   AnnouncementDto,
   ApiOrderStatus,
   ApiUnit,
   DeliveryDto,
   OrderDto,
   ProductDto,
   RecipeDto,
   ScheduleDto,
   StockDto,
   UserDto,
} from "@/lib/api/types"
import type { OperationalPersisted } from "@/lib/operational-mock-storage"

export function mapApiRolesToAppRole(roles: string[]): AppRole {
   const normalized = roles.map(r => r.toLowerCase())
   if (normalized.includes("admin")) return "owner"
   return "employee"
}

export function appRoleToApiRoles(appRole: AppRole): string[] {
   return appRole === "owner" ? ["Admin"] : ["Employee"]
}

export function normalizeTimeSpan(value: string | null | undefined): string {
   if (!value) return "00:00"
   const trimmed = value.trim()
   const match = /^(\d{1,2}):(\d{2})/.exec(trimmed)
   if (!match) return trimmed.slice(0, 5)
   const h = String(Number.parseInt(match[1], 10)).padStart(2, "0")
   const m = match[2]
   return `${h}:${m}`
}

export function normalizeApiDate(value: string): string {
   const d = new Date(value)
   if (Number.isNaN(d.getTime())) {
      const dateOnly = value.slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : value
   }
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, "0")
   const day = String(d.getDate()).padStart(2, "0")
   return `${y}-${m}-${day}`
}

export function scheduleDtoToPlannerShift(dto: ScheduleDto): PlannerShift {
   return {
      id: dto.id,
      date: normalizeApiDate(dto.date),
      start_time: normalizeTimeSpan(dto.startTime),
      end_time: normalizeTimeSpan(dto.endTime),
      note: dto.note ?? "",
      user_id: dto.user_Id,
   }
}

export function plannerShiftToCreateRequest(shift: Omit<PlannerShift, "id">): {
   date: string
   startTime: string
   endTime: string
   note: string | null
   user_Id: string
} {
   return {
      date: `${shift.date}T00:00:00Z`,
      startTime: `${shift.start_time}:00`,
      endTime: `${shift.end_time}:00`,
      note: shift.note || null,
      user_Id: shift.user_id,
   }
}

export function plannerShiftToUpdateRequest(shift: Omit<PlannerShift, "id">): {
   date: string
   startTime: string
   endTime: string
   note: string | null
   user_Id: string
} {
   return plannerShiftToCreateRequest(shift)
}

export function announcementDtoToRow(dto: AnnouncementDto): AnnouncementRow {
   return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      is_published: dto.isPublished,
      user_id: dto.user_Id,
      created_at: dto.createdAt,
      timestamp_updated_at: dto.lastUpdatedAt,
   }
}

export function userDtoDisplayName(user: UserDto): string {
   return `${user.firstName} ${user.lastName}`.trim() || user.email
}

export function userNameById(users: UserDto[], userId: string): string {
   const u = users.find(row => row.id === userId)
   return u ? userDtoDisplayName(u) : `Użytkownik`
}

const UNIT_TO_API: Record<ProductUnit, ApiUnit> = {
   kg: "Kilogram",
   l: "Liter",
   pcs: "Piece",
   pack: "Package",
}

const UNIT_FROM_API: Record<ApiUnit, ProductUnit> = {
   Kilogram: "kg",
   Gram: "kg",
   Liter: "l",
   Milliliter: "l",
   Piece: "pcs",
   Package: "pack",
}

export function productUnitToApi(unit: ProductUnit): ApiUnit {
   return UNIT_TO_API[unit] ?? "Piece"
}

export function productUnitFromApi(unit: ApiUnit): ProductUnit {
   return UNIT_FROM_API[unit] ?? "pcs"
}

export function productDtoToRow(dto: ProductDto): ProductCatalogRow {
   return {
      id: dto.id,
      name: dto.name,
      unit: productUnitFromApi(dto.unit),
      is_active: dto.isActive,
   }
}

export function stockDtoToRow(dto: StockDto): StockRow {
   return {
      id: dto.id,
      product_id: dto.product_Id,
      quantity: dto.quantity,
      expiry_date: dto.expiryDate ? normalizeApiDate(dto.expiryDate) : "",
      supplier_name: dto.supplierName ?? "",
   }
}

export function recipeDtoToRows(dto: RecipeDto): { recipe: RecipeRow; ingredients: RecipeIngredientRow[] } {
   return {
      recipe: { id: dto.id, name: dto.name, is_active: dto.isActive },
      ingredients: dto.ingredients.map(i => ({
         recipe_id: dto.id,
         product_id: i.product_Id,
         quantity_per_portion: i.quantity_Per_Portion,
      })),
   }
}

export function recipeCatalogFromDtos(recipes: RecipeDto[]): RecipeCatalogPersisted {
   const rows = recipes.map(recipeDtoToRows)
   const maxId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) : 0
   return {
      recipes: rows.map(r => r.recipe),
      ingredients: rows.flatMap(r => r.ingredients),
      nextRecipeId: maxId + 1,
   }
}

const ORDER_STATUS_FROM_API: Record<ApiOrderStatus, OrderStatus> = {
   New: "new",
   Accepted: "accepted",
   InProgress: "in_progress",
   Done: "done",
   Cancelled: "cancelled",
}

const ORDER_STATUS_TO_API: Record<OrderStatus, ApiOrderStatus> = {
   new: "New",
   accepted: "Accepted",
   in_progress: "InProgress",
   done: "Done",
   cancelled: "Cancelled",
}

export function orderStatusFromApi(status: ApiOrderStatus): OrderStatus {
   return ORDER_STATUS_FROM_API[status] ?? "new"
}

export function orderStatusToApi(status: OrderStatus): ApiOrderStatus {
   return ORDER_STATUS_TO_API[status] ?? "New"
}

export function operationalFromApi(stock: StockDto[], orders: OrderDto[]): OperationalPersisted {
   const orderRows: OrderRow[] = orders.map(o => ({
      id: o.id,
      created_at: o.createdAt,
      status: orderStatusFromApi(o.status),
      user_id: 0,
   }))
   const orderItems: OrderItemRow[] = orders.flatMap(o =>
      o.items.map(i => ({
         order_id: o.id,
         recipe_id: i.recipe_Id,
         portions: i.portions,
      }))
   )
   const maxOrderId = orderRows.length > 0 ? Math.max(...orderRows.map(o => o.id)) : 0
   return {
      stock: stock.map(stockDtoToRow),
      orders: orderRows,
      order_items: orderItems,
      nextOrderId: maxOrderId + 1,
   }
}

export function deliveryDtoToStored(dto: DeliveryDto): StoredDelivery {
   const kind = (dto.kind ?? "supplier").toLowerCase()
   const type = kind === "internal_transfer" ? "internal_transfer" : "supplier"
   return {
      id: dto.id,
      delivered_at: dto.deliveredAt ?? dto.createdAt,
      type,
      supplier_name: dto.supplierName,
      status: dto.isAccepted ? "accepted" : "pending",
      items: dto.items.map(
         (i): StoredDeliveryItem => ({
            product_id: i.product_Id,
            quantity: i.quantity,
            expiry_date: i.expiryDate ? normalizeApiDate(i.expiryDate) : "",
            supplier_name: i.supplierName || dto.supplierName,
         })
      ),
   }
}
