import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"

const ANNOUNCEMENTS = [
   { title: "Tomorrow inventory check", author: "Manager", publishedAt: "2026-05-07 14:00" },
   { title: "Updated hygiene checklist", author: "Quality lead", publishedAt: "2026-05-06 18:30" },
   { title: "Weekend staffing update", author: "HR", publishedAt: "2026-05-05 12:00" },
]

const hubItems = [
   {
      href: "/notifications",
      label: "Announcements feed",
      description: "Published posts and timestamps in chronological order.",
      value: String(ANNOUNCEMENTS.length),
   },
   {
      href: "/notifications/board",
      label: "Board",
      description: "Operational board view for posts and pinning mock.",
      value: "Open",
   },
]

const NotificationPage = () => {
   return (
      <div className="space-y-6">
         <div>
            <h1>Announcements</h1>
            <p className="text-text-500 mt-1">Publication overview — same hub card layout as other modules.</p>
         </div>
         <HubNavigationGrid items={hubItems} />
         <div className="space-y-3">
            {ANNOUNCEMENTS.map(item => (
               <article key={item.title} className="rounded-sm border border-border-300 bg-background p-4">
                  <p className="text-text-700 font-medium">{item.title}</p>
                  <p className="text-sm text-text-500">
                     {item.author} · {item.publishedAt}
                  </p>
               </article>
            ))}
         </div>
      </div>
   )
}

export default NotificationPage
