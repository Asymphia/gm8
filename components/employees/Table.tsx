import type { EmployeeType } from "@/lib/data"
import { ResponsiveDataView } from "@/components/ui/ResponsiveDataView"

interface TableProps {
   employees: EmployeeType[]
}

const Table = ({ employees }: TableProps) => {
   return (
      <ResponsiveDataView
         rows={employees}
         rowKey={row => row.email}
         emptyMessage="Brak pracowników na liście."
         desktopGridClass="grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_5rem]"
         desktopMinWidth="min-w-[46rem]"
         columns={[
            { id: "name", header: "Imię", cell: r => r.name },
            { id: "surname", header: "Nazwisko", cell: r => r.surname },
            { id: "phone", header: "Telefon", cell: r => <span className="tabular-nums">{r.phone}</span> },
            { id: "email", header: "E-mail", cell: r => <span className="break-all">{r.email}</span> },
            {
               id: "active",
               header: "Aktywny",
               cell: r => (
                  <span className={r.active ? "text-primary-500 font-medium" : "text-text-300"}>
                     {r.active ? "Tak" : "Nie"}
                  </span>
               ),
            },
         ]}
      />
   )
}

export default Table
