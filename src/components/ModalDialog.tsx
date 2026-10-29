import { Icon } from '@iconify/react'
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { ICONS } from '@/constants/icons'

const FOCUSABLE_SELECTOR = ':is(a[href], button, input, select, textarea, [tabindex]):not([disabled]):not([tabindex="-1"])'

function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return

  const focusableElements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) =>
    element.checkVisibility(),
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements.at(-1)
  const isLeavingFromStart = event.shiftKey && document.activeElement === firstElement
  const isLeavingFromEnd = !event.shiftKey && document.activeElement === lastElement

  if (isLeavingFromStart) {
    event.preventDefault()
    lastElement?.focus()
  }
  if (isLeavingFromEnd) {
    event.preventDefault()
    firstElement?.focus()
  }
}

type ModalDialogProps = {
  isOpen: boolean
  onClose: () => void
  className: string
  children: ReactNode
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function ModalDialog({ isOpen, onClose, className, children, ...dialogProps }: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!isOpen && dialog.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={keepFocusInside}
      className={className}
      {...dialogProps}
    >
      {children}
    </dialog>
  )
}

type DialogCloseButtonProps = {
  label: string
  onClick: () => void
  className?: string
  autoFocus?: boolean
}

export function DialogCloseButton({ label, onClick, className = '', autoFocus = false }: DialogCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-autofocus={autoFocus || undefined}
      className={`grid size-9 place-items-center text-primary ${className}`}
    >
      <Icon icon={ICONS.close} className="size-5" aria-hidden />
    </button>
  )
}
