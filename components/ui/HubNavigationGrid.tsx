import Link from "next/link"

export interface HubNavigationItem {
   href: string
   label: string
   description: string
   value: string
}

export function HubNavigationGrid({ items }: { items: HubNavigationItem[] }) {
   return (
      <div className="grid gap-3 sm:grid-cols-2">
         {items.map(link => (
            <Link
               key={link.href}
               href={link.href}
               className="group rounded-sm border border-border-300 bg-background p-4 transition-colors hover:border-primary-300 hover:bg-foreground"
            >
               <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-text-700 group-hover:text-primary-500 text-sm font-medium">{link.label}</p>
                  <span className="bg-foreground text-text-500 shrink-0 rounded-full px-2 py-0.5 text-xs">{link.value}</span>
               </div>
               <p className="text-text-500 text-xs">{link.description}</p>
            </Link>
         ))}
      </div>
   )
}
