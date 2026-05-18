import type { ReactNode } from "react"

interface PageToolbarProps {
   title: ReactNode
   description?: ReactNode
   back?: ReactNode
   actions?: ReactNode
}

export function PageToolbar({ title, description, back, actions }: PageToolbarProps) {
   return (
      <div className="page-toolbar">
         {back ? <div className="mb-1">{back}</div> : null}
         <div className="page-toolbar__main">
            <div className="min-w-0 flex-1">
               {typeof title === "string" ? <h1 className="text-balance">{title}</h1> : title}
               {description ? (
                  <p className="text-text-500 mt-1 max-w-2xl text-pretty text-sm sm:text-base">{description}</p>
               ) : null}
            </div>
            {actions ? <div className="page-toolbar__actions">{actions}</div> : null}
         </div>
      </div>
   )
}
