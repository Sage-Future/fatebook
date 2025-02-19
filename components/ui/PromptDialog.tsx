import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import clsx from "clsx"
import React, { Fragment, useEffect, useRef, useState } from "react"

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title: string
  description?: string
  defaultValue?: string
  placeholder?: string
  submitLabel?: string
  cancelLabel?: string
  type?: "text" | "date"
}

export function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  defaultValue = "",
  placeholder = "",
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  type = "text",
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      // Focus input on next tick after dialog opens
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen, defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[99999]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {title}
                  </DialogTitle>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                  <input
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={clsx(
                      "w-full rounded-md border border-neutral-300 px-4 py-2",
                      "focus:border-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-700",
                      "placeholder:text-neutral-400",
                    )}
                    placeholder={placeholder}
                  />

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className={clsx(
                        "rounded-md px-4 py-2 text-sm font-medium",
                        "border border-neutral-300 bg-white text-neutral-700",
                        "hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                      )}
                      onClick={onClose}
                    >
                      {cancelLabel}
                    </button>
                    <button
                      type="submit"
                      className={clsx(
                        "rounded-md px-4 py-2 text-sm font-medium",
                        "bg-indigo-700 text-white",
                        "hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                      )}
                    >
                      {submitLabel}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
