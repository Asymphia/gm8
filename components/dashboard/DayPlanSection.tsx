"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { collectDayPlan } from "@/lib/day-plan"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PLANNER_UPDATED_EVENT } from "@/lib/schedule-planner-storage"

const DayPlanSection = () => {
   const { session, isOwner } = useAuth()
   const [plannerTick, setPlannerTick] = useState(0)

   useEffect(() => {
      const bump = () => setPlannerTick(t => t + 1)
      window.addEventListener(PLANNER_UPDATED_EVENT, bump)
      window.addEventListener("storage", bump)
      return () => {
         window.removeEventListener(PLANNER_UPDATED_EVENT, bump)
         window.removeEventListener("storage", bump)
      }
   }, [])

   const entries = useMemo(() => {
      if (!session) return []
      void plannerTick
      return collectDayPlan(isOwner ? undefined : session.userId)
   }, [session, isOwner, plannerTick])

   const todayLabel = useMemo(
      () =>
         new Intl.DateTimeFormat("pl-PL", {
            weekday: "long",
            day: "numeric",
            month: "long",
         }).format(new Date()),
      []
   )

   return (
      <section className="rounded-md border border-border-300 bg-background p-4 shadow-sm lg:col-span-2 lg:row-span-1">
         <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
               <h2 className="text-text-700 text-lg font-semibold tracking-tight">Plan dnia</h2>
               <p className="text-text-500 text-xs capitalize">{todayLabel}</p>
            </div>
            {isOwner ? (
               <Link href="/schedule/plan" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                  Kalendarz zmian →
               </Link>
            ) : (
               <Link href="/notifications" className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                  Ogłoszenia →
               </Link>
            )}
         </div>
         {entries.length === 0 ? (
            <p className="text-text-500 text-sm">
               {isOwner
                  ? "Brak zaplanowanych zmian na dziś — dodaj je w kalendarzu."
                  : "Brak Twoich zmian na dziś."}
            </p>
         ) : (
            <ul className="divide-border-300 divide-y">
               {entries.map(row => (
                  <li key={row.id} className="grid grid-cols-1 gap-1 py-3 text-sm sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3">
                     <span className="text-text-700 font-medium tabular-nums">
                        {row.start}–{row.end}
                     </span>
                     {isOwner ? (
                        <span className="text-text-500 sm:text-center">{row.employeeName}</span>
                     ) : (
                        <span className="hidden sm:block" />
                     )}
                     <span className="text-text-500 min-w-0 sm:text-right">{row.note || "—"}</span>
                  </li>
               ))}
            </ul>
         )}
      </section>
   )
}

export default DayPlanSection
