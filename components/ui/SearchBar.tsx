import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const SearchBar = () => {
   return (
      <label className="bg-background border-border-500 hover:bg-foreground group flex items-center gap-3 rounded-sm border border-solid px-5 py-3">
         <input
            type="text"
            placeholder="Search..."
            className="text-text-primary-300 placeholder:text-text-primary-300 group-hover:text-primary-500 group-hover:placeholder:text-primary-500 focus:outline-0"
         />
         <MagnifyingGlassIcon className="text-text-primary-500 group-hover:text-primary-500 size-6" />
      </label>
   )
}

export default SearchBar
