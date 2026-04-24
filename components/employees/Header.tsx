import { MapPinIcon } from "@heroicons/react/24/outline"
import SearchBar from "@/components/ui/SearchBar"

const Header = () => {
   return (
      <div className="flex justify-between">
         <div>
            <h1 className="text-2xl font-semibold text-text-700">
               Employee List
            </h1>
            <div className="flex">
               <MapPinIcon className="text-text-300 size-6" />
               <p className="text-text-300">Firma</p>
            </div>
         </div>
         <div>
            <SearchBar />
         </div>
      </div>
   )
}

export default Header
