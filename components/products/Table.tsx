import type { ProductRowView } from "@/components/products/Header"

const columnGrid = "grid w-full grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,auto)_minmax(6rem,auto)]"

const headerCell = "px-4 pb-3 text-left text-sm font-medium text-text-700 "

const bodyCell = "border-border-300 border-r px-4 py-4 text-left text-sm text-text-700 last:border-r-0"

interface TableProps {
   products: ProductRowView[]
   selectedIds: number[]
   onToggleProduct: (id: number) => void
}

const Table = ({ products, selectedIds, onToggleProduct }: TableProps) => {
   return (
      <div className="table-scroll w-full md:overflow-x-visible">
         <div className={`${columnGrid} md:min-w-0 min-w-[42rem]`}>
            <div className={`${headerCell} flex justify-center`}>
               <span className="sr-only">Zaznacz produkt</span>
            </div>
            <div className={headerCell}>Nazwa</div>
            <div className={headerCell}>Jednostka</div>
            <div className={`${headerCell} text-center`}>Aktywny</div>
         </div>

         <div className="divide-border-300 border-border-300 bg-background min-w-[42rem] divide-y overflow-hidden rounded-md border">
            {products.length === 0 ? (
               <p className="text-text-500 px-4 py-6 text-sm">Brak produktów w katalogu.</p>
            ) : (
               products.map(product => (
                  <div key={product.id} className={columnGrid}>
                     <div className={`${bodyCell} flex justify-center`}>
                        <input
                           type="checkbox"
                           checked={selectedIds.includes(product.id)}
                           onChange={() => onToggleProduct(product.id)}
                           aria-label={`Zaznacz ${product.name}`}
                           className="h-4 w-4 accent-primary-500"
                        />
                     </div>
                     <div className={bodyCell}>{product.name}</div>
                     <div className={bodyCell}>{product.unit}</div>
                     <div className={`${bodyCell} text-center`}>{product.isActive ? "Tak" : "Nie"}</div>
                  </div>
               ))
            )}
         </div>
      </div>
   )
}

export default Table
