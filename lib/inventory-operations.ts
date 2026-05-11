export interface InventoryOperationLine {
   product: string
   unit: string
   systemBefore: number
   realCounted: number
   systemAfter: number
   delta: number
}

export interface InventoryOperation {
   id: string
   createdAt: string
   changedItems: number
   summary: string
   /** Present for operations saved after detail support; older saves may omit. */
   details?: InventoryOperationLine[]
}

export const INVENTORY_OPERATIONS_STORAGE_KEY = "gm8_stocktaking_operations"

export function readInventoryOperations(): InventoryOperation[] {
   if (typeof window === "undefined") return []
   try {
      const saved = window.localStorage.getItem(INVENTORY_OPERATIONS_STORAGE_KEY)
      if (!saved) return []
      return JSON.parse(saved) as InventoryOperation[]
   } catch {
      return []
   }
}

export function getInventoryOperationById(id: string): InventoryOperation | undefined {
   return readInventoryOperations().find(op => op.id === id)
}
