import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className="confirm"
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <p>{message}</p>
      <div className="confirm-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="button" className="primary" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  )
}