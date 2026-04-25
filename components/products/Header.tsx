"use client"
import SearchBar from "@/components/ui/SearchBar"
import PageHeader from "@/components/ui/PageHeader"
import type { ComponentType, SVGProps } from "react"
import Button from "@/components/ui/Button"

interface HeaderProps {
   title: string
   icon: ComponentType<SVGProps<SVGSVGElement>>
   iconLabel: string
}

const Header = ({ title, icon, iconLabel }: HeaderProps) => {
   return (
      <div className="flex items-start justify-between">
         <PageHeader title={title} icon={icon} iconLabel={iconLabel} />
         <div className="flex items-center gap-3">
            <Button type="button" variant="outline">
               Edit product
            </Button>
            <Button type="button" variant="warning">
               Delete products
            </Button>
            <Button type="button" variant="primary">
               Add product
            </Button>
            <SearchBar />
         </div>
      </div>
   )
}

export default Header
