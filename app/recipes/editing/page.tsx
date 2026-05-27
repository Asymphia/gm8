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
               state: recipe.is_active ? "Widoczny" : "Ukryty",
               ingredientCount,
            }
         })
      : []

   if (!ready) {
      return (
         <div className="space-y-4">
            <BackLink href="/recipes" label="Powrót do przepisów" />
            <p className="text-text-500 text-sm">Ładowanie…</p>
         </div>
      )
   }

   return (
      <div className="space-y-6">
         <BackLink href="/recipes" label="Powrót do przepisów" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Cykl życia przepisu</h1>
               <p className="text-text-500 mt-1">
                  Szybkie ukrywanie i pokazywanie przepisów w menu zamówień. Zmiana zapisuje się w księdze przepisów.
               </p>
            </div>
            <Link
               href="/recipes/new"
               className="bg-primary-500 hover:bg-primary-700 inline-flex rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
            >
               Nowy przepis
            </Link>
         </div>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[48rem] grid-cols-[minmax(0,1fr)_6rem_9rem_8rem_10rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Przepis</p>
               <p className="text-center">Produkty</p>
               <p>Stan cyklu</p>
               <p>Podgląd</p>
               <p className="text-right">Widoczność</p>
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
                  <p className="text-text-300 text-xs">—</p>
                  <div className="flex justify-end gap-2">
                     <Link href={`/recipes/${row.id}/edit`} className="text-primary-500 text-xs hover:underline">
                        Edytor
                     </Link>
                     <button
                        type="button"
                        className="text-primary-700 text-xs hover:underline"
                        onClick={() => {
                           const current = catalog.recipes.find(r => r.id === row.id)
                           if (!current) return
                           void setRecipeActive(row.id, !current.is_active)
                        }}
                     >
                        {catalog.recipes.find(r => r.id === row.id)?.is_active ? "Ukryj" : "Pokaż"}
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default RecipeEditingBoardPage
