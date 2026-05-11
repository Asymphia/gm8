"use client"

import FeatureSection from "@/components/features/FeatureSection"
import { useSchedulePlanner } from "@/components/schedule/SchedulePlannerProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"
import { mockDb } from "@/lib/mock-db"
import Link from "next/link"

const SchedulePage = () => {
   const scheduleGroup = APP_FEATURE_GROUPS.find(group => group.route === "/schedule")
   const planner = useSchedulePlanner()

   const items = [
      {
         href: "/schedule/plan",
         label: "Zmiany w kalendarzu",
         description: "FullCalendar dla jednego pracownika naraz · zapis w localStorage.",
         value: planner.ready ? String(planner.shifts.length) : "…",
      },
      {
         href: "/schedule/employees",
         label: "Pracownicy",
         description: "Lista zespołu, role i kontakt.",
         value: String(mockDb.users.length),
      },
   ]

   return (
      <div className="space-y-8">
         <div>
            <h1>Harmonogram</h1>
            <p className="text-text-500 mt-1 max-w-2xl">
               Plan oparty na kalendarzu — zmiany per pracownik, z edycją i zapisem w przeglądarce. Szczegóły:{" "}
               <Link href="/schedule/plan" className="text-primary-500 font-medium hover:underline">
                  Zmiany w kalendarzu
               </Link>
               .
            </p>
         </div>

         <HubNavigationGrid items={items} />
         {scheduleGroup ? <FeatureSection group={scheduleGroup} /> : null}
      </div>
   )
}

export default SchedulePage
