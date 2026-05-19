"use client"

import Link from "next/link"
import BackLink from "@/components/ui/BackLink"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"

const RecipeDefinitionsPage = () => {
   const { ready, catalog } = useRecipeCatalog()
   const { productById } = useProductCatalog()

   const rows =
      ready ?
         [...catalog.recipes].sort((a, b) => a.name.localeCompare(b.name)).map(recipe => {
            const ingredientRows = catalog.ingredients.filter(i => i.recipe_id === recipe.id)
            const preview = ingredientRows
               .map(
                  li =>
                     productById(li.product_id)?.name ??
                     `Produkt #${li.product_id}`
               )
               .join(", ")
            return {
               id: recipe.id,
               recipe: recipe.name,
               ingredientCount: ingredientRows.length,
               preview,
               isActive: recipe.is_active,
            }
         })
      : []

   return (
      <div className="space-y-6">
         <BackLink href="/recipes" label="Powrót do przepisów" />
         <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
               <h1>Lista przepisów</h1>
               <p className="text-text-500 mt-1">
                  Każde danie składa się z produktów katalogowych · otwórz przepis, aby zobaczyć linie · twórz lub duplikuj z
                  menu modułu.
               </p>
            </div>
            <Link
               href="/recipes/new"
               className="bg-primary-500 hover:bg-primary-700 inline-flex rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
            >
               Nowy przepis
            </Link>
            <Link
               href="/recipes/templates"
               className="border-primary-500 text-primary-500 hover:bg-foreground inline-flex rounded-sm border bg-background px-6 py-3 text-sm font-medium transition-colors"
            >
               Szablony
            </Link>
         </div>

         {!ready ? (
            <p className="text-text-500 text-sm">Ładowanie…</p>
         ) : (
            <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
               <div className="grid min-w-[44rem] grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_7rem_7rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
                  <p>Przepis</p>
                  <p className="text-center">Produkty</p>
                  <p>Podgląd</p>
                  <p className="text-center">Aktywny</p>
                  <p />
               </div>
               {rows.map(row => (
                  <div
                     key={row.id}
                     className="grid min-w-[44rem] grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_7rem_7rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
                  >
                     <Link
                        href={`/recipes/${row.id}`}
                        className="text-text-700 hover:text-primary-500 font-medium underline-offset-2 hover:underline"
                     >
                        {row.recipe}
                     </Link>
                     <p className="text-center tabular-nums">{row.ingredientCount}</p>
                     <p className="min-w-0 truncate" title={row.preview}>
                        {row.preview || "—"}
                     </p>
                     <p className="text-center text-xs">{row.isActive ? "Tak" : "Nie"}</p>
                     <p className="text-right space-x-2">
                        <Link href={`/recipes/${row.id}`} className="text-primary-500 text-xs font-medium hover:underline">
                           Podgląd
                        </Link>
                        <Link href={`/recipes/${row.id}/edit`} className="text-primary-500 text-xs font-medium hover:underline">
                           Edytuj
                        </Link>
                     </p>
                  </div>
               ))}
            </div>
         )}
      </div>
   )
}

export default RecipeDefinitionsPage
