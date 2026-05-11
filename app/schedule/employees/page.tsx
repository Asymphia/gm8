import EmployeesContent from "@/components/employees/EmployeesContent"
import BackLink from "@/components/ui/BackLink"

const EmployeesPage = () => {
   return (
      <div className="flex flex-col gap-6 py-6 sm:gap-10 sm:py-10">
         <BackLink href="/schedule" label="Back to schedule" />
         <EmployeesContent />
      </div>
   )
}

export default EmployeesPage
