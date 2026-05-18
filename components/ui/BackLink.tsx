import Link from "next/link"

interface BackLinkProps {
   href: string
   label?: string
}

const BackLink = ({ href, label = "Wstecz" }: BackLinkProps) => {
   return (
      <Link
         href={href}
         className="text-text-500 hover:text-primary-500 inline-flex items-center gap-1 text-sm font-medium transition-colors"
      >
         <span aria-hidden="true">←</span>
         <span>{label}</span>
      </Link>
   )
}

export default BackLink
