"use client"

import FeatureSection from "@/components/features/FeatureSection"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates"

const RecipesHubPage = () => {
   const { ready, catalog } = useRecipeCatalog()
   const recipes = APP_FEATURE_GROUPS.find(group => group.route === "/recipes")

   const listed = ready ? catalog.recipes.filter(r => r.is_active).length : 0
   const totalDishes = ready ? catalog.recipes.length : 0
   const ingredientLinks = ready ? catalog.ingredients.length : 0

   const items = [
      {
         href: "/recipes/definitions",
         label: "All recipes",
         description: "Table of dishes and ingredient line counts per recipe.",
         value: ready ? String(totalDishes) : "…",
      },
      {
         href: "/recipes/new",
         label: "Create recipe",
         description: "Multiple catalog products per dish; quantity per portion.",
         value: "New",
      },
      {
         href: "/recipes/templates",
         label: "Templates",
         description: "Clone seeded skeletons (pasta, soup, salad) into editable drafts.",
         value: String(RECIPE_TEMPLATES.length),
      },
      {
         href: "/recipes/editing",
         label: "Lifecycle",
         description: "Show / hide recipes before they appear in order pickers.",
         value: ready ? `${listed} active` : "…",
      },
   ]

   return (
      <div className="space-y-6">
         <div>
            <h1>Recipes</h1>
            <p className="text-text-500 mt-1 max-w-3xl">
               Same card hub as Warehouse. Each dish has many ingredient lines ({ready ? ingredientLinks : "…"} links in your
               cookbook); active recipes: {ready ? listed : "…"}.
            </p>
         </div>
         <HubNavigationGrid items={items} />
         {recipes ? <FeatureSection group={recipes} /> : null}
      </div>
   )
}

export default RecipesHubPage
