export type UserRole = "admin" | "manager" | "employee"
export type OrderStatus = "new" | "accepted" | "in_progress" | "done" | "cancelled"
export type DeliveryType = "supplier" | "internal_transfer"
export type InventoryStatus = "open" | "completed" | "cancelled"
export type ProductUnit = "kg" | "l" | "pcs" | "pack"

export interface UserRow {
   id: number
   first_name: string
   last_name: string
   email: string
   phone: string
   password_hash: string
   role: UserRole
   is_active: boolean
}

export interface ScheduleRow {
   id: number
   date: string
   start_time: string
   end_time: string
   note: string
   user_id: number
}

export interface AnnouncementRow {
   id: number
   title: string
   content: string
   created_at: string
   timestamp_updated_at: string
   is_published: boolean
   user_id: number
}

export interface DeliveryRow {
   id: number
   delivered_at: string
   type: DeliveryType
   user_id: number
}

export interface DeliveryItemRow {
   delivery_id: number
   product_id: number
   quantity: number
   expiry_date: string
   supplier_name: string
}

export interface ProductCatalogRow {
   id: number
   name: string
   unit: ProductUnit
   is_active: boolean
}

export interface StockRow {
   id: number
   quantity: number
   expiry_date: string
   supplier_name: string
   product_id: number
}

export interface RecipeRow {
   id: number
   name: string
   is_active: boolean
}

export interface RecipeIngredientRow {
   recipe_id: number
   product_id: number
   quantity_per_portion: number
}

export interface OrderRow {
   id: number
   created_at: string
   status: OrderStatus
   user_id: number
}

export interface OrderItemRow {
   order_id: number
   recipe_id: number
   portions: number
}

export interface InventoryRow {
   id: number
   started_at: string
   completed_at: string | null
   status: InventoryStatus
   user_id: number
}

export interface InventoryItemRow {
   inventory_id: number
   stock_id: number
   system_quantity: number
   real_quantity: number
}

