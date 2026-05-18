import ProductsContent from "@/components/products/ProductsContent"
import BackLink from "@/components/ui/BackLink"

const ProductsPage = () => {
   return (
      <div className="space-y-6">
         <BackLink href="/warehouse" label="Powrót do magazynu" />
         <ProductsContent />
      </div>
   )
}

export default ProductsPage
