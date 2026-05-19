"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import EmployeeShiftCalendar from "@/components/schedule/EmployeeShiftCalendar"
import { useSchedulePlanner } from "@/components/schedule/SchedulePlannerProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { mockDb } from "@/lib/mock-db"
import Link from "next/link"

const SchedulePage = () => {
   const { isOwner } = useAuth()
   const planner = useSchedulePlanner()

   const ownerItems = [
      {
         href: "/schedule/plan",
         label: "Zmiany w kalendarzu",
         description: "FullCalendar — jeden pracownik naraz · edycja w API.",
         value: planner.ready ? String(planner.shifts.length) : "…",
      },
      {
         href: "/schedule/employees",
         label: "Pracownicy",
         description: "Lista zespołu, role i kontakt.",
         value: String(mockDb.users.length),
      },
   ]

   if (!isOwner) {
      return (
         <div className="space-y-6">
            <div>
               <h1>Mój grafik</h1>
               <p className="text-text-500 mt-1 max-w-2xl">
                  Twój plan zmian — widok dnia i tygodnia. Tylko podgląd; zmiany ustala właściciel w{" "}
                  <span className="text-text-400">kalendarzu zespołu</span>.
               </p>
            </div>

            {planner.loadError ? (
               <p className="text-warning text-sm">{planner.loadError}</p>
            ) : null}

            {!planner.ready ? (
               <p className="text-text-500 text-sm">Ładowanie grafiku…</p>
            ) : planner.shifts.length === 0 ? (
               <p className="text-text-500 text-sm">
                  Brak zaplanowanych zmian w tym okresie. Sprawdź ponownie później lub skontaktuj się z
                  kierownikiem.
               </p>
            ) : null}

            <div className="border-border-300 rounded-md border bg-background p-2 shadow-sm sm:p-3">
               <EmployeeShiftCalendar plannerShifts={planner.shifts} />
            </div>
         </div>
      )
   }

   return (
      <div className="space-y-8">
         <div>
            <h1>Harmonogram</h1>
            <p className="text-text-500 mt-1 max-w-2xl">
               Plan oparty na kalendarzu — zmiany per pracownik. Szczegóły:{" "}
               <Link href="/schedule/plan" className="text-primary-500 font-medium hover:underline">
                  Zmiany w kalendarzu
               </Link>
               .
            </p>
         </div>

         <HubNavigationGrid items={ownerItems} />
      </div>
   )
}

export default SchedulePage
