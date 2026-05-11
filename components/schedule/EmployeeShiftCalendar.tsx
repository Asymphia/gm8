"use client"

import { useMemo, type RefObject } from "react"
import FullCalendar from "@fullcalendar/react"
import type { DateSelectArg, DatesSetArg, EventClickArg, EventInput } from "@fullcalendar/core"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

import type { PlannerShift } from "@/lib/schedule-planner-storage"

const PLUGINS = [dayGridPlugin, timeGridPlugin, interactionPlugin]

interface EmployeeShiftCalendarProps {
   plannerShifts: PlannerShift[]
   calendarRef?: RefObject<FullCalendar | null>
   onRangeChange?: (arg: DatesSetArg) => void
   /** Wybór zakresu czasu jednego kalendarzowego dnia → nowa zmiana */
   onSelectSlot?: (start: Date, end: Date) => void
   /** Klik w istniejący blok */
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
   const events: EventInput[] = useMemo(
      () =>
         plannerShifts.map(s => ({
            id: String(s.id),
            title: s.note?.trim() ? s.note : `Shift (${s.start_time}–${s.end_time})`,
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
      <div className="fc-wrapper h-[clamp(560px,70vh,900px)] w-full [&_.fc-scrollgrid-sync-table]:border-border-300 [&_.fc]:text-text-700 [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold">
         <FullCalendar
            ref={calendarRef}
            plugins={PLUGINS}
            headerToolbar={{
               left: "prev,today,next",
               center: "title",
               right: "timeGridDay,timeGridWeek",
            }}
            initialView="timeGridWeek"
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
