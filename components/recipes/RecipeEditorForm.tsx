"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { isApiEnabled } from "@/lib/api/config"

type LineRow = { key: string; product_id: number; quantity_per_portion: number }

function newLineKey(): string {
   return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `row-${Date.now()}-${Math.random()}`
}

function newLineRow(defaultProductId: number): LineRow {
   return {
      key: newLineKey(),
      product_id: defaultProductId,
      quantity_per_portion: 0.1,
   }
}

interface RecipeEditorFormProps {
   mode: "create" | "edit"
   recipeId: number | null
   cancelHref: string
}

export function RecipeEditorForm({ mode, recipeId, cancelHref }: RecipeEditorFormProps) {
   const router = useRouter()
   const { ready: recipesReady, catalog, upsertRecipe } = useRecipeCatalog()
   const { products, ready: productsReady } = useProductCatalog()

   const existing = recipeId !== null ? catalog.recipes.find(r => r.id === recipeId) : undefined

   const activeProducts = useMemo(() => products.filter(p => p.is_active), [products])
   const defaultProductId = activeProducts[0]?.id ?? 0

   const [name, setName] = useState(existing?.name ?? "")
   const [isActive, setIsActive] = useState(existing?.is_active ?? true)
   const [lines, setLines] = useState<LineRow[]>([])
   const [linesInitialized, setLinesInitialized] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const [saving, setSaving] = useState(false)

   useEffect(() => {
      if (!recipesReady || !productsReady || linesInitialized) return
      const pid = activeProducts[0]?.id
      if (!pid) {
         setLines([])
         setLinesInitialized(true)
         return
      }
      if (mode === "edit" && recipeId !== null) {
         const rows = catalog.ingredients
            .filter(i => i.recipe_id === recipeId)
            .map(i => ({
               key: newLineKey(),
               product_id: i.product_id,
               quantity_per_portion: i.quantity_per_portion,
            }))
         setLines(rows.length ? rows : [newLineRow(pid)])
      } else {
         setLines([newLineRow(pid)])
      }
      setLinesInitialized(true)
   }, [
      activeProducts,
      catalog.ingredients,
      linesInitialized,
      mode,
      productsReady,
      recipeId,
      recipesReady,
   ])

   const title = mode === "create" ? "Nowy przepis" : `Edytuj przepis #${recipeId}`

   const productOptions = useMemo(
      () =>
         activeProducts.map(p => ({
            id: p.id,
            label: `${p.name} (${p.unit})`,
         })),
      [activeProducts]
   )

   if (!recipesReady || !productsReady) {
      return <p className="text-text-500 text-sm">Ładowanie formularza…</p>
   }

   if (mode === "edit" && recipeId !== null && !existing) {
      return (
         <div className="rounded-sm border border-border-300 bg-background p-6">
            <p className="text-text-700 font-medium">Nie znaleziono przepisu</p>
            <Button type="button" className="mt-4" variant="outline" onClick={() => router.push(cancelHref)}>
               Wstecz
            </Button>
         </div>
      )
   }

   const handleAddRow = () => {
      setError(null)
      if (activeProducts.length === 0) {
         setError("Brak produktów w katalogu — najpierw dodaj produkt w Magazynie.")
         return
      }
      const pid = activeProducts[0].id
      setLines(previous => [...previous, newLineRow(pid)])
   }

   const handleRemoveRow = (key: string) => {
      setLines(previous => (previous.length > 1 ? previous.filter(row => row.key !== key) : previous))
   }

   const handleSave = async () => {
      setError(null)
      setSaving(true)
      try {
         const id = await upsertRecipe({
            id: mode === "create" ? null : recipeId,
            name,
            is_active: isActive,
            lines: lines.map(l => ({ product_id: l.product_id, quantity_per_portion: l.quantity_per_portion })),
         })
         if (id === -1) {
            setError("Podaj nazwę przepisu.")
            return
         }
         if (id === -2) {
            setError("Dodaj co najmniej jedną linię składnika z ilością większą od zera.")
            return
         }
         if (id === -3) {
            setError("Każdy składnik może wystąpić tylko raz — usuń duplikaty.")
            return
         }
         if (id < 0) {
            setError("Nie udało się zapisać przepisu.")
            return
         }
         router.push(`/recipes/${id}`)
      } catch (err) {
         setError(err instanceof Error ? err.message : "Nie udało się zapisać przepisu.")
      } finally {
         setSaving(false)
      }
   }

   return (
      <div className="pb-[calc(var(--mobile-bottom-nav-height)+5.5rem)] lg:pb-4">
         <header>
            <h1 className="text-text-700">{title}</h1>
            <p className="text-text-500 mt-1 text-sm">
               Jeden przepis = wiele produktów. Ilość na porcję określa zużycie magazynu przy przyjęciu zamówienia.
               {isApiEnabled() ? " Zapis przez API." : " Tryb demo — zapis w przeglądarce."}
            </p>
         </header>

         <section className="mt-6 space-y-3 rounded-sm border border-border-300 bg-background p-4">
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Nazwa przepisu</span>
               <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="np. Danie dnia"
                  className="border-border-300 text-text-700 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex items-center gap-2 text-sm">
               <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-primary-500"
               />
               Aktywny (widoczny przy zamówieniach)
            </label>
         </section>

         <section className="mt-4 rounded-sm border border-border-300 bg-background p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               <p className="text-text-700 text-sm font-medium">Składniki · ilość na porcję</p>
               <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full shrink-0 sm:w-auto"
                  onClick={handleAddRow}
                  disabled={activeProducts.length === 0}
               >
                  Dodaj linię produktu
               </Button>
            </div>

            {activeProducts.length === 0 ? (
               <p className="text-text-500 text-sm">Brak aktywnych produktów — dodaj je w Magazyn → Produkty.</p>
            ) : (
               <div className="space-y-3">
                  {lines.map(line => (
                     <div
                        key={line.key}
                        className="flex flex-col gap-3 rounded-sm border border-border-300 bg-foreground p-3 sm:flex-row sm:items-center"
                     >
                        <select
                           value={line.product_id}
                           onChange={e =>
                              setLines(prev =>
                                 prev.map(row =>
                                    row.key === line.key ? { ...row, product_id: Number(e.target.value) } : row
                                 )
                              )
                           }
                           className="border-border-300 text-text-700 min-h-11 flex-1 rounded-sm border px-3 py-2 text-sm outline-none"
                        >
                           {productOptions.map(p => (
                              <option key={p.id} value={p.id}>
                                 {p.label}
                              </option>
                           ))}
                        </select>
                        <div className="flex min-h-11 flex-1 items-center gap-2">
                           <input
                              type="number"
                              min="0"
                              step="0.001"
                              inputMode="decimal"
                              value={line.quantity_per_portion}
                              onChange={e =>
                                 setLines(prev =>
                                    prev.map(row =>
                                       row.key === line.key
                                          ? { ...row, quantity_per_portion: Number(e.target.value) }
                                          : row
                                    )
                                 )
                              }
                              className="border-border-300 text-text-700 min-h-11 w-full rounded-sm border px-3 py-2 text-sm outline-none sm:max-w-[10rem]"
                           />
                           <span className="text-text-500 shrink-0 text-xs">
                              {activeProducts.find(pr => pr.id === line.product_id)?.unit ?? ""}
                           </span>
                        </div>
                        <Button
                           type="button"
                           variant="ghost"
                           className="min-h-11 shrink-0 self-end sm:self-center"
                           onClick={() => handleRemoveRow(line.key)}
                        >
                           Usuń
                        </Button>
                     </div>
                  ))}
               </div>
            )}
         </section>

         {error ? <p className="text-warning mt-4 text-sm">{error}</p> : null}

         <div className="form-actions-mobile" aria-label="Akcje formularza">
            <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => router.push(cancelHref)} disabled={saving}>
               Anuluj
            </Button>
            <Button type="button" className="min-h-11 flex-1" onClick={() => void handleSave()} disabled={saving || activeProducts.length === 0}>
               {saving ? "Zapisywanie…" : mode === "create" ? "Utwórz przepis" : "Zapisz zmiany"}
            </Button>
         </div>
      </div>
   )
}
