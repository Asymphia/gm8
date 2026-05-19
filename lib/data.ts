export interface EmployeeType {
   id?: string
   name: string
   surname: string
   phone: string
   email: string
   active: boolean
   roles?: string[]
}

export interface ProductCatalog {
   name: string
   unit: string
   isActive: boolean
}

import { mockDb } from "@/lib/mock-db"

export const DUMMY_PRODUCT_CATALOG_DATA: ProductCatalog[] = mockDb.product_catalog.map(product => ({
   name: product.name,
   unit: product.unit.toUpperCase(),
   isActive: product.is_active,
}))

export const DUMMY_EMPLOYEE_DATA: EmployeeType[] = mockDb.users.map(user => ({
   name: user.first_name,
   surname: user.last_name,
   phone: user.phone,
   email: user.email,
   active: user.is_active,
}))
