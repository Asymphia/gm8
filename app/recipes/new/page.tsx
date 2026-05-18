"use client"

import BackLink from "@/components/ui/BackLink"
import { RecipeEditorForm } from "@/components/recipes/RecipeEditorForm"

const NewRecipePage = () => (
   <div className="space-y-6">
      <BackLink href="/recipes" label="Powrót do przepisów" />
      <RecipeEditorForm mode="create" recipeId={null} cancelHref="/recipes" key="create-recipe-form" />
   </div>
)

export default NewRecipePage
