import type { ReactNode } from "react"

export interface DataColumn<T> {
   id: string
   header: string
   cell: (row: T) => ReactNode
   hideOnMobile?: boolean
}

interface ResponsiveDataViewProps<T> {
   columns: DataColumn<T>[]
   rows: T[]
   rowKey: (row: T) => string | number
   emptyMessage?: string
   desktopGridClass: string
   desktopMinWidth?: string
   rowPrefix?: (row: T) => ReactNode
   onRowClick?: (row: T) => void
}

export function ResponsiveDataView<T>({
   columns,
   rows,
   rowKey,
   emptyMessage = "Brak danych.",
   desktopGridClass,
   desktopMinWidth = "min-w-[40rem]",
   rowPrefix,
   onRowClick,
}: ResponsiveDataViewProps<T>) {
   const mobileColumns = columns.filter(c => !c.hideOnMobile)

   if (rows.length === 0) {
      return (
         <p className="text-text-500 border-border-300 rounded-sm border border-dashed bg-background px-4 py-8 text-center text-sm">
            {emptyMessage}
         </p>
      )
   }

   return (
      <>
         <div className="space-y-3 md:hidden">
            {rows.map(row => {
               const key = rowKey(row)
               const inner = (
                  <article className="rounded-md border border-border-300 bg-background p-4 shadow-sm">
                     {rowPrefix ? <div className="mb-3 flex items-start gap-3">{rowPrefix(row)}</div> : null}
                     <dl className="space-y-2">
                        {mobileColumns.map(col => (
                           <div key={col.id} className="flex items-start justify-between gap-3 text-sm">
                              <dt className="text-text-400 shrink-0">{col.header}</dt>
                              <dd className="text-text-700 min-w-0 text-right">{col.cell(row)}</dd>
                           </div>
                        ))}
                     </dl>
                  </article>
               )
               if (onRowClick) {
                  return (
                     <button
                        key={key}
                        type="button"
                        onClick={() => onRowClick(row)}
                        className="block w-full text-left"
                     >
                        {inner}
                     </button>
                  )
               }
               return <div key={key}>{inner}</div>
            })}
         </div>

         <div className="table-scroll hidden md:block">
            <div className={`rounded-sm border border-border-300 bg-background ${desktopMinWidth}`}>
               <div
                  className={`grid border-b border-border-300 px-3 py-3 text-sm font-medium text-text-700 sm:px-4 ${desktopGridClass}`}
               >
                  {rowPrefix ? <p /> : null}
                  {columns.map(col => (
                     <p key={col.id}>{col.header}</p>
                  ))}
               </div>
               {rows.map(row => {
                  const key = rowKey(row)
                  const rowClass = `grid border-b border-border-300 px-3 py-3 text-sm text-text-500 last:border-0 sm:px-4 ${desktopGridClass} ${
                     onRowClick ? "hover:bg-surface cursor-pointer transition-colors" : ""
                  }`
                  const content = (
                     <>
                        {rowPrefix ? <div className="flex justify-center">{rowPrefix(row)}</div> : null}
                        {columns.map(col => (
                           <div key={col.id} className="min-w-0">
                              {col.cell(row)}
                           </div>
                        ))}
                     </>
                  )
                  if (onRowClick) {
                     return (
                        <button key={key} type="button" onClick={() => onRowClick(row)} className={`w-full text-left ${rowClass}`}>
                           {content}
                        </button>
                     )
                  }
                  return (
                     <div key={key} className={rowClass}>
                        {content}
                     </div>
                  )
               })}
            </div>
         </div>
      </>
   )
}
