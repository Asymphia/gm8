export interface UserDto {
   id: string
   userName: string
   firstName: string
   lastName: string
   email: string
   isActive: boolean
   roles: string[]
}

export interface UserAuthDto {
   accessToken: string
   refreshToken: string
   accessTokenExpiresAtUtc: string
   user: UserDto
}

export interface UserLoginRequest {
   email: string
   password: string
}

export interface UserCreateRequest {
   userName: string
   firstName: string
   lastName: string
   email: string
   password: string
   roles?: string[] | null
   isActive?: boolean
}

export interface UserUpdateRequest {
   userName?: string | null
   firstName?: string | null
   lastName?: string | null
   email?: string | null
   isActive?: boolean | null
   roles?: string[] | null
}

export interface ScheduleDto {
   id: number
   date: string
   startTime: string | null
   endTime: string | null
   note: string
   user_Id: string
   createdAt: string
   lastUpdatedAt: string
}

export interface ScheduleCreateRequest {
   date: string
   startTime: string
   endTime: string
   note?: string | null
   user_Id?: string | null
}

export interface ScheduleUpdateRequest {
   date?: string | null
   startTime?: string | null
   endTime?: string | null
   note?: string | null
   user_Id?: string | null
}

export interface AnnouncementDto {
   id: number
   title: string
   content: string
   isPublished: boolean
   user_Id: string
   createdAt: string
   lastUpdatedAt: string
}

export interface AnnouncementCreateRequest {
   title: string
   content: string
   isPublished: boolean
   user_Id?: string | null
}

export interface AnnouncementUpdateRequest {
   title?: string | null
   content?: string | null
   isPublished?: boolean | null
}

export type ApiUnit = "Kilogram" | "Gram" | "Liter" | "Milliliter" | "Piece" | "Package"
export type ApiOrderStatus = "New" | "Accepted" | "InProgress" | "Done" | "Cancelled"
export type ApiDeliveryStatus = "Pending" | "InTransit" | "Delivered" | "Failed"
export type ApiInventoryStatus = "Active" | "Inactive" | "Archived"

export interface ProductDto {
   id: number
   name: string
   unit: ApiUnit
   isActive: boolean
   createdAt: string
   lastUpdatedAt: string
}

export interface ProductCreateRequest {
   name: string
   unit: ApiUnit
   isActive?: boolean
}

export interface ProductUpdateRequest {
   name?: string | null
   unit?: ApiUnit | null
   isActive?: boolean | null
}

export interface StockDto {
   id: number
   product_Id: number
   quantity: number
   expiryDate: string | null
   supplierName: string
   createdAt: string
   lastUpdatedAt: string
}

export interface StockCreateRequest {
   product_Id: number
   quantity: number
   expiryDate?: string | null
   supplierName?: string
}

export interface RecipeIngredientDto {
   id: number
   product_Id: number
   quantity_Per_Portion: number
}

export interface RecipeDto {
   id: number
   name: string
   isActive: boolean
   ingredients: RecipeIngredientDto[]
   createdAt: string
   lastUpdatedAt: string
}

export interface RecipeIngredientRequest {
   product_Id: number
   quantity_Per_Portion: number
}

export interface RecipeCreateRequest {
   name: string
   isActive?: boolean
   ingredients: RecipeIngredientRequest[]
}

export interface RecipeUpdateRequest {
   name?: string | null
   isActive?: boolean | null
   ingredients?: RecipeIngredientRequest[] | null
}

export interface OrderItemDto {
   id: number
   recipe_Id: number
   portions: number
}

export interface OrderDto {
   id: number
   createdAt: string
   status: ApiOrderStatus
   user_Id: string
   items: OrderItemDto[]
   lastUpdatedAt: string
}

export interface OrderItemRequest {
   recipe_Id: number
   portions: number
}

export interface OrderCreateRequest {
   user_Id: string
   items: OrderItemRequest[]
}

export interface OrderStatusUpdateRequest {
   status: ApiOrderStatus
}

export interface OrderAcceptDto {
   ok: boolean
   error?: string | null
   shortage?: { product_Id: number; missing: number }[] | null
}

export interface DeliveryItemDto {
   id: number
   product_Id: number
   quantity: number
   expiryDate: string | null
   supplierName: string
}

export interface DeliveryDto {
   id: number
   deliveredAt: string | null
   type: ApiDeliveryStatus
   supplierName: string
   isAccepted: boolean
   kind: string
   items: DeliveryItemDto[]
   createdAt: string
   lastUpdatedAt: string
}

export interface DeliveryItemRequest {
   product_Id: number
   quantity: number
   expiryDate?: string | null
   supplierName?: string
}

export interface DeliveryCreateRequest {
   supplierName: string
   kind?: string
   type?: ApiDeliveryStatus
   deliveredAt?: string | null
   items: DeliveryItemRequest[]
}

export interface InventoryItemDto {
   id: number
   stock_Id: number
   systemQuantity: number
   realQuantity: number
}

export interface InventoryDto {
   id: number
   startedAt: string
   completedAt: string | null
   status: ApiInventoryStatus
   items: InventoryItemDto[]
   createdAt: string
   lastUpdatedAt: string
}

export interface InventoryItemRequest {
   stock_Id: number
   systemQuantity: number
   realQuantity: number
}

export interface InventoryCreateRequest {
   items: InventoryItemRequest[]
}

export interface InventoryCompleteRequest {
   items: InventoryItemRequest[]
}

export interface ApiProblemDetails {
   title?: string
   detail?: string
   status?: number
   errors?: Record<string, string[]>
}
