import { RecipeCatalogProvider } from "@/components/recipes/RecipeCatalogProvider"
import type { ReactNode } from "react"

const RecipesModuleLayout = ({ children }: Readonly<{ children: ReactNode }>) => (
   <RecipeCatalogProvider>{children}</RecipeCatalogProvider>
)

export default RecipesModuleLayout
