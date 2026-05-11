export type FeatureStatus = "available" | "planned"

export interface FeatureItem {
   id: string
   title: string
   description: string
   status: FeatureStatus
}

export interface FeatureGroup {
   title: string
   route: string
   items: FeatureItem[]
}

export const APP_FEATURE_GROUPS: FeatureGroup[] = [
   {
      title: "Warehouse",
      route: "/warehouse",
      items: [
         { id: "1.1.1.1", title: "Browse product list", description: "List of products in catalog", status: "available" },
         { id: "1.1.1.2", title: "Add new product", description: "Action available as UI button", status: "planned" },
         { id: "1.1.2.1", title: "Register delivered products", description: "Log of latest deliveries", status: "planned" },
         { id: "1.1.2.2", title: "Accept delivery", description: "Approve delivery in workflow", status: "planned" },
         { id: "1.1.3.1", title: "Display stock levels", description: "Read-only stock overview", status: "available" },
         { id: "1.1.3.2", title: "Check expiration dates", description: "Products sorted by expiration", status: "planned" },
         { id: "1.1.4.1", title: "Compare system vs real state", description: "Stocktaking comparison table", status: "planned" },
         { id: "1.1.4.2", title: "Correct stock levels", description: "Manual corrections list", status: "planned" },
      ],
   },
   {
      title: "Recipes",
      route: "/recipes",
      items: [
         { id: "1.2.1.1", title: "Assign products to recipe", description: "Recipe ingredient mapping", status: "available" },
         { id: "1.2.1.2", title: "Define quantity per portion", description: "Portion quantity preview", status: "available" },
         { id: "1.2.2.1", title: "Modify existing recipes", description: "Recipe edit board", status: "available" },
         { id: "1.2.2.2", title: "Remove outdated recipes", description: "Archiving list", status: "available" },
      ],
   },
   {
      title: "Orders",
      route: "/orders",
      items: [
         { id: "1.3.1.1", title: "Choose recipe in menu", description: "Recipe selection list for order", status: "planned" },
         {
            id: "1.3.1.2",
            title: "Accept order and consume stock",
            description: "Operational order acceptance flow",
            status: "planned",
         },
         { id: "1.3.2.1", title: "Browse order list", description: "Order queue view", status: "planned" },
         { id: "1.3.2.2", title: "Edit and remove order", description: "Read-only order actions", status: "planned" },
      ],
   },
   {
      title: "Personnel & Communication",
      route: "/schedule",
      items: [
         { id: "1.4.1.1", title: "Browse employee list", description: "Employees table", status: "available" },
         { id: "1.4.1.2", title: "Add and edit employees", description: "Modal and actions present", status: "planned" },
         { id: "1.4.2", title: "Work schedule board", description: "Weekly plan overview", status: "planned" },
         { id: "1.4.3.1", title: "Publish and edit announcements", description: "Announcements board", status: "planned" },
         { id: "1.4.3.2", title: "Read announcements", description: "Team feed", status: "planned" },
      ],
   },
   {
      title: "Main Dashboard",
      route: "/",
      items: [
         { id: "1.5.1", title: "Show plan of the day", description: "Daily timeline widgets", status: "planned" },
         { id: "1.5.2", title: "Preview latest orders", description: "Latest orders card", status: "planned" },
         {
            id: "1.5.3",
            title: "Freshness and quality alerts",
            description: "Quick alert panel",
            status: "planned",
         },
      ],
   },
]
