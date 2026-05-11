"use client"

import { useRouter } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"

const RecipeTemplatesPage = () => {
   const router = useRouter()
   const { ready, catalog, templates, createFromTemplate } = useRecipeCatalog()

   const handleApply = (baseRecipeId: number, fallbackName: string) => {
      const id = createFromTemplate(baseRecipeId, `${fallbackName} (draft)`)
      if (id < 1) return
      router.push(`/recipes/${id}/edit`)
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Loading cookbook…</p>
   }

   return (
      <div className="space-y-6">
         <BackLink href="/recipes" label="Back to recipes hub" />
         <div>
            <h1>Recipe templates</h1>
            <p className="text-text-500 mt-1 max-w-3xl">
               Blueprints duplicate an existing mocked recipe skeleton with all ingredient lines preserved. Opens in the recipe
               builder so you can rename and adjust quantities. Mock only — saves in browser storage under this prototype.
            </p>
         </div>

         <div className="grid gap-4 lg:grid-cols-3">
            {templates.map(template => {
               const baseRecipe =
                  catalog.recipes.find(r => r.id === template.baseRecipeId)?.name ??
                  `Demo #${template.baseRecipeId}`
               const lineCount = catalog.ingredients.filter(i => i.recipe_id === template.baseRecipeId).length
               return (
                  <article key={template.id} className="flex flex-col rounded-sm border border-border-300 bg-background p-4">
                     <p className="text-text-300 mb-1 text-xs">{template.id}</p>
                     <h2 className="text-text-700 font-medium">{template.title}</h2>
                     <p className="text-text-500 mt-2 flex-1 text-sm">{template.description}</p>
                     <p className="text-text-300 mt-2 text-xs">
                        Based on demo recipe: {baseRecipe} · {lineCount} ingredients
                     </p>
                     <Button
                        type="button"
                        className="mt-4 self-start"
                        onClick={() => handleApply(template.baseRecipeId, template.title)}
                     >
                        Use template · open builder
                     </Button>
                  </article>
               )
            })}
         </div>
      </div>
   )
}

export default RecipeTemplatesPage
