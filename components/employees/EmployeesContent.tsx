"use client"

import Header from "@/components/employees/Header"
import { MapPinIcon } from "@heroicons/react/24/outline"
import Table from "@/components/employees/Table"
import { DUMMY_EMPLOYEE_DATA } from "@/lib/data"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { useState } from "react"

const EmployeesContent = () => {
   const [open, setOpen] = useState(false)

   return (
      <>
         <Header title="Employees" icon={MapPinIcon} iconLabel="Poznan, Poland" />
         <Table employees={DUMMY_EMPLOYEE_DATA} />
         <div className="flex justify-end">
            <Button type="button" onClick={() => setOpen(true)}>
               Add Employee
            </Button>
         </div>
         <Modal isOpen={open} onClose={() => setOpen(false)}>
            <h2 className="text-text-700 text-xl font-medium">Add Employee</h2>
            <p className="text-text-500 mt-2">Tu pójdzie formularz.</p>
            <div className="mt-6 flex justify-end">
               <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
               </Button>
            </div>
         </Modal>
      </>
   )
}

export default EmployeesContent
