"use client"

import { useMemo, type RefObject } from "react"
import { useMediaQuery } from "@/lib/use-media-query"
import FullCalendar from "@fullcalendar/react"
import type { DateSelectArg, DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import plLocale from "@fullcalendar/core/locales/pl"

import type { PlannerShift } from "@/lib/schedule-planner-storage"

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin]

interface EmployeeShiftCalendarProps {
   plannerShifts: PlannerShift[]
   calendarRef?: RefObject<FullCalendar | null>
   onRangeChange?: (arg: DatesSetArg) => void
   onSelectSlot?: (start: Date, end: Date) => void
   onEventClickShift?: (shift: PlannerShift) => void
}

function toLocalDateTime(date: string, hm: string): string {
   return `${date}T${hm}:00`
}

const EmployeeShiftCalendar = ({
   plannerShifts,
   calendarRef,
   onRangeChange,
   onSelectSlot,
   onEventClickShift,
}: EmployeeShiftCalendarProps) => {
   const isCompact = useMediaQuery("(max-width: 767px)")

   const events: EventInput[] = useMemo(
      () =>
         plannerShifts.map(s => ({
            id: String(s.id),
            title: s.note?.trim() ? s.note : `Zmiana (${s.start_time}–${s.end_time})`,
            start: toLocalDateTime(s.date, s.start_time),
            end: toLocalDateTime(s.date, s.end_time),
            extendedProps: { shift: s } satisfies { shift: PlannerShift },
            backgroundColor: "rgba(113, 88, 255, 0.22)",
            borderColor: "#7158ff",
            textColor: "#1c1f2a",
         })),
      [plannerShifts]
   )

   const handleSelect = (info: DateSelectArg) => {
      if (!onSelectSlot) {
         info.view.calendar.unselect()
         return
      }
      const start = info.start
      const end = info.end
      if (
         start.getFullYear() !== end.getFullYear() ||
         start.getMonth() !== end.getMonth() ||
         start.getDate() !== end.getDate()
      ) {
         info.view.calendar.unselect()
         return
      }
      onSelectSlot(start, end)
      info.view.calendar.unselect()
   }

   const handleEventClick = (info: EventClickArg) => {
      const shift = info.event.extendedProps.shift as PlannerShift | undefined
      if (!shift || !onEventClickShift) return
      onEventClickShift(shift)
   }

   return (
      <div className="fc-wrapper h-[clamp(420px,65vh,900px)] w-full min-w-0 [&_.fc-scrollgrid-sync-table]:border-border-300 [&_.fc]:text-text-700 [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold">
         <FullCalendar
            ref={calendarRef}
            plugins={PLUGINS}
            locale={plLocale}
            buttonText={{ today: "Dziś", day: "Dzień", week: "Tydzień" }}
            headerToolbar={
               isCompact
                  ? { left: "prev,next", center: "title", right: "today" }
                  : { left: "prev,today,next", center: "title", right: "timeGridDay,timeGridWeek" }
            }
            initialView={isCompact ? "timeGridDay" : "timeGridWeek"}
            firstDay={1}
            selectable={Boolean(onSelectSlot)}
            selectMirror={Boolean(onSelectSlot)}
            weekends
            nowIndicator
            events={events}
            select={onSelectSlot ? handleSelect : undefined}
            eventClick={onEventClickShift ? handleEventClick : undefined}
            datesSet={onRangeChange ? info => onRangeChange(info) : undefined}
            slotMinTime="05:30:00"
            slotMaxTime="23:59:59"
            slotDuration="00:30:00"
            snapDuration="00:15:00"
            allDaySlot={false}
            height="100%"
            dayHeaderFormat={{ weekday: "short", day: "numeric", month: "short" }}
            slotLabelInterval="01:00:00"
         />
      </div>
   )
}

export default EmployeeShiftCalendar
