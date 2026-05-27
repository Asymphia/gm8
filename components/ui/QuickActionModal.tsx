"use client"

import { useMemo, useState, type ReactNode } from "react"
import Modal from "@/components/ui/Modal"
import Button, { type ButtonVariant } from "@/components/ui/Button"

export function defaultFieldKey(label: string, index: number): string {
   const slug = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
   return slug || `field_${index}`
}

export type FormField =
   | {
        kind?: "text"
        name?: string
        label: string
        placeholder?: string
        type?: "text" | "number" | "date" | "email" | "tel" | "password"
        defaultValue?: string
     }
   | {
        kind: "select"
        name?: string
        label: string
        options: { value: string; label: string }[]
        emptyOptionLabel?: string
        defaultValue?: string
     }

interface QuickActionModalProps {
   triggerLabel: string
   title: string
   description?: string
   confirmLabel?: string
   cancelLabel?: string
   triggerVariant?: ButtonVariant
   triggerDisabled?: boolean
   prepend?: ReactNode
   fields: FormField[]
   onConfirm?: (values: Record<string, string>) => void | Promise<void>
}

function buildInitialValues(fields: FormField[]): Record<string, string> {
   const out: Record<string, string> = {}
   fields.forEach((field, index) => {
      const key = field.name ?? defaultFieldKey(field.label, index)
      if (field.kind === "select") {
         const sel = field
         if (sel.defaultValue !== undefined) out[key] = sel.defaultValue
         else if (sel.emptyOptionLabel !== undefined) out[key] = ""
         else out[key] = sel.options[0]?.value ?? ""
      } else {
         out[key] = field.defaultValue ?? ""
      }
   })
   return out
}

function KeyedFormGate({
   title,
   description,
   prepend,
   fields,
   confirmLabel,
   cancelLabel,
   onCancel,
   onSubmitted,
}: {
   title: string
   description?: string
   prepend?: ReactNode
   fields: FormField[]
   confirmLabel: string
   cancelLabel: string
   onCancel: () => void
   onSubmitted: (values: Record<string, string>) => void | Promise<void>
   submitting?: boolean
}) {
   const initialValues = useMemo(() => buildInitialValues(fields), [fields])
   const [values, setValues] = useState<Record<string, string>>(() => ({ ...initialValues }))
   const [submitError, setSubmitError] = useState<string | null>(null)
   const [submitting, setSubmitting] = useState(false)

   return (
      <div className="space-y-4">
         <div>
            <h2 className="text-text-700 text-xl font-medium">{title}</h2>
            {description ? <p className="text-text-500 mt-1 text-sm">{description}</p> : null}
         </div>

         {submitError ? <p className="text-warning text-sm">{submitError}</p> : null}

         {prepend ? <div className="rounded-sm border border-border-300 bg-surface px-3 py-2 text-sm text-text-500">{prepend}</div> : null}

         <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {fields.map((field, index) => {
               const key = field.name ?? defaultFieldKey(field.label, index)
               if (field.kind === "select") {
                  const sel = field
                  return (
                     <label key={key} className="space-y-1 md:col-span-2">
                        <span className="text-text-700 text-sm font-medium">{field.label}</span>
                        <select
                           value={values[key] ?? ""}
                           onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))}
                           className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                        >
                           {sel.emptyOptionLabel ? (
                              <option value="">{sel.emptyOptionLabel}</option>
                           ) : null}
                           {sel.options.map(option => (
                              <option key={option.value} value={option.value}>
                                 {option.label}
                              </option>
                           ))}
                        </select>
                     </label>
                  )
               }

               return (
                  <label key={key} className="space-y-1 md:col-span-2">
                     <span className="text-text-700 text-sm font-medium">{field.label}</span>
                     <input
                        type={field.type ?? "text"}
                        value={values[key] ?? ""}
                        placeholder={field.placeholder}
                        className="border-border-300 text-text-700 focus:border-primary-500 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                        onChange={event => setValues(previous => ({ ...previous, [key]: event.target.value }))}
                     />
                  </label>
               )
            })}
         </div>

         <div className="flex flex-col-reverse gap-2 border-t border-border-300 pt-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={onCancel} disabled={submitting}>
               {cancelLabel}
            </Button>
            <Button
               type="button"
               variant="primary"
               className="min-h-11 w-full sm:w-auto"
               disabled={submitting}
               onClick={() => {
                  setSubmitError(null)
                  setSubmitting(true)
                  void Promise.resolve(onSubmitted(values))
                     .then(() => onCancel())
                     .catch(err => {
                        setSubmitError(err instanceof Error ? err.message : "Operacja nie powiodła się.")
                     })
                     .finally(() => setSubmitting(false))
               }}
            >
               {submitting ? "Zapisywanie…" : confirmLabel}
            </Button>
         </div>
      </div>
   )
}

const QuickActionModal = ({
   triggerLabel,
   title,
   description,
   confirmLabel = "Potwierdź",
   cancelLabel = "Anuluj",
   triggerVariant = "primary",
   triggerDisabled = false,
   prepend,
   fields,
   onConfirm,
}: QuickActionModalProps) => {
   const [open, setOpen] = useState(false)
   const [formEpoch, setFormEpoch] = useState(0)

   const handleOpen = () => {
      setFormEpoch(previous => previous + 1)
      setOpen(true)
   }

   return (
      <>
         <Button type="button" variant={triggerVariant} className="min-h-11 w-full sm:w-auto" onClick={handleOpen} disabled={triggerDisabled}>
            {triggerLabel}
         </Button>
         <Modal isOpen={open} onClose={() => setOpen(false)}>
            {open ? (
               <KeyedFormGate
                  key={formEpoch}
                  title={title}
                  description={description}
                  prepend={prepend}
                  fields={fields}
                  confirmLabel={confirmLabel}
                  cancelLabel={cancelLabel}
                  onCancel={() => setOpen(false)}
                  onSubmitted={values => onConfirm?.(values)}
               />
            ) : null}
         </Modal>
      </>
   )
}

export default QuickActionModal
