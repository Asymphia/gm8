"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { createPortal } from "react-dom"

type ModalProps = {
   isOpen: boolean
   onClose: () => void
   children: ReactNode
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
   useEffect(() => {
      if (!isOpen) return
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") onClose()
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
   }, [isOpen, onClose])

   if (!isOpen) return null
   if (typeof document === "undefined") return null

   return createPortal(
      <div
         role="presentation"
         className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      >
         <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Zamknij"
            onClick={onClose}
         />
         <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-md bg-background p-6 shadow-lg"
            onClick={e => e.stopPropagation()}
         >
            {children}
         </div>
      </div>,
      document.body
   )
}

export default Modal
