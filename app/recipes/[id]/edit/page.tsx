"use client"

import { useParams } from "next/navigation"
import BackLink from "@/components/ui/BackLink"
import { RecipeEditorForm } from "@/components/recipes/RecipeEditorForm"

const EditRecipePage = () => {
   const params = useParams()
   const raw = params?.id
   const idStr = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""
   const recipeId = Number.parseInt(idStr, 10)

   const validId = Number.isFinite(recipeId) && !Number.isNaN(recipeId)

   return (
      <div className="space-y-6">
         <BackLink href={validId ? `/recipes/${recipeId}` : "/recipes"} label={validId ? "Powrót do przepisu" : "Wstecz"} />
         {validId ? (
            <RecipeEditorForm
               key={recipeId}
               mode="edit"
               recipeId={recipeId}
               cancelHref={`/recipes/${recipeId}`}
            />
         ) : (
            <p className="text-text-500 text-sm">Nieprawidłowy identyfikator przepisu.</p>
         )}
      </div>
   )
}

export default EditRecipePage
