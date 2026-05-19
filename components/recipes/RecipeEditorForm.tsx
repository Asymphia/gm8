"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Button from "@/components/ui/Button"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useRecipeCatalog } from "@/components/recipes/RecipeCatalogProvider"
import { isApiEnabled } from "@/lib/api/config"
import { mockDb } from "@/lib/mock-db"

type LineRow = { key: string; product_id: number; quantity_per_portion: number }

const newLineRow = (): LineRow => ({
   key:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
         ? crypto.randomUUID()
         : `row-${Date.now()}-${Math.random()}`,
   product_id: 1,
   quantity_per_portion: 0.1,
})

interface RecipeEditorFormProps {
   mode: "create" | "edit"
   recipeId: number | null
   cancelHref: string
}

export function RecipeEditorForm({ mode, recipeId, cancelHref }: RecipeEditorFormProps) {
   const router = useRouter()
   const { ready, catalog, upsertRecipe } = useRecipeCatalog()
   const { products } = useProductCatalog()

   const existing = recipeId !== null ? catalog.recipes.find(r => r.id === recipeId) : undefined

   const [name, setName] = useState(existing?.name ?? "")
   const [isActive, setIsActive] = useState(existing?.is_active ?? true)
   const [lines, setLines] = useState<LineRow[]>(() => {
      if (mode === "create" || recipeId === null) return [newLineRow()]
      const rows = catalog.ingredients
         .filter(i => i.recipe_id === recipeId)
         .map(i => ({
            ...newLineRow(),
            product_id: i.product_id,
            quantity_per_portion: i.quantity_per_portion,
         }))
      return rows.length ? rows : [newLineRow()]
   })
   const [error, setError] = useState<string | null>(null)

   const activeProducts = products.filter(p => p.is_active)

   const title = mode === "create" ? "Nowy przepis" : `Edytuj przepis #${recipeId}`

   const productOptions = useMemo(
      () =>
         activeProducts.map(p => ({
            id: p.id,
            label: `${p.name} (${p.unit})`,
         })),
      [activeProducts]
   )

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie księgi przepisów…</p>
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

   const handleAddRow = () => setLines(previous => [...previous, newLineRow()])

   const handleUsuńRow = (key: string) => setLines(previous => (previous.length > 1 ? previous.filter(row => row.key !== key) : previous))

   const handleSave = async () => {
      setError(null)
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
      router.push(`/recipes/${id}`)
   }

   return (
      <div className="space-y-6">
         <header>
            <h1 className="text-text-700">{title}</h1>
            <p className="text-text-500 mt-1 text-sm">
               One recipe = <span className="text-text-700">wiele produktów</span>: add a line per ingredient.{" "}
               <span className="text-text-700">Ilość na porcję</span> is how much of that product one portion of the dish
               consumes; orders multiply it by portions and the operations layer subtracts stock when you accept the order.
               {isApiEnabled() ? "Zapis przez API (BD-Projekt)." : "Tryb demo — zapis w localStorage przeglądarki."}
            </p>
         </header>

         <section className="space-y-3 rounded-sm border border-border-300 bg-background p-4">
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
               Aktywny (widoczny przy zamówieniach / w menu)
            </label>
         </section>

         <section className="rounded-sm border border-border-300 bg-background p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
               <p className="text-text-700 text-sm font-medium">Składniki · ilość na porcję</p>
               <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
                  Dodaj linię produktu
               </Button>
            </div>

            <div className="space-y-3">
               {lines.map(line => (
                  <div key={line.key} className="flex flex-col gap-2 rounded-sm border border-border-300 bg-foreground p-3 sm:flex-row sm:items-center">
                     <select
                        value={line.product_id}
                        onChange={e =>
                           setLines(prev =>
                              prev.map(row =>
                                 row.key === line.key ? { ...row, product_id: Number(e.target.value) } : row
                              )
                           )
                        }
                        className="border-border-300 flex-1 rounded-sm border px-3 py-2 text-sm outline-none sm:min-w-[12rem]"
                     >
                        {productOptions.map(p => (
                           <option key={p.id} value={p.id}>
                              {p.label}
                           </option>
                        ))}
                     </select>
                     <div className="flex flex-1 items-center gap-2">
                        <input
                           type="number"
                           min="0"
                           step="0.001"
                           value={line.quantity_per_portion}
                           onChange={e =>
                              setLines(prev =>
                                 prev.map(row =>
                                    row.key === line.key ? { ...row, quantity_per_portion: Number(e.target.value) } : row
                                 )
                              )
                           }
                           className="border-border-300 rounded-sm border px-3 py-2 text-sm outline-none sm:max-w-[10rem]"
                        />
                        <span className="text-text-500 text-xs">{activeProducts.find(pr => pr.id === line.product_id)?.unit ?? ""}</span>
                     </div>
                     <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => handleUsuńRow(line.key)}>
                        Usuń
                     </Button>
                  </div>
               ))}
            </div>
         </section>

         {error ? <p className="text-warning text-sm">{error}</p> : null}

         <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
               Anuluj
            </Button>
            <Button type="button" onClick={handleSave}>
               {mode === "create" ? "Utwórz przepis" : "Zapisz zmiany"}
            </Button>
         </div>
      </div>
   )
}
