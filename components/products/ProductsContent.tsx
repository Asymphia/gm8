"use client"

import { MapPinIcon } from "@heroicons/react/24/outline"
import Header from "@/components/products/Header"
import Table from "@/components/products/Table"
import { DUMMY_PRODUCT_CATALOG_DATA } from "@/lib/data"

const ProductsContent = () => {
   return (
      <>
         <Header title="Product list" icon={MapPinIcon} iconLabel="Poznan, Poland" />
         <Table products={DUMMY_PRODUCT_CATALOG_DATA} />
      </>
   )
}

export default ProductsContent
