"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
   duplicateRecipeIngredients,
   createSeedRecipeCatalog,
   loadRecipeCatalogBrowser,
   saveRecipeCatalogBrowser,
   type RecipeCatalogPersisted,
   type CatalogRecipeRow,
} from "@/lib/recipe-catalog-storage"
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates"

type IngredientDraftLine = { product_id: number; quantity_per_portion: number }

interface RecipeCatalogContextValue {
   ready: boolean
   catalog: RecipeCatalogPersisted
   templates: typeof RECIPE_TEMPLATES

   upsertRecipe: (payload: {
      id: number | null
      name: string
      is_active: boolean
      lines: IngredientDraftLine[]
   }) => number

   createFromTemplate: (baseRecipeId: number, suggestedName: string) => number

   setRecipeActive: (recipeId: number, active: boolean) => void

   deleteRecipeById: (recipeId: number) => boolean

   seedRecipeIds: readonly [201, 202, 203]
}

const RecipeCatalogContext = createContext<RecipeCatalogContextValue | null>(null)

const SEEDED_IDS = [201, 202, 203] as const

export function RecipeCatalogProvider({ children }: { children: ReactNode }) {
   const [ready, setReady] = useState(false)
   const [catalog, setCatalog] = useState<RecipeCatalogPersisted>(() => createSeedRecipeCatalog())

   useEffect(() => {
      queueMicrotask(() => {
         const stored = loadRecipeCatalogBrowser()
         if (stored) {
            setCatalog(stored)
         } else {
            const seed = createSeedRecipeCatalog()
            saveRecipeCatalogBrowser(seed)
            setCatalog(seed)
         }
         setReady(true)
      })
   }, [])

   useEffect(() => {
      if (!ready) return
      saveRecipeCatalogBrowser(catalog)
   }, [catalog, ready])

   const upsertRecipe = useCallback(
      (payload: {
         id: number | null
         name: string
         is_active: boolean
         lines: IngredientDraftLine[]
      }): number => {
         const trimmedName = payload.name.trim()
         if (!trimmedName) {
            return -1
         }

         const validLines = payload.lines.filter(
            l =>
               typeof l.product_id === "number" &&
               l.product_id > 0 &&
               Number.isFinite(l.quantity_per_portion) &&
               l.quantity_per_portion > 0
         )
         if (validLines.length === 0) {
            return -2
         }

         const uniqueProducts = new Set(validLines.map(l => l.product_id))
         if (uniqueProducts.size !== validLines.length) {
            return -3
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

         return resultId
      },
      []
   )

   const createFromTemplate = useCallback((baseRecipeId: number, suggestedName: string): number => {
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
      return createdId
   }, [])

   const setRecipeActive = useCallback((recipeId: number, active: boolean) => {
      setCatalog(prev => ({
         ...prev,
         recipes: prev.recipes.map(r => (r.id === recipeId ? { ...r, is_active: active } : r)),
      }))
   }, [])

   const deleteRecipeById = useCallback((recipeId: number): boolean => {
      if (SEEDED_IDS.includes(recipeId as (typeof SEEDED_IDS)[number])) return false

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
      return existed
   }, [])

   const value = useMemo(
      () =>
         ({
            ready,
            catalog,
            templates: RECIPE_TEMPLATES,
            upsertRecipe,
            createFromTemplate,
            setRecipeActive,
            deleteRecipeById,
            seedRecipeIds: SEEDED_IDS,
         }) satisfies RecipeCatalogContextValue,
      [catalog, ready, upsertRecipe, createFromTemplate, setRecipeActive, deleteRecipeById]
   )

   return <RecipeCatalogContext.Provider value={value}>{children}</RecipeCatalogContext.Provider>
}

export function useRecipeCatalog() {
   const ctx = useContext(RecipeCatalogContext)
   if (!ctx) throw new Error("useRecipeCatalog must be inside RecipeCatalogProvider")
   return ctx
}
