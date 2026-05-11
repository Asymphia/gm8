import SearchBar from "@/components/ui/SearchBar"
import PageHeader from "@/components/ui/PageHeader"
import type { ComponentType, SVGProps } from "react"

interface HeaderProps {
   title: string
   icon: ComponentType<SVGProps<SVGSVGElement>>
   iconLabel: string
}

const Header = ({ title, icon, iconLabel }: HeaderProps) => {
   return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
         <PageHeader title={title} icon={icon} iconLabel={iconLabel} />
         <div className="w-full sm:w-auto">
            <SearchBar />
         </div>
      </div>
   )
}

export default Header
