import { useEffect, useRef, type ReactNode } from 'react'

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
    if (isOpen && !dialog?.open) dialog?.showModal()
    if (!isOpen && dialog?.open) dialog.close()
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={className}
      {...dialogProps}
    >
      {children}
    </dialog>
  )
}
