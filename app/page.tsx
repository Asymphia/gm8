import DashboardContent from "@/components/dashboard/DashboardContent"
import FeatureSection from "@/components/features/FeatureSection"
import { APP_FEATURE_GROUPS } from "@/lib/feature-map"

const DashboardPage = () => {
   const dashboardRoadmap = APP_FEATURE_GROUPS.find(group => group.route === "/")

   return (
      <div className="space-y-10 pt-4">
         <DashboardContent />
         {dashboardRoadmap ? <FeatureSection group={dashboardRoadmap} /> : null}
      </div>
   )
}

export default DashboardPage
