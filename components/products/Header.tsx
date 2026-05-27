"use client"

import SearchBar from "@/components/ui/SearchBar"
import PageHeader from "@/components/ui/PageHeader"
import type { ComponentType, SVGProps } from "react"
import { useState } from "react"
import QuickActionModal from "@/components/ui/QuickActionModal"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { useAuth } from "@/components/auth/AuthProvider"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { isApiEnabled } from "@/lib/api/config"
import { ApiError } from "@/lib/api/client"
import { PRODUCT_UNIT_OPTIONS, parseProductUnitInput, productUnitLabel } from "@/lib/product-units"
import type { ProductUnit } from "@/lib/mock-db"

export type ProductRowView = {
   id: number
   name: string
   unit: string
   unitCode: ProductUnit
   isActive: boolean
}

interface HeaderProps {
   title: string
   icon: ComponentType<SVGProps<SVGSVGElement>>
   iconLabel: string
   selectedProducts: ProductRowView[]
   onProductsMutated?: () => void
}

const Header = ({ title, icon, iconLabel, selectedProducts, onProductsMutated }: HeaderProps) => {
   const { isOwner } = useAuth()
   const { addProduct, updateProduct, removeProducts } = useProductCatalog()
   const [isEditOpen, setIsEditOpen] = useState(false)
   const [actionError, setActionError] = useState<string | null>(null)
   const [editName, setEditName] = useState("")
   const [editUnit, setEditUnit] = useState<ProductUnit>("pcs")
   const [saving, setSaving] = useState(false)

   const selectedProduct = selectedProducts.length === 1 ? selectedProducts[0] : null
   const isDeleteDisabled = selectedProducts.length === 0
   const canManage = isOwner

   const openEdit = () => {
      if (!selectedProduct) return
      setEditName(selectedProduct.name)
      setEditUnit(selectedProduct.unitCode)
      setActionError(null)
      setIsEditOpen(true)
   }

   const handleCreate = async (values: Record<string, string>) => {
      setActionError(null)
      try {
         const name = values.nazwa_produktu?.trim() ?? ""
         const unit = parseProductUnitInput(values.jednostka ?? "pcs")
         await addProduct({ name, unit })
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Nie udało się dodać produktu."
         setActionError(message)
         throw new Error(message)
      }
   }

   const handleDelete = async () => {
      setActionError(null)
      try {
         await removeProducts(selectedProducts.map(p => p.id))
         onProductsMutated?.()
      } catch (err) {
         setActionError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Nie udało się usunąć.")
         throw err
      }
   }

   const handleSaveEdit = async () => {
      if (!selectedProduct) return
      setSaving(true)
      setActionError(null)
      try {
         await updateProduct(selectedProduct.id, { name: editName, unit: editUnit })
         setIsEditOpen(false)
      } catch (err) {
         setActionError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Nie udało się zapisać.")
      } finally {
         setSaving(false)
      }
   }

   return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <PageHeader title={title} icon={icon} iconLabel={iconLabel} />
         <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {!canManage ? (
               <p className="text-text-500 text-sm">Zarządzanie katalogiem — tylko właściciel.</p>
            ) : (
               <>
                  <Button type="button" variant="outline" onClick={openEdit} disabled={!selectedProduct}>
                     Edytuj produkt
                  </Button>
                  <QuickActionModal
                     triggerLabel="Usuń produkty"
                     title="Usuń produkty"
                     cancelLabel="Anuluj"
                     prepend={
                        selectedProducts.length === 0 ? (
                           <p>Najpierw zaznacz wiersze w tabeli.</p>
                        ) : (
                           <div>
                              <p className="text-text-700 mb-2 text-sm font-medium">
                                 Zaznaczone ({selectedProducts.length}):
                              </p>
                              <ul className="text-text-500 list-disc space-y-1 pl-4 text-sm">
                                 {selectedProducts.map(p => (
                                    <li key={p.id}>
                                       {p.name} · {p.unit}
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )
                     }
                     description="Produkt zniknie z listy (dezaktywacja w bazie — można go przywrócić tylko w bazie danych)."
                     triggerVariant="warning"
                     triggerDisabled={isDeleteDisabled}
                     confirmLabel="Usuń z listy"
                     fields={[]}
                     onConfirm={async () => {
                        await handleDelete()
                     }}
                  />
                  <QuickActionModal
                     triggerLabel="Dodaj produkt"
                     title="Dodaj produkt"
                     cancelLabel="Anuluj"
                     confirmLabel="Dodaj"
                     description={
                        isApiEnabled()
                           ? "Zapis w bazie przez API."
                           : "Tryb lokalny — produkt tylko w tej sesji przeglądarki."
                     }
                     fields={[
                        { name: "nazwa_produktu", label: "Nazwa produktu", placeholder: "np. Passata pomidorowa" },
                        {
                           kind: "select",
                           name: "jednostka",
                           label: "Jednostka",
                           options: PRODUCT_UNIT_OPTIONS.map(o => ({ value: o.value, label: o.label })),
                           defaultValue: "pcs",
                        },
                     ]}
                     onConfirm={handleCreate}
                  />
               </>
            )}
            <SearchBar />
         </div>
         {actionError ? <p className="text-warning w-full text-sm lg:basis-full">{actionError}</p> : null}
         <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
            <div className="space-y-4">
               <div>
                  <h2 className="text-text-700 text-xl font-medium">Edytuj produkt</h2>
                  <p className="text-text-500 mt-1 text-sm">
                     {selectedProduct ? `${selectedProduct.name} · ${productUnitLabel(selectedProduct.unitCode)}` : ""}
                  </p>
               </div>
               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                     <span className="text-text-700 text-sm font-medium">Nazwa produktu</span>
                     <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                     />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                     <span className="text-text-700 text-sm font-medium">Jednostka</span>
                     <select
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value as ProductUnit)}
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                     >
                        {PRODUCT_UNIT_OPTIONS.map(o => (
                           <option key={o.value} value={o.value}>
                              {o.label}
                           </option>
                        ))}
                     </select>
                  </label>
               </div>
               {actionError ? <p className="text-warning text-sm">{actionError}</p> : null}
               <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
                     Anuluj
                  </Button>
                  <Button type="button" onClick={() => void handleSaveEdit()} disabled={saving}>
                     {saving ? "Zapisywanie…" : "Zapisz"}
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   )
}

export default Header
