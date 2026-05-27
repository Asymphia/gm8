"use client"

import Header from "@/components/employees/Header"
import { MapPinIcon } from "@heroicons/react/24/outline"
import Table from "@/components/employees/Table"
import type { EmployeeType } from "@/lib/data"
import { mockDb } from "@/lib/mock-db"
import QuickActionModal from "@/components/ui/QuickActionModal"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { useCallback, useEffect, useMemo, useState } from "react"
import { isApiEnabled } from "@/lib/api/config"
import { createUser, deleteUser, fetchUsers, updateUser } from "@/lib/api/users-api"
import type { UserDto } from "@/lib/api/types"
import { appRoleToApiRoles } from "@/lib/api/mappers"
import {
   EMPLOYEE_PASSWORD_HINT,
   formatCaughtError,
   usernameFromEmail,
   validateNewEmployeeInput,
} from "@/lib/format-api-error"

const seedEmployees = (): EmployeeType[] =>
   mockDb.users.map(user => ({
      id: String(user.id),
      name: user.first_name,
      surname: user.last_name,
      phone: user.phone,
      email: user.email,
      active: user.is_active,
   }))

function userDtoToEmployee(user: UserDto): EmployeeType {
   return {
      id: user.id,
      name: user.firstName,
      surname: user.lastName,
      phone: "—",
      email: user.email,
      active: user.isActive,
      roles: user.roles,
   }
}

