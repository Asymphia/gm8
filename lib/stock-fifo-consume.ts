import type { StockRow } from "@/lib/mock-db"

export interface StockDemand {
   product_id: number
   quantity: number
}

export interface StockShortage {
   product_id: number
   missing: number
}

const roundQty = (value: number) => Number(value.toFixed(5))

/** Aggregate duplicate product IDs into one demand per product (kitchen / cashier totals). */
export function mergeStockDemands(raw: StockDemand[]): StockDemand[] {
   const acc = new Map<number, number>()
   for (const d of raw) {
      acc.set(d.product_id, (acc.get(d.product_id) ?? 0) + d.quantity)
   }
   return [...acc.entries()].map(([product_id, quantity]) => ({ product_id, quantity: roundQty(quantity) }))
}

/** Earliest-expiry FIFO per product — returns new lines array without mutating the input */
export function consumeStockFifo(orig: StockRow[], demands: StockDemand[]): { ok: true; lines: StockRow[] } | { ok: false; lines: StockRow[]; shortage: StockShortage[] } {
   const merged = mergeStockDemands(demands).filter(d => d.quantity > 1e-7)
   const lines = orig.map(row => ({ ...row }))

   for (const demand of merged) {
      let remaining = roundQty(Math.max(demand.quantity, 0))
      if (remaining <= 0) continue

      const candidates = lines
         .filter(l => l.product_id === demand.product_id && l.quantity > 1e-7)
         .sort((a, b) => {
            const ea = `${a.expiry_date}T12:00:00Z`
            const eb = `${b.expiry_date}T12:00:00Z`
            return new Date(ea).getTime() - new Date(eb).getTime()
         })

      for (const row of candidates) {
         const take = Math.min(row.quantity, remaining)
         row.quantity = roundQty(row.quantity - take)
         remaining = roundQty(remaining - take)
         if (remaining <= 1e-7) break
      }

      if (remaining > 1e-6) {
         return {
            ok: false,
            lines: orig.map(r => ({ ...r })),
            shortage: [{ product_id: demand.product_id, missing: roundQty(remaining) }],
         }
      }
   }

   return { ok: true, lines }
}
