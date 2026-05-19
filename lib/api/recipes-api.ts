import { apiRequest } from "@/lib/api/client"
import { recipeCatalogFromDtos, recipeDtoToRows } from "@/lib/api/mappers"
import type { RecipeCatalogPersisted } from "@/lib/recipe-catalog-storage"
import type { RecipeCreateRequest, RecipeDto, RecipeUpdateRequest } from "@/lib/api/types"

export async function fetchRecipeCatalog(): Promise<RecipeCatalogPersisted> {
   const list = await apiRequest<RecipeDto[]>("/api/Recipe")
   return recipeCatalogFromDtos(list)
}

export async function createRecipe(payload: {
   name: string
   isActive: boolean
   lines: { product_Id: number; quantity_Per_Portion: number }[]
}): Promise<RecipeCatalogPersisted> {
   const body: RecipeCreateRequest = {
      name: payload.name.trim(),
      isActive: payload.isActive,
      ingredients: payload.lines,
   }
   await apiRequest<RecipeDto>("/api/Recipe", { method: "POST", body })
   return fetchRecipeCatalog()
}

export async function updateRecipe(
   id: number,
   payload: {
      name: string
      isActive: boolean
      lines: { product_Id: number; quantity_Per_Portion: number }[]
   }
): Promise<RecipeCatalogPersisted> {
   const body: RecipeUpdateRequest = {
      name: payload.name.trim(),
      isActive: payload.isActive,
      ingredients: payload.lines,
   }
   await apiRequest<RecipeDto>(`/api/Recipe/${id}`, { method: "PUT", body })
   return fetchRecipeCatalog()
}

export async function deactivateRecipe(id: number): Promise<RecipeCatalogPersisted> {
   await apiRequest<void>(`/api/Recipe/${id}`, { method: "DELETE" })
   return fetchRecipeCatalog()
}

export async function fetchRecipeById(id: number) {
   const dto = await apiRequest<RecipeDto>(`/api/Recipe/${id}`)
   return recipeDtoToRows(dto)
}