const EmployeesContent = () => {
   const useApi = isApiEnabled()
   const [employees, setEmployees] = useState<EmployeeType[]>(seedEmployees)
   const [loading, setLoading] = useState(useApi)
   const [error, setError] = useState<string | null>(null)
   const [editOpen, setEditOpen] = useState(false)
   const [removeOpen, setRemoveOpen] = useState(false)
   const [employeesEditKey, setEmployeesEditKey] = useState(0)
   const [employeesRemoveKey, setEmployeesRemoveKey] = useState(0)

   const reload = useCallback(async () => {
      if (!useApi) {
         setEmployees(seedEmployees())
         return
      }
      setLoading(true)
      setError(null)
      try {
         const rows = await fetchUsers()
         setEmployees(rows.filter(u => u.isActive).map(userDtoToEmployee))
      } catch (err) {
         setError(formatCaughtError(err, "Nie udało się pobrać pracowników."))
      } finally {
         setLoading(false)
      }
   }, [useApi])

   useEffect(() => {
      void reload()
   }, [reload])

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
         <Header title="Pracownicy" icon={MapPinIcon} iconLabel="Poznań, Polska" />
         {error ? <p className="text-warning mb-3 text-sm">{error}</p> : null}
         {loading ? <p className="text-text-500 mb-3 text-sm">Ładowanie pracowników…</p> : null}
         <Table employees={employees} />
         <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
               type="button"
               variant="outline"
               className="min-h-11 w-full sm:w-auto"
               disabled={employees.length === 0}
               onClick={() => {
                  setEmployeesEditKey(previous => previous + 1)
                  setEditOpen(true)
               }}
            >
               Edytuj pracownika…
            </Button>
            <Button
               type="button"
               variant="warning"
               className="min-h-11 w-full sm:w-auto"
               disabled={employees.length === 0}
               onClick={() => {
                  setEmployeesRemoveKey(previous => previous + 1)
                  setRemoveOpen(true)
               }}
            >
               Usuń z listy…
            </Button>
            <QuickActionModal
               triggerLabel="Dodaj pracownika"
               title="Dodaj pracownika"
               cancelLabel="Anuluj"
               confirmLabel="Dodaj"
               description={useApi ? EMPLOYEE_PASSWORD_HINT : undefined}
               triggerVariant="primary"
               fields={[
                  { name: "first_name", label: "Imię", placeholder: "Jan" },
                  { name: "last_name", label: "Nazwisko", placeholder: "Kowalska" },
                  { name: "phone", label: "Telefon", placeholder: "+48 500 000 000", type: "tel" },
                  { name: "email", label: "E-mail", placeholder: "jan.kowalska@firma.pl", type: "email" },
                  ...(useApi
                     ? [
                          {
                             name: "password",
                             label: "Hasło",
                             placeholder: "min. 6 znaków, np. demo12",
                             type: "password" as const,
                          },
                          {
                             kind: "select" as const,
                             name: "role",
                             label: "Rola",
                             options: [
                                { value: "employee", label: "Pracownik" },
                                { value: "owner", label: "Właściciel (Admin)" },
                             ],
                          },
                       ]
                     : []),
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
               onConfirm={async vals => {
                  const validationError = validateNewEmployeeInput(vals)
                  if (validationError) {
                     throw new Error(validationError)
                  }

                  const emailLower = vals.email!.trim().toLowerCase()
                  if (employees.some(e => e.email.toLowerCase() === emailLower)) {
                     throw new Error("Ten adres e-mail jest już na liście pracowników.")
                  }

                  if (useApi) {
                     try {
                        const appRole = vals.role === "owner" ? "owner" : "employee"
                        await createUser({
                           userName: usernameFromEmail(emailLower),
                           firstName: vals.first_name!.trim(),
                           lastName: vals.last_name!.trim(),
                           email: vals.email!.trim(),
                           password: vals.password!.trim(),
                           roles: appRoleToApiRoles(appRole),
                           isActive: vals.active === "yes",
                        })
                        setError(null)
                        await reload()
                     } catch (err) {
                        throw new Error(formatCaughtError(err, "Nie udało się dodać pracownika."))
                     }
                     return
                  }

                  setEmployees(previous => [
                     ...previous,
                     {
                        name: vals.first_name?.trim() || "—",
                        surname: vals.last_name?.trim() || "—",
                        phone: vals.phone?.trim() || "—",
                        email: vals.email!.trim(),
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
               useApi={useApi}
               onSave={async next => {
                  if (useApi) {
                     await reload()
                  } else {
                     setEmployees(next)
                  }
               }}
            />
         ) : null}
         {removeOpen ? (
            <RemoveEmployeeModal
               key={`er-${employeesRemoveKey}`}
               open={removeOpen}
               onClose={() => setRemoveOpen(false)}
               employees={employees}
               options={options}
               useApi={useApi}
               onSave={async next => {
                  if (useApi) {
                     await reload()
                  } else {
                     setEmployees(next)
                  }
               }}
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
   useApi,
   onSave,
}: {
   open: boolean
   onClose: () => void
   employees: EmployeeType[]
   options: { value: string; label: string }[]
   useApi: boolean
   onSave: (next: EmployeeType[]) => void | Promise<void>
}) {
   const [emailPick, setEmailPick] = useState(() => employees[0]?.email ?? "")
   const [name, setName] = useState(() => employees.find(e => e.email === employees[0]?.email)?.name ?? "")
   const [surname, setSurname] = useState(() => employees.find(e => e.email === employees[0]?.email)?.surname ?? "")
   const [phone, setPhone] = useState(() => employees.find(e => e.email === employees[0]?.email)?.phone ?? "")
   const [active, setActive] = useState(() => employees.find(e => e.email === employees[0]?.email)?.active ?? true)
   const [saving, setSaving] = useState(false)

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

   const handleSave = async () => {
      const picked = employees.find(e => e.email === emailPick)
      if (!picked) return

      if (useApi && picked.id) {
         setSaving(true)
         try {
            await updateUser(picked.id, {
               firstName: name,
               lastName: surname,
               email: emailPick,
               isActive: active,
            })
            await onSave(employees)
            onClose()
         } catch {
         } finally {
            setSaving(false)
         }
         return
      }

      await onSave(
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
            {!useApi ? (
               <label className="flex flex-col gap-1">
                  <span className="text-text-700 text-sm font-medium">Telefon</span>
                  <input
                     value={phone}
                     onChange={e => setPhone(e.target.value)}
                     className="border-border-300 focus:border-primary-500 rounded-sm border px-3 py-2 text-sm outline-none"
                  />
               </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium text-text-700">
               <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
               Aktywny
            </label>
            <div className="flex justify-end gap-2 border-t border-border-300 pt-3">
               <Button type="button" variant="outline" onClick={onClose}>
                  Anuluj
               </Button>
               <Button type="button" variant="primary" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Zapisywanie…" : "Zapisz"}
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
   useApi,
   onSave,
}: {
   open: boolean
   onClose: () => void
   employees: EmployeeType[]
   options: { value: string; label: string }[]
   useApi: boolean
   onSave: (next: EmployeeType[]) => void | Promise<void>
}) {
   const [emailPick, setEmailPick] = useState(() => employees[0]?.email ?? "")
   const [removing, setRemoving] = useState(false)

   if (!open) return null

   const handleRemove = async () => {
      const ok = typeof window !== "undefined" ? window.confirm("Na pewno usunąć tę osobę?") : true
      if (!ok) return

      const picked = employees.find(e => e.email === emailPick)

      if (useApi && picked?.id) {
         setRemoving(true)
         try {
            await deleteUser(picked.id)
            await onSave(employees)
            onClose()
         } catch (err) {
            const message = formatCaughtError(err, "Nie udało się usunąć pracownika.")
            if (typeof window !== "undefined") window.alert(message)
         } finally {
            setRemoving(false)
         }
         return
      }

      await onSave(employees.filter(e => e.email !== emailPick))
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
               <Button type="button" variant="warning" onClick={() => void handleRemove()} disabled={removing}>
                  {removing ? "Usuwanie…" : "Usuń"}
               </Button>
            </div>
         </div>
      </Modal>
   )
}

export default EmployeesContent
