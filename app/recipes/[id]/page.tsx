"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import Button from "@/components/ui/Button"
import { mockDb } from "@/lib/mock-db"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"

const RecipeDetailPage = () => {
   const router = useRouter()
   const params = useParams()
   const raw = params?.id
   const idParam = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""
   const recipeId = Number.parseInt(idParam, 10)

   const { ready, catalog, seedRecipeIds, deleteRecipeById } = useRecipeCatalog()

   if (!Number.isFinite(recipeId) || Number.isNaN(recipeId)) {
      return (
         <div className="space-y-4">
            <BackLink href="/recipes/definitions" label="Back to list" />
            <p className="text-text-500 text-sm">Invalid recipe link.</p>
         </div>
      )
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Loading…</p>
   }

   const recipe = catalog.recipes.find(r => r.id === recipeId)
   const lines = catalog.ingredients.filter(i => i.recipe_id === recipeId)

   if (!recipe) {
      return (
         <div className="space-y-4">
            <BackLink href="/recipes/definitions" label="Back to definitions" />
            <p className="text-text-700 font-medium">Recipe not found</p>
         </div>
      )
   }

   const seeded = seedRecipeIds.includes(recipeId as (typeof seedRecipeIds)[number])

   const handleDelete = () => {
      const deleted = deleteRecipeById(recipeId)
      if (deleted) router.push("/recipes/definitions")
   }

   return (
      <div className="space-y-6">
         <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <BackLink href="/recipes/definitions" label="Back to definitions" />
            <div className="flex flex-wrap gap-2">
            <Link
               href={`/recipes/${recipeId}/edit`}
               className="bg-primary-500 hover:bg-primary-700 inline-flex rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
            >
               Edit recipe
            </Link>
               {!seeded ? (
                  <Button type="button" variant="warning" onClick={handleDelete}>
                     Delete recipe
                  </Button>
               ) : null}
            </div>
         </div>

         <header className="rounded-sm border border-border-300 bg-background p-4">
            <p className="text-text-300 text-xs">Recipe ID · {recipe.id}</p>
            <h1 className="text-text-700 mt-1 text-2xl font-medium">{recipe.name}</h1>
            <p className="text-text-500 mt-2 text-sm">
               {lines.length} products — amounts below are per single portion served.
            </p>
            <p className="text-text-500 mt-1 text-sm">Status: {recipe.is_active ? "Active" : "Inactive"}</p>
            {seeded ? (
               <p className="text-text-300 mt-2 text-xs">Seeded demo recipe · cannot delete; edits are saved in this browser.</p>
            ) : null}
         </header>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[42rem] grid-cols-[minmax(0,1fr)_8rem_12rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Product (catalog)</p>
               <p>Unit</p>
               <p className="text-right">Qty / portion</p>
            </div>
            {lines.length === 0 ? (
               <p className="text-text-500 px-4 py-6 text-sm">No ingredients · use Edit recipe to add catalog products.</p>
            ) : (
               lines.map((line, index) => {
                  const product = mockDb.product_catalog.find(p => p.id === line.product_id)
                  const unit = product?.unit ?? "pcs"
                  return (
                     <div
                        key={`${line.recipe_id}-${line.product_id}-${index}`}
                        className="grid min-w-[42rem] grid-cols-[minmax(0,1fr)_8rem_12rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
                     >
                        <p className="text-text-700 font-medium">{product?.name ?? `Product #${line.product_id}`}</p>
                        <p>{unit}</p>
                        <p className="text-right tabular-nums">
                           {line.quantity_per_portion} {unit}
                        </p>
                     </div>
                  )
               })
            )}
         </div>
      </div>
   )
}

export default RecipeDetailPage
