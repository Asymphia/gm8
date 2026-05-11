"use client"

import { MapPinIcon } from "@heroicons/react/24/outline"
import Header from "@/components/products/Header"
import Table from "@/components/products/Table"
import { DUMMY_PRODUCT_CATALOG_DATA } from "@/lib/data"
import { useMemo, useState } from "react"

const ProductsContent = () => {
   const [selectedProductNames, setSelectedProductNames] = useState<string[]>([])

   const selectedProducts = useMemo(
      () => DUMMY_PRODUCT_CATALOG_DATA.filter(product => selectedProductNames.includes(product.name)),
      [selectedProductNames]
   )

   const handleToggleProduct = (productName: string) => {
      setSelectedProductNames(previous =>
         previous.includes(productName) ? previous.filter(name => name !== productName) : [...previous, productName]
      )
   }

   return (
      <>
         <Header title="Product list" icon={MapPinIcon} iconLabel="Poznan, Poland" selectedProducts={selectedProducts} />
         <Table
            products={DUMMY_PRODUCT_CATALOG_DATA}
            selectedProductNames={selectedProductNames}
            onToggleProduct={handleToggleProduct}
         />
      </>
   )
}

export default ProductsContent
