"use client"

import Link from "next/link"
import BackLink from "@/components/ui/BackLink"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"

const RecipeEditingBoardPage = () => {
   const { ready, catalog, setRecipeActive } = useRecipeCatalog()

   const rows =
      ready ?
         [...catalog.recipes].map((recipe, index) => {
            const ingredientCount = catalog.ingredients.filter(i => i.recipe_id === recipe.id).length
            return {
               id: recipe.id,
               recipe: recipe.name,
               displayDate: `2026-05-0${(index % 6) + 3}`,
               state: recipe.is_active ? "Listed" : "Hidden",
               ingredientCount,
            }
         })
      : []

   if (!ready) {
      return (
         <div className="space-y-4">
            <BackLink href="/recipes" label="Back to recipes hub" />
            <p className="text-text-500 text-sm">Loading…</p>
         </div>
      )
   }

   return (
      <div className="space-y-6">
         <BackLink href="/recipes" label="Back to recipes hub" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Recipe lifecycle</h1>
               <p className="text-text-500 mt-1">
                  Quickly hide/show recipes for the mock menu builder. Structural edits happen in Recipe list + builder.
               </p>
            </div>
            <Link
               href="/recipes/new"
               className="bg-primary-500 hover:bg-primary-700 inline-flex rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
            >
               New recipe
            </Link>
         </div>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[48rem] grid-cols-[minmax(0,1fr)_6rem_9rem_8rem_10rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Recipe</p>
               <p className="text-center">Products</p>
               <p>Lifecycle state</p>
               <p>Mock date</p>
               <p className="text-right">Visibility</p>
            </div>
            {rows.map(row => (
               <div
                  key={row.id}
                  className="grid min-w-[48rem] grid-cols-[minmax(0,1fr)_6rem_9rem_8rem_10rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
               >
                  <Link
                     href={`/recipes/${row.id}`}
                     className="text-text-700 hover:text-primary-500 font-medium underline-offset-2 hover:underline"
                  >
                     {row.recipe}
                  </Link>
                  <p className="text-center tabular-nums">{row.ingredientCount}</p>
                  <p>{row.state}</p>
                  <p>{row.displayDate}</p>
                  <div className="flex justify-end gap-2">
                     <Link href={`/recipes/${row.id}/edit`} className="text-primary-500 text-xs hover:underline">
                        Builder
                     </Link>
                     <button
                        type="button"
                        className="text-primary-700 text-xs hover:underline"
                        onClick={() => {
                           const current = catalog.recipes.find(r => r.id === row.id)
                           if (!current) return
                           setRecipeActive(row.id, !current.is_active)
                        }}
                     >
                        {catalog.recipes.find(r => r.id === row.id)?.is_active ? "Hide" : "Show"}
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default RecipeEditingBoardPage
