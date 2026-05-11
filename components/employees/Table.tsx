import type { EmployeeType } from "@/lib/data"

const columnGrid = "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(4.5rem,auto)]"

const headerCell = "px-4 pb-3 text-left text-sm font-medium text-text-700 "

const bodyCell = "border-border-300 border-r px-4 py-4 text-left text-sm text-text-700 last:border-r-0"

interface TableProps {
   employees: EmployeeType[]
}

const Table = ({ employees }: TableProps) => {
   return (
      <div className="w-full overflow-x-auto">
         <div className={`${columnGrid} min-w-[46rem]`}>
            <div className={headerCell}>Name</div>
            <div className={headerCell}>Surname</div>
            <div className={headerCell}>Phone</div>
            <div className={headerCell}>Email</div>
            <div className={`${headerCell} text-center`}>Active</div>
         </div>

         <div className="divide-border-300 border-border-300 bg-background min-w-[46rem] divide-y overflow-hidden rounded-md border">
            {employees.map(value => (
               <div key={value.email} className={columnGrid}>
                  <div className={bodyCell}>{value.name}</div>
                  <div className={bodyCell}>{value.surname}</div>
                  <div className={bodyCell}>{value.phone}</div>
                  <div className={bodyCell}>{value.email}</div>
                  <div className={`${bodyCell} text-center`}>{value.active ? "Yes" : "No"}</div>
               </div>
            ))}
         </div>
      </div>
   )
}

export default Table
