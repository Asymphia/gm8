"use client"

import { MapPinIcon } from "@heroicons/react/24/outline"
import Header from "@/components/products/Header"
import Table from "@/components/products/Table"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { productUnitLabel } from "@/lib/product-units"
import { useMemo, useState } from "react"

const ProductsContent = () => {
   const { products, ready, loadError } = useProductCatalog()
   const [selectedIds, setSelectedIds] = useState<number[]>([])

   const catalogView = useMemo(
      () =>
         products.map(p => ({
            id: p.id,
            name: p.name,
            unit: productUnitLabel(p.unit),
            unitCode: p.unit,
            isActive: p.is_active,
         })),
      [products]
   )

   const selectedProducts = useMemo(
      () => catalogView.filter(p => selectedIds.includes(p.id)),
      [catalogView, selectedIds]
   )

   const handleToggleProduct = (id: number) => {
      setSelectedIds(previous =>
         previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]
      )
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie produktów…</p>
   }

   return (
      <>
         {loadError ? <p className="text-warning mb-4 text-sm">{loadError}</p> : null}
         <Header
            title="Lista produktów"
            icon={MapPinIcon}
            iconLabel="Poznań, Polska"
            selectedProducts={selectedProducts}
            onProductsMutated={() => setSelectedIds([])}
         />
         <Table
            products={catalogView}
            selectedIds={selectedIds}
            onToggleProduct={handleToggleProduct}
         />
      </>
   )
}

export default ProductsContent
