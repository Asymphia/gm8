"use client"

import type { FeatureGroup } from "@/lib/feature-map"

interface FeatureSectionProps {
   group: FeatureGroup
}

const statusClass = {
   available: "bg-primary-500/10 text-primary-700",
   planned: "bg-foreground text-text-500",
} as const

const statusLabel = {
   available: "Dostępne",
   planned: "Planowane",
} as const

const FeatureSection = ({ group }: FeatureSectionProps) => {
   return (
      <section className="rounded-sm border border-border-300 bg-background p-6 shadow-sm">
         <div className="mb-5 flex items-center justify-between">
            <h2>{group.title}</h2>
            <span className="text-text-500 text-sm">{group.items.length} funkcji</span>
         </div>
         <div className="space-y-3">
            {group.items.map(item => (
               <article key={item.id} className="rounded-sm border border-border-300 px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                     <p className="text-text-700 font-medium">
                        {item.id} {item.title}
                     </p>
                     <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass[item.status]}`}>
                        {statusLabel[item.status]}
                     </span>
                  </div>
                  <p className="text-sm text-text-500">{item.description}</p>
               </article>
            ))}
         </div>
      </section>
   )
}

export default FeatureSection
