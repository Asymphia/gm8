"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ApiError } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { createRecipe, deactivateRecipe, fetchRecipeCatalog, updateRecipe } from "@/lib/api/recipes-api"
import {
   duplicateRecipeIngredients,
   createSeedRecipeCatalog,
   loadRecipeCatalogBrowser,
   saveRecipeCatalogBrowser,
   type RecipeCatalogPersisted,
   type CatalogRecipeRow,
} from "@/lib/recipe-catalog-storage"
import { RECIPE_CATALOG_UPDATED_EVENT } from "@/lib/recipe-catalog-storage"
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates"

type IngredientDraftLine = { product_id: number; quantity_per_portion: number }

interface RecipeCatalogContextValue {
   ready: boolean
   loadError: string | null
   catalog: RecipeCatalogPersisted
   templates: typeof RECIPE_TEMPLATES

   refresh: () => Promise<void>
   upsertRecipe: (payload: {
      id: number | null
      name: string
      is_active: boolean
      lines: IngredientDraftLine[]
   }) => Promise<number>

   createFromTemplate: (baseRecipeId: number, suggestedName: string) => Promise<number>

   setRecipeActive: (recipeId: number, active: boolean) => Promise<void>

   deleteRecipeById: (recipeId: number) => Promise<boolean>

   seedRecipeIds: readonly [201, 202, 203]
}

const RecipeCatalogContext = createContext<RecipeCatalogContextValue | null>(null)

const SEEDED_IDS = [201, 202, 203] as const

