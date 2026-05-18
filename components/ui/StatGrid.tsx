import type { ReactNode } from "react"

export interface StatItem {
   label: string
   value: ReactNode
   valueClassName?: string
}

export function StatGrid({ items }: { items: StatItem[] }) {
   return (
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
         {items.map(item => (
            <article
               key={item.label}
               className="rounded-sm border border-border-300 bg-background p-3 sm:p-4"
            >
               <p className="text-text-300 text-[10px] font-medium uppercase tracking-wide sm:text-xs">{item.label}</p>
               <p className={`text-text-700 mt-1 text-lg font-semibold tabular-nums sm:text-xl ${item.valueClassName ?? ""}`}>
                  {item.value}
               </p>
            </article>
         ))}
      </div>
   )
}
