import { mockDb, type RecipeIngredientRow, type RecipeRow } from "@/lib/mock-db"

/** Recipe as stored — `is_template` only for blueprint rows duplicated by user flow */
export interface CatalogRecipeRow extends RecipeRow {
   is_template?: boolean
}

export interface RecipeCatalogPersisted {
   recipes: CatalogRecipeRow[]
   ingredients: RecipeIngredientRow[]
   /** Next id for newly created recipes (avoids clashes with seeded 201…) */
   nextRecipeId: number
}

export const RECIPE_CATALOG_STORAGE_KEY = "gm8_recipe_catalog_v1"

/** Dispatched whenever the cookbook is saved — operations layer refreshes previews */
export const RECIPE_CATALOG_UPDATED_EVENT = "gm8-recipe-catalog-updated"

const DEFAULT_NEXT_ID = 900

export function createSeedRecipeCatalog(): RecipeCatalogPersisted {
   return {
      recipes: mockDb.recipes.map(r => ({
         ...r,
         is_template: false as const,
      })),
      ingredients: mockDb.recipe_ingredients.map(i => ({
         recipe_id: i.recipe_id,
         product_id: i.product_id,
         quantity_per_portion: i.quantity_per_portion,
      })),
      nextRecipeId: DEFAULT_NEXT_ID,
   }
}

export function loadRecipeCatalogBrowser(): RecipeCatalogPersisted | null {
   if (typeof window === "undefined") return null
   try {
      const raw = window.localStorage.getItem(RECIPE_CATALOG_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as RecipeCatalogPersisted
      if (!parsed?.recipes || !parsed.ingredients || typeof parsed.nextRecipeId !== "number") return null
      return parsed
   } catch {
      return null
   }
}

export function saveRecipeCatalogBrowser(catalog: RecipeCatalogPersisted): void {
   if (typeof window === "undefined") return
   window.localStorage.setItem(RECIPE_CATALOG_STORAGE_KEY, JSON.stringify(catalog))
   window.dispatchEvent(new Event(RECIPE_CATALOG_UPDATED_EVENT))
}

export function duplicateRecipeIngredients(
   catalog: RecipeCatalogPersisted,
   fromRecipeId: number,
   toRecipeId: number
): RecipeIngredientRow[] {
   const copy = catalog.ingredients
      .filter(i => i.recipe_id === fromRecipeId)
      .map(i => ({
         recipe_id: toRecipeId,
         product_id: i.product_id,
         quantity_per_portion: i.quantity_per_portion,
      }))
   return copy
}
