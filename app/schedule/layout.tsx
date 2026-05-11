import { SchedulePlannerProvider } from "@/components/schedule/SchedulePlannerProvider"
import type { ReactNode } from "react"

const ScheduleLayout = ({ children }: { children: ReactNode }) => {
   return <SchedulePlannerProvider>{children}</SchedulePlannerProvider>
}

export default ScheduleLayout
