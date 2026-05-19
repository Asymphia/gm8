"use client"

import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates"

const RecipesHubPage = () => {
   const { ready, catalog } = useRecipeCatalog()
   const listed = ready ? catalog.recipes.filter(r => r.is_active).length : 0
   const totalDishes = ready ? catalog.recipes.length : 0
   const ingredientLinks = ready ? catalog.ingredients.length : 0

   const items = [
      {
         href: "/recipes/definitions",
         label: "Wszystkie przepisy",
         description: "Tabela dań i liczby linii składników na przepis.",
         value: ready ? String(totalDishes) : "…",
      },
      {
         href: "/recipes/new",
         label: "Utwórz przepis",
         description: "Wiele produktów z katalogu na danie; ilość na porcję.",
         value: "Nowy",
      },
      {
         href: "/recipes/templates",
         label: "Szablony",
         description: "Sklonuj szkielety (makaron, zupa, sałatka) do edycji.",
         value: String(RECIPE_TEMPLATES.length),
      },
      {
         href: "/recipes/editing",
         label: "Cykl życia",
         description: "Pokaż / ukryj przepisy przed pojawieniem się w zamówieniach.",
         value: ready ? `${listed} aktywnych` : "…",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Przepisy</h1>
            <p className="text-text-500 mt-1 max-w-3xl">
               Ten sam układ kart co Magazyn. Każde danie ma wiele linii składników ({ready ? ingredientLinks : "…"} w Twojej
               księdze); aktywnych przepisów: {ready ? listed : "…"}.
            </p>
         </div>
         <HubNavigationGrid items={items} />
      </div>
   )
}

export default RecipesHubPage
