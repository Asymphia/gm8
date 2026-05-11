"use client"

import Header from "@/components/employees/Header"
import { MapPinIcon } from "@heroicons/react/24/outline"
import Table from "@/components/employees/Table"
import type { EmployeeType } from "@/lib/data"
import { mockDb } from "@/lib/mock-db"
import QuickActionModal from "@/components/ui/QuickActionModal"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { useMemo, useState } from "react"

const seedEmployees = (): EmployeeType[] =>
   mockDb.users.map(user => ({
      name: user.first_name,
      surname: user.last_name,
      phone: user.phone,
      email: user.email,
      active: user.is_active,
   }))

const EmployeesContent = () => {
   const [employees, setEmployees] = useState<EmployeeType[]>(seedEmployees)
   const [editOpen, setEditOpen] = useState(false)
   const [removeOpen, setRemoveOpen] = useState(false)
   const [employeesEditKey, setEmployeesEditKey] = useState(0)
   const [employeesRemoveKey, setEmployeesRemoveKey] = useState(0)

   const options = useMemo(
      () =>
         employees.map(row => ({
            value: row.email,
            label: `${row.name} ${row.surname} · ${row.email}${row.active ? "" : " (nieaktywny)"}`,
         })),
      [employees]
   )

   return (
      <>
         <Header title="Employees" icon={MapPinIcon} iconLabel="Poznan, Poland" />
         <Table employees={employees} />
         <div className="flex flex-wrap justify-end gap-2">
            <Button
               type="button"
               variant="outline"
               size="sm"
               disabled={employees.length === 0}
               onClick={() => {
                  setEmployeesEditKey(previous => previous + 1)
                  setEditOpen(true)
               }}
            >
               Edit employee…
            </Button>
            <Button
               type="button"
               variant="warning"
               size="sm"
               disabled={employees.length === 0}
               onClick={() => {
                  setEmployeesRemoveKey(previous => previous + 1)
                  setRemoveOpen(true)
               }}
            >
               Remove employee…
            </Button>
            <QuickActionModal
               triggerLabel="Add Employee"
               title="Add Employee"
               cancelLabel="Anuluj"
               confirmLabel="Add"
               fields={[
                  { name: "first_name", label: "First name", placeholder: "Anna" },
                  { name: "last_name", label: "Last name", placeholder: "Kowalska" },
                  { name: "phone", label: "Phone", placeholder: "+48 500 000 000", type: "tel" },
                  { name: "email", label: "Email", placeholder: "name@company.com", type: "email" },
                  {
                     kind: "select",
                     name: "active",
                     label: "Status",
                     options: [
                        { value: "yes", label: "Aktywny" },
                        { value: "no", label: "Nieaktywny" },
                     ],
                  },
               ]}
               onConfirm={vals => {
                  const emailLower = vals.email?.trim().toLowerCase()
                  if (!emailLower) return
                  if (employees.some(e => e.email.toLowerCase() === emailLower)) return
                  setEmployees(previous => [
                     ...previous,
                     {
                        name: vals.first_name?.trim() || "—",
                        surname: vals.last_name?.trim() || "—",
                        phone: vals.phone?.trim() || "—",
                        email: vals.email.trim(),
                        active: vals.active === "yes",
                     },
                  ])
               }}
            />
         </div>

         {editOpen ? (
            <EditEmployeeModal
               key={`ee-${employeesEditKey}`}
               open={editOpen}
               onClose={() => setEditOpen(false)}
               employees={employees}
               options={options}
               onSave={setEmployees}
            />
         ) : null}
         {removeOpen ? (
            <RemoveEmployeeModal
               key={`er-${employeesRemoveKey}`}
               open={removeOpen}
               onClose={() => setRemoveOpen(false)}
               employees={employees}
               options={options}
               onSave={setEmployees}
            />
         ) : null}
      </>
   )
}

function EditEmployeeModal({
   open,
   onClose,
   employees,
   options,
   onSave,
}: {
   open: boolean
   onClose: () => void
   employees: EmployeeType[]
   options: { value: string; label: string }[]
   onSave: (next: EmployeeType[]) => void
}) {
   const [emailPick, setEmailPick] = useState(() => employees[0]?.email ?? "")
   const [name, setName] = useState(() => employees.find(e => e.email === employees[0]?.email)?.name ?? "")
   const [surname, setSurname] = useState(() => employees.find(e => e.email === employees[0]?.email)?.surname ?? "")
   const [phone, setPhone] = useState(() => employees.find(e => e.email === employees[0]?.email)?.phone ?? "")
   const [active, setActive] = useState(() => employees.find(e => e.email === employees[0]?.email)?.active ?? true)

   if (!open || options.length === 0) return null

   const syncPick = (em: string) => {
      setEmailPick(em)
      const picked = employees.find(e => e.email === em)
      if (picked) {
         setName(picked.name)
         setSurname(picked.surname)
         setPhone(picked.phone)
         setActive(picked.active)
      }
   }

   const handleSave = () => {
      onSave(
         employees.map(e =>
            e.email === emailPick
               ? {
                    ...e,
                    name,
                    surname,
                    phone,
                    active,
                 }
               : e
         )
      )
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Edycja pracownika</h2>
               <p className="text-text-500 mt-1 text-sm">Wybór z listy — email (klucz) pozostaje bez zmian.</p>
            </div>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Osoba</span>
               <select
                  value={emailPick}
                  onChange={e => syncPick(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Imię</span>
               <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Nazwisko</span>
               <input
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Telefon</span>
               <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-text-700">
               <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
               Aktywny
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="primary" onClick={handleSave}>
                  Zapisz
               </Button>
            </div>
         </div>
      </Modal>
   )
}

function RemoveEmployeeModal({
   open,
   onClose,
   employees,
   options,
   onSave,
}: {
   open: boolean
   onClose: () => void
   employees: EmployeeType[]
   options: { value: string; label: string }[]
   onSave: (next: EmployeeType[]) => void
}) {
   const [emailPick, setEmailPick] = useState(() => employees[0]?.email ?? "")

   if (!open) return null

   const handleRemove = () => {
      const ok = typeof window !== "undefined" ? window.confirm("Na pewno usunąć tę osobę z widoku listy (mock)?") : true
      if (!ok) return
      onSave(employees.filter(e => e.email !== emailPick))
      onClose()
   }

   return (
      <Modal isOpen={open} onClose={onClose}>
         <div className="space-y-4">
            <div>
               <h2 className="text-text-700 text-xl font-medium">Usuń z listy</h2>
               <p className="text-text-500 mt-1 text-sm">Wybierz rekord — bez wpisywania maila.</p>
            </div>
            <label className="flex flex-col gap-1">
               <span className="text-text-700 text-sm font-medium">Osoba</span>
               <select
                  value={emailPick}
                  onChange={e => setEmailPick(e.target.value)}
                  className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
               >
                  {options.map(o => (
                     <option key={o.value} value={o.value}>
                        {o.label}
                     </option>
                  ))}
               </select>
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="warning" onClick={handleRemove}>
                  Usuń
               </Button>
            </div>
         </div>
      </Modal>
   )
}

export default EmployeesContent