export function RecipeCatalogProvider({ children }: { children: ReactNode }) {
   const useApi = isApiEnabled()
   const [ready, setReady] = useState(false)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [catalog, setCatalog] = useState<RecipeCatalogPersisted>(() => createSeedRecipeCatalog())

   const refresh = useCallback(async () => {
      if (useApi) {
         try {
            setCatalog(await fetchRecipeCatalog())
            setLoadError(null)
         } catch (err) {
            setLoadError(err instanceof ApiError ? err.message : "Nie udało się pobrać przepisów.")
         }
      } else {
         const stored = loadRecipeCatalogBrowser()
         setCatalog(stored ?? createSeedRecipeCatalog())
         setLoadError(null)
      }
   }, [useApi])

   useEffect(() => {
      void (async () => {
         if (!useApi) {
            const stored = loadRecipeCatalogBrowser()
            if (stored) setCatalog(stored)
            else {
               const seed = createSeedRecipeCatalog()
               saveRecipeCatalogBrowser(seed)
               setCatalog(seed)
            }
         } else {
            await refresh()
         }
         setReady(true)
      })()
   }, [refresh, useApi])

   useEffect(() => {
      if (!ready || useApi) return
      saveRecipeCatalogBrowser(catalog)
   }, [catalog, ready, useApi])

   const dispatchUpdated = () => {
      if (typeof window !== "undefined") {
         window.dispatchEvent(new Event(RECIPE_CATALOG_UPDATED_EVENT))
      }
   }

   const upsertRecipe = useCallback(
      async (payload: {
         id: number | null
         name: string
         is_active: boolean
         lines: IngredientDraftLine[]
      }): Promise<number> => {
         const trimmedName = payload.name.trim()
         if (!trimmedName) return -1

         const validLines = payload.lines.filter(
            l =>
               typeof l.product_id === "number" &&
               l.product_id > 0 &&
               Number.isFinite(l.quantity_per_portion) &&
               l.quantity_per_portion > 0
         )
         if (validLines.length === 0) return -2

         const uniqueProducts = new Set(validLines.map(l => l.product_id))
         if (uniqueProducts.size !== validLines.length) return -3

         const apiLines = validLines.map(l => ({
            product_Id: l.product_id,
            quantity_Per_Portion: Number(l.quantity_per_portion.toFixed(4)),
         }))

         if (useApi) {
            if (payload.id === null) {
               const next = await createRecipe({
                  name: trimmedName,
                  isActive: payload.is_active,
                  lines: apiLines,
               })
               setCatalog(next)
               dispatchUpdated()
               const created = next.recipes.find(r => r.name === trimmedName)
               return created?.id ?? -99
            }
            const next = await updateRecipe(payload.id, {
               name: trimmedName,
               isActive: payload.is_active,
               lines: apiLines,
            })
            setCatalog(next)
            dispatchUpdated()
            return payload.id
         }

         let resultId = -99

         setCatalog(prev => {
            if (payload.id === null) {
               const newId = prev.nextRecipeId
               resultId = newId
               const newRecipe: CatalogRecipeRow = {
                  id: newId,
                  name: trimmedName,
                  is_active: payload.is_active,
               }
               const newIngredients = validLines.map(l => ({
                  recipe_id: newId,
                  product_id: l.product_id,
                  quantity_per_portion: Number(l.quantity_per_portion.toFixed(4)),
               }))
               return {
                  recipes: [...prev.recipes, newRecipe],
                  ingredients: [...prev.ingredients, ...newIngredients],
                  nextRecipeId: newId + 1,
               }
            }

            const recipeId = payload.id
            resultId = recipeId
            const filteredRecipes = prev.recipes.filter(r => r.id !== recipeId)
            const updatedRecipe: CatalogRecipeRow = {
               id: recipeId,
               name: trimmedName,
               is_active: payload.is_active,
            }
            const newIngredients = validLines.map(l => ({
               recipe_id: recipeId,
               product_id: l.product_id,
               quantity_per_portion: Number(l.quantity_per_portion.toFixed(4)),
            }))
            return {
               ...prev,
               recipes: [...filteredRecipes, updatedRecipe].sort((a, b) => a.id - b.id),
               ingredients: [...prev.ingredients.filter(i => i.recipe_id !== recipeId), ...newIngredients],
            }
         })

         dispatchUpdated()
         return resultId
      },
      [useApi]
   )

   const createFromTemplate = useCallback(
      async (baseRecipeId: number, suggestedName: string): Promise<number> => {
         if (useApi) {
            const base = catalog.ingredients.filter(i => i.recipe_id === baseRecipeId)
            if (base.length === 0) return -1
            return upsertRecipe({
               id: null,
               name: suggestedName.trim() || "Nowy z szablonu",
               is_active: true,
               lines: base.map(i => ({
                  product_id: i.product_id,
                  quantity_per_portion: i.quantity_per_portion,
               })),
            })
         }

         let createdId = -1
         setCatalog(prev => {
            const duplicated = duplicateRecipeIngredients(prev, baseRecipeId, prev.nextRecipeId)
            if (duplicated.length === 0) {
               createdId = -1
               return prev
            }
            const newId = prev.nextRecipeId
            createdId = newId
            const newRecipe: CatalogRecipeRow = {
               id: newId,
               name: suggestedName.trim() || "Nowy z szablonu",
               is_active: true,
            }
            return {
               recipes: [...prev.recipes, newRecipe],
               ingredients: [...prev.ingredients, ...duplicated],
               nextRecipeId: newId + 1,
            }
         })
         dispatchUpdated()
         return createdId
      },
      [catalog.ingredients, upsertRecipe, useApi]
   )

   const setRecipeActive = useCallback(
      async (recipeId: number, active: boolean) => {
         if (useApi) {
            const recipe = catalog.recipes.find(r => r.id === recipeId)
            if (!recipe) return
            const lines = catalog.ingredients
               .filter(i => i.recipe_id === recipeId)
               .map(i => ({
                  product_Id: i.product_id,
                  quantity_Per_Portion: i.quantity_per_portion,
               }))
            const next = await updateRecipe(recipeId, { name: recipe.name, isActive: active, lines })
            setCatalog(next)
            dispatchUpdated()
            return
         }
         setCatalog(prev => ({
            ...prev,
            recipes: prev.recipes.map(r => (r.id === recipeId ? { ...r, is_active: active } : r)),
         }))
         dispatchUpdated()
      },
      [catalog.ingredients, catalog.recipes, useApi]
   )

   const deleteRecipeById = useCallback(
      async (recipeId: number): Promise<boolean> => {
         if (SEEDED_IDS.includes(recipeId as (typeof SEEDED_IDS)[number])) return false

         if (useApi) {
            const next = await deactivateRecipe(recipeId)
            setCatalog(next)
            dispatchUpdated()
            return true
         }

         let existed = false
         setCatalog(prev => {
            if (!prev.recipes.some(r => r.id === recipeId)) return prev
            existed = true
            return {
               ...prev,
               recipes: prev.recipes.filter(r => r.id !== recipeId),
               ingredients: prev.ingredients.filter(i => i.recipe_id !== recipeId),
            }
         })
         dispatchUpdated()
         return existed
      },
      [useApi]
   )

   const value = useMemo(
      () =>
         ({
            ready,
            loadError,
            catalog,
            templates: RECIPE_TEMPLATES,
            refresh,
            upsertRecipe,
            createFromTemplate,
            setRecipeActive,
            deleteRecipeById,
            seedRecipeIds: SEEDED_IDS,
         }) satisfies RecipeCatalogContextValue,
      [catalog, loadError, ready, refresh, upsertRecipe, createFromTemplate, setRecipeActive, deleteRecipeById]
   )

   return <RecipeCatalogContext.Provider value={value}>{children}</RecipeCatalogContext.Provider>
}

export function useRecipeCatalog() {
   const ctx = useContext(RecipeCatalogContext)
   if (!ctx) throw new Error("useRecipeCatalog must be inside RecipeCatalogProvider")
   return ctx
}
