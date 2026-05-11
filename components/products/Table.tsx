import type { ProductCatalog } from "@/lib/data"

const columnGrid = "grid w-full grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,auto)_minmax(6rem,auto)]"

const headerCell = "px-4 pb-3 text-left text-sm font-medium text-text-700 "

const bodyCell = "border-border-300 border-r px-4 py-4 text-left text-sm text-text-700 last:border-r-0"

interface TableProps {
   products: ProductCatalog[]
   selectedProductNames: string[]
   onToggleProduct: (productName: string) => void
}

const Table = ({ products, selectedProductNames, onToggleProduct }: TableProps) => {
   return (
      <div className="w-full overflow-x-auto">
         <div className={`${columnGrid} min-w-[42rem]`}>
            <div className={`${headerCell} flex justify-center`}>
               <span className="sr-only">Select product</span>
            </div>
            <div className={headerCell}>Name</div>
            <div className={headerCell}>Unit</div>
            <div className={`${headerCell} text-center`}>Is active</div>
         </div>

         <div className="divide-border-300 border-border-300 bg-background min-w-[42rem] divide-y overflow-hidden rounded-md border">
            {products.map((value, index) => (
               <div key={`${value.name}-${index}`} className={columnGrid}>
                  <div className={`${bodyCell} flex justify-center`}>
                     <input
                        type="checkbox"
                        checked={selectedProductNames.includes(value.name)}
                        onChange={() => onToggleProduct(value.name)}
                        aria-label={`Select ${value.name}`}
                        className="h-4 w-4 accent-primary-500"
                     />
                  </div>
                  <div className={bodyCell}>{value.name}</div>
                  <div className={bodyCell}>{value.unit}</div>
                  <div className={`${bodyCell} text-center`}>{value.isActive ? "Yes" : "No"}</div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default Table
