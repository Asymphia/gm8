"use client"

import { MapPinIcon } from "@heroicons/react/24/outline"
import Header from "@/components/products/Header"
import Table from "@/components/products/Table"
import { useProductCatalog } from "@/components/catalog/ProductCatalogProvider"
import { useMemo, useState } from "react"

const ProductsContent = () => {
   const { products, ready } = useProductCatalog()
   const [selectedProductNames, setSelectedProductNames] = useState<string[]>([])

   const catalogView = useMemo(
      () =>
         products.map(p => ({
            name: p.name,
            unit: p.unit.toUpperCase(),
            isActive: p.is_active,
         })),
      [products]
   )

   const selectedProducts = useMemo(
      () => catalogView.filter(product => selectedProductNames.includes(product.name)),
      [catalogView, selectedProductNames]
   )

   const handleToggleProduct = (productName: string) => {
      setSelectedProductNames(previous =>
         previous.includes(productName) ? previous.filter(name => name !== productName) : [...previous, productName]
      )
   }

   if (!ready) {
      return <p className="text-text-500 text-sm">Ładowanie produktów…</p>
   }

   return (
      <>
         <Header title="Lista produktów" icon={MapPinIcon} iconLabel="Poznań, Polska" selectedProducts={selectedProducts} />
         <Table
            products={catalogView}
            selectedProductNames={selectedProductNames}
            onToggleProduct={handleToggleProduct}
         />
      </>
   )
}

export default ProductsContent