export const mockDb = {
   users: [
      {
         id: 1,
         first_name: "Anna",
         last_name: "Kowalska",
         email: "anna.kowalska@example.com",
         phone: "+48 512 100 001",
         password_hash: "mock_hash_anna",
         role: "manager",
         is_active: true,
      },
      {
         id: 2,
         first_name: "Piotr",
         last_name: "Nowak",
         email: "piotr.nowak@example.com",
         phone: "+48 512 100 002",
         password_hash: "mock_hash_piotr",
         role: "employee",
         is_active: true,
      },
      {
         id: 3,
         first_name: "Maria",
         last_name: "Wisniewska",
         email: "maria.wisniewska@example.com",
         phone: "+48 512 100 003",
         password_hash: "mock_hash_maria",
         role: "employee",
         is_active: false,
      },
   ] as UserRow[],
   schedules: [
      { id: 1, date: "2026-05-05", start_time: "06:00", end_time: "14:00", note: "Morning prep", user_id: 1 },
      { id: 2, date: "2026-05-06", start_time: "07:30", end_time: "15:30", note: "Training shift", user_id: 2 },
      { id: 3, date: "2026-05-07", start_time: "06:00", end_time: "22:00", note: "Split — prep + close", user_id: 1 },
      { id: 4, date: "2026-05-08", start_time: "08:00", end_time: "16:00", note: "Front house", user_id: 2 },
      { id: 5, date: "2026-05-09", start_time: "06:00", end_time: "14:00", note: "Weekend brunch", user_id: 3 },
      { id: 6, date: "2026-05-09", start_time: "13:00", end_time: "21:00", note: "Service", user_id: 2 },
      { id: 7, date: "2026-05-10", start_time: "10:00", end_time: "18:00", note: "Sunday cover", user_id: 1 },
      { id: 8, date: "2026-05-12", start_time: "06:00", end_time: "14:00", note: "Morning prep", user_id: 1 },
      { id: 9, date: "2026-05-12", start_time: "14:00", end_time: "22:00", note: "Service", user_id: 2 },
      { id: 10, date: "2026-05-13", start_time: "06:00", end_time: "14:00", note: "Stock check", user_id: 3 },
   ] as ScheduleRow[],
   announcements: [
      {
         id: 1,
         title: "Tomorrow inventory check",
         content: "Inventory starts at 7:00.",
         created_at: "2026-05-07T14:00:00Z",
         timestamp_updated_at: "2026-05-07T14:00:00Z",
         is_published: true,
         user_id: 1,
      },
      {
         id: 2,
         title: "Updated hygiene checklist",
         content: "Please review the new procedure.",
         created_at: "2026-05-06T18:30:00Z",
         timestamp_updated_at: "2026-05-06T18:45:00Z",
         is_published: true,
         user_id: 1,
      },
   ] as AnnouncementRow[],
   product_catalog: [
      { id: 1, name: "Fresh Milk 2%", unit: "l", is_active: true },
      { id: 2, name: "Brown Eggs M", unit: "pack", is_active: true },
      { id: 3, name: "Cheddar Cheese", unit: "kg", is_active: true },
      { id: 4, name: "Olive Oil Extra Virgin", unit: "l", is_active: true },
      { id: 5, name: "Sea Salt", unit: "kg", is_active: true },
   ] as ProductCatalogRow[],
   deliveries: [
      { id: 101, delivered_at: "2026-05-07T07:30:00Z", type: "supplier", user_id: 1 },
      { id: 102, delivered_at: "2026-05-06T07:15:00Z", type: "supplier", user_id: 2 },
   ] as DeliveryRow[],
   delivery_items: [
      { delivery_id: 101, product_id: 1, quantity: 20, expiry_date: "2026-05-10", supplier_name: "FreshFarm" },
      { delivery_id: 101, product_id: 2, quantity: 12, expiry_date: "2026-05-18", supplier_name: "FreshFarm" },
      { delivery_id: 102, product_id: 3, quantity: 8, expiry_date: "2026-05-20", supplier_name: "Bakery Hub" },
   ] as DeliveryItemRow[],
   recipes: [
      { id: 201, name: "Classic Carbonara", is_active: true },
      { id: 202, name: "Tomato Soup", is_active: true },
      { id: 203, name: "Greek Salad", is_active: true },
   ] as RecipeRow[],
   recipe_ingredients: [
      { recipe_id: 201, product_id: 2, quantity_per_portion: 0.25 },
      { recipe_id: 201, product_id: 3, quantity_per_portion: 0.08 },
      { recipe_id: 201, product_id: 5, quantity_per_portion: 0.008 },
      { recipe_id: 202, product_id: 5, quantity_per_portion: 0.012 },
      { recipe_id: 202, product_id: 4, quantity_per_portion: 0.03 },
      { recipe_id: 202, product_id: 1, quantity_per_portion: 0.18 },
      { recipe_id: 203, product_id: 4, quantity_per_portion: 0.02 },
      { recipe_id: 203, product_id: 3, quantity_per_portion: 0.06 },
      { recipe_id: 203, product_id: 2, quantity_per_portion: 0.12 },
      { recipe_id: 203, product_id: 5, quantity_per_portion: 0.004 },
   ] as RecipeIngredientRow[],
   orders: [
      { id: 301, created_at: "2026-05-07T08:26:00Z", status: "new", user_id: 1 },
      { id: 302, created_at: "2026-05-07T08:43:00Z", status: "new", user_id: 2 },
      { id: 303, created_at: "2026-05-07T09:05:00Z", status: "new", user_id: 1 },
   ] as OrderRow[],
   order_items: [
      { order_id: 301, recipe_id: 201, portions: 2 },
      { order_id: 302, recipe_id: 202, portions: 1 },
      { order_id: 303, recipe_id: 203, portions: 3 },
   ] as OrderItemRow[],
   stock: [
      { id: 401, quantity: 11, expiry_date: "2026-05-20", supplier_name: "Bakery Hub", product_id: 3 },
      { id: 402, quantity: 18, expiry_date: "2026-08-01", supplier_name: "Olive Trade", product_id: 4 },
      { id: 403, quantity: 9, expiry_date: "2027-01-10", supplier_name: "Salt Masters", product_id: 5 },
      { id: 404, quantity: 30, expiry_date: "2026-06-01", supplier_name: "FreshFarm", product_id: 1 },
      { id: 405, quantity: 48, expiry_date: "2026-05-30", supplier_name: "FreshFarm", product_id: 2 },
      { id: 406, quantity: 6, expiry_date: "2026-05-09", supplier_name: "Salt Masters", product_id: 5 },
   ] as StockRow[],
   inventories: [
      { id: 501, started_at: "2026-05-07T06:00:00Z", completed_at: "2026-05-07T07:00:00Z", status: "completed", user_id: 1 },
   ] as InventoryRow[],
   inventory_items: [
      { inventory_id: 501, stock_id: 401, system_quantity: 11, real_quantity: 10 },
      { inventory_id: 501, stock_id: 402, system_quantity: 18, real_quantity: 18 },
      { inventory_id: 501, stock_id: 403, system_quantity: 9, real_quantity: 7 },
   ] as InventoryItemRow[],
}
