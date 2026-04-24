import Header from "@/components/employees/Header"
import Table from "@/components/employees/Table"
import { DUMMY_EMPLOYEE_DATA } from "@/lib/data"
import Button from "@/components/ui/Button"
import { MapPinIcon } from "@heroicons/react/24/outline"

const EmployeesPage = () => {
   return (
      <div className="flex flex-col gap-10 py-10">
         <Header title="Employees" icon={MapPinIcon} iconLabel="Poznan, Poland" />
         <Table employees={DUMMY_EMPLOYEE_DATA} />
         <div className="flex justify-end">
            <Button>Add Employee</Button>
         </div>
      </div>
   )
}

export default EmployeesPage
