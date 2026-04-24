import type { ComponentType, SVGProps } from "react"

interface PageHeaderProps {
   title: string
   icon: ComponentType<SVGProps<SVGSVGElement>>
   iconLabel: string
}

const PageHeader = ({ title, icon: Icon, iconLabel }: PageHeaderProps) => {
   return (
      <div className="flex flex-col gap-1">
         <h1>{title}</h1>
         <div className="flex items-center gap-1">
            <Icon className="text-text-300 size-6" />
            <p className="text-text-300">{iconLabel}</p>
         </div>
      </div>
   )
}

export default PageHeader
