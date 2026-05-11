"use client"
import SearchBar from "@/components/ui/SearchBar"
import PageHeader from "@/components/ui/PageHeader"
import type { ComponentType, SVGProps } from "react"
import { useState } from "react"
import QuickActionModal from "@/components/ui/QuickActionModal"
import type { ProductCatalog } from "@/lib/data"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"

interface HeaderProps {
   title: string
   icon: ComponentType<SVGProps<SVGSVGElement>>
   iconLabel: string
   selectedProducts: ProductCatalog[]
}

const Header = ({ title, icon, iconLabel, selectedProducts }: HeaderProps) => {
   const [isEditOpen, setIsEditOpen] = useState(false)
   const selectedProduct = selectedProducts.length === 1 ? selectedProducts[0] : null
   const isDeleteDisabled = selectedProducts.length === 0

   return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <PageHeader title={title} icon={icon} iconLabel={iconLabel} />
         <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(true)} disabled={!selectedProduct}>
               Edit product
            </Button>
            <QuickActionModal
               triggerLabel="Delete products"
               title="Delete Products"
               cancelLabel="Cancel"
               prepend={
                  selectedProducts.length === 0 ? (
                     <p>Select rows in the table first.</p>
                  ) : (
                     <div>
                        <p className="text-text-700 mb-2 text-sm font-medium">Selected ({selectedProducts.length}):</p>
                        <ul className="text-text-500 list-disc space-y-1 pl-4 text-sm">
                           {selectedProducts.map(p => (
                              <li key={p.name}>
                                 {p.name} · {p.unit}
                              </li>
                           ))}
                        </ul>
                     </div>
                  )
               }
               description="Mock confirmation — no database call."
               triggerVariant="warning"
               triggerDisabled={isDeleteDisabled}
               confirmLabel="Delete selected"
               fields={[{ name: "reason", label: "Reason (mock)", placeholder: "Optional note" }]}
               onConfirm={() => undefined}
            />
            <QuickActionModal
               triggerLabel="Add product"
               title="Add Product"
               cancelLabel="Cancel"
               confirmLabel="Create draft"
               fields={[
                  { label: "Product name", placeholder: "e.g. Tomato Passata" },
                  { label: "Unit", placeholder: "e.g. pcs" },
                  { label: "Supplier", placeholder: "e.g. Green Valley" },
                  { label: "Initial quantity", placeholder: "e.g. 20", type: "number" },
               ]}
            />
            <SearchBar />
         </div>
         <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
            <div key={selectedProduct?.name ?? "no-selection"} className="space-y-4">
               <div>
                  <h2 className="text-text-700 text-xl font-medium">Edit Product</h2>
                  <p className="text-text-500 mt-1 text-sm">Values are loaded from the selected product.</p>
               </div>
               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                     <span className="text-text-700 text-sm font-medium">Product name</span>
                     <input
                        defaultValue={selectedProduct?.name ?? ""}
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                     />
                  </label>
                  <label className="space-y-1">
                     <span className="text-text-700 text-sm font-medium">Unit</span>
                     <input
                        defaultValue={selectedProduct?.unit ?? ""}
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                     />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                     <span className="text-text-700 text-sm font-medium">Category</span>
                     <input
                        defaultValue="General"
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                     />
                  </label>
               </div>
               <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                     Cancel
                  </Button>
                  <Button type="button" onClick={() => setIsEditOpen(false)}>
                     Save draft
                  </Button>
               </div>
            </div>
         </Modal>
      </div>
   )
}

export default Header
