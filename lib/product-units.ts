import type { ProductUnit } from "@/lib/mock-db"

export const PRODUCT_UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
   { value: "kg", label: "kg (kilogram)" },
   { value: "l", label: "l (litr)" },
   { value: "pcs", label: "szt. (sztuka)" },
   { value: "pack", label: "opak. (opakowanie)" },
]

export function parseProductUnitInput(raw: string): ProductUnit {
   const n = raw.trim().toLowerCase()
   if (n === "kg" || n.startsWith("kil")) return "kg"
   if (n === "l" || n.startsWith("lit")) return "l"
   if (n === "pack" || n.startsWith("opak")) return "pack"
   return "pcs"
}

export function productUnitLabel(unit: ProductUnit): string {
   return PRODUCT_UNIT_OPTIONS.find(o => o.value === unit)?.label.split(" ")[0] ?? unit
}
