import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const SearchBar = () => {
   return (
      <label className="bg-background border-border-500 hover:bg-foreground group flex w-full items-center gap-3 rounded-sm border border-solid px-4 py-2.5 sm:w-auto sm:px-5 sm:py-3">
         <input
            type="text"
            placeholder="Szukaj…"
            className="text-text-primary-300 placeholder:text-text-primary-300 group-hover:text-primary-500 group-hover:placeholder:text-primary-500 w-full min-w-0 focus:outline-0 sm:w-auto"
         />
         <MagnifyingGlassIcon className="text-text-primary-500 group-hover:text-primary-500 size-6" />
      </label>
   )
}

export default SearchBar
