"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import FeatureSection from "@/components/features/FeatureSection"
import { useSchedulePlanner } from "@/components/schedule/SchedulePlannerProvider"
import { HubNavigationGrid } from "@/components/ui/HubNavigationGrid"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"
import { mockDb } from "@/lib/mock-db"
import Link from "next/link"

const SchedulePage = () => {
   const { isOwner } = useAuth()
   const scheduleGroup = APP_FEATURE_GROUPS.find(group => group.route === "/schedule")
   const planner = useSchedulePlanner()

   const ownerItems = [
      {
         href: "/schedule/plan",
         label: "Zmiany w kalendarzu",
         description: "FullCalendar — jeden pracownik naraz · zapis w localStorage.",
         value: planner.ready ? String(planner.shifts.length) : "…",
      },
      {
         href: "/schedule/employees",
         label: "Pracownicy",
         description: "Lista zespołu, role i kontakt.",
         value: String(mockDb.users.length),
      },
   ]

   const employeeItems = [
      {
         href: "/",
         label: "Plan dnia",
         description: "Twoje zaplanowane zmiany na dziś — na pulpicie.",
         value: "Dziś",
      },
      {
         href: "/notifications/board",
         label: "Ogłoszenia",
         description: "Przeglądaj komunikaty zespołu (tylko odczyt).",
         value: String(mockDb.announcements.filter(a => a.is_published).length),
      },
   ]

   const items = isOwner ? ownerItems : employeeItems

   return (
      <div className="space-y-8">
         <div>
            <h1>Harmonogram</h1>
            <p className="text-text-500 mt-1 max-w-2xl">
               {isOwner ? (
                  <>
                     Plan oparty na kalendarzu — zmiany per pracownik, z edycją i zapisem w przeglądarce. Szczegóły:{" "}
                     <Link href="/schedule/plan" className="text-primary-500 font-medium hover:underline">
                        Zmiany w kalendarzu
                     </Link>
                     .
                  </>
               ) : (
                  <>
                     Jako pracownik widzisz swój plan dnia na{" "}
                     <Link href="/" className="text-primary-500 font-medium hover:underline">
                        pulpicie
                     </Link>{" "}
                     oraz ogłoszenia zespołu.
                  </>
               )}
            </p>
         </div>

         <HubNavigationGrid items={items} />
         {scheduleGroup ? <FeatureSection group={scheduleGroup} /> : null}
      </div>
   )
}

export default SchedulePage
