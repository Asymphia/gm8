import Header from "@/components/employees/Header"
import Table from "@/components/employees/Table"
import { DUMMY_EMPLOYEE_DATA } from "@/lib/data"
import Button from "@/components/ui/Button"

const EmployeesPage = () => {
   return (
      <div className="py-10">
         <Header />
         <Table employees={DUMMY_EMPLOYEE_DATA} />
         <div className="mt-6 flex justify-end">
            <Button>Add Employee</Button>
         </div>
      </div>
   )
}

export default EmployeesPage
