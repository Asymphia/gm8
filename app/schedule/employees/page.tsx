"use client"

import { RequireOwner } from "@/components/auth/RequireOwner"
import EmployeesContent from "@/components/employees/EmployeesContent"
import BackLink from "@/components/ui/BackLink"

const EmployeesPage = () => {
   return (
      <RequireOwner title="Zarządzanie pracownikami">
         <div className="flex flex-col gap-6 py-6 sm:gap-10 sm:py-10">
            <BackLink href="/schedule" label="Powrót do harmonogramu" />
            <EmployeesContent />
         </div>
      </RequireOwner>
   )
}

export default EmployeesPage
