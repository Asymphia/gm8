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
            <BackLink href="/recipes/definitions" label="Powrót do listy" />
            <p className="text-text-500 text-sm">Nieprawidłowy link do przepisu.</p>
         </div>
      )
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie…</p>
   }

   const recipe = catalog.recipes.find(r => r.id === recipeId)
   const lines = catalog.ingredients.filter(i => i.recipe_id === recipeId)

   if (!recipe) {
      return (
         <div className="space-y-4">
            <BackLink href="/recipes/definitions" label="Powrót do listy" />
            <p className="text-text-700 font-medium">Nie znaleziono przepisu</p>
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
            <BackLink href="/recipes/definitions" label="Powrót do listy" />
            <div className="flex flex-wrap gap-2">
            <Link
               href={`/recipes/${recipeId}/edit`}
               className="bg-primary-500 hover:bg-primary-700 inline-flex rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
            >
               Edytuj przepis
            </Link>
               {!seeded ? (
                  <Button type="button" variant="warning" onClick={handleDelete}>
                     Usuń przepis
                  </Button>
               ) : null}
            </div>
         </div>

         <header className="rounded-sm border border-border-300 bg-background p-4">
            <p className="text-text-300 text-xs">ID przepisu · {recipe.id}</p>
            <h1 className="text-text-700 mt-1 text-2xl font-medium">{recipe.name}</h1>
            <p className="text-text-500 mt-2 text-sm">
               {lines.length} produktów — poniżej ilości na jedną porcję.
            </p>
            <p className="text-text-500 mt-1 text-sm">Status: {recipe.is_active ? "Aktywny" : "Nieaktywny"}</p>
            {seeded ? (
               <p className="text-text-300 mt-2 text-xs">Przepis demo (seed) · nie można usunąć; edycje zapisują się w tej przeglądarce.</p>
            ) : null}
         </header>

         <div className="overflow-x-auto rounded-sm border border-border-300 bg-background">
            <div className="grid min-w-[42rem] grid-cols-[minmax(0,1fr)_8rem_12rem] border-b border-border-300 px-4 py-3 text-sm font-medium text-text-700">
               <p>Produkt (katalog)</p>
               <p>J.m.</p>
               <p className="text-right">Ilość / porcję</p>
            </div>
            {lines.length === 0 ? (
               <p className="text-text-500 px-4 py-6 text-sm">Brak składników · użyj Edytuj przepis, aby dodać produkty z katalogu.</p>
            ) : (
               lines.map((line, index) => {
                  const product = mockDb.product_catalog.find(p => p.id === line.product_id)
                  const unit = product?.unit ?? "pcs"
                  return (
                     <div
                        key={`${line.recipe_id}-${line.product_id}-${index}`}
                        className="grid min-w-[42rem] grid-cols-[minmax(0,1fr)_8rem_12rem] border-b border-border-300 px-4 py-3 text-sm text-text-500 last:border-0"
                     >
                        <p className="text-text-700 font-medium">{product?.name ?? `Produkt #${line.product_id}`}</p>
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
