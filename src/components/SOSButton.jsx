import React, { useRef, useEffect } from 'react'
import { AlertCircle, MessageCircle, Phone, X, MapPin } from 'lucide-react'

export default function SOSButton({ theme }) {
  const dialogRef = useRef(null)

  const openModal = () => {
    dialogRef.current?.showModal()
  }

  const closeModal = () => {
    dialogRef.current?.close()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return
      const rect = dialog.getBoundingClientRect()
      const isInsideContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      )
      if (!isInsideContent) {
        dialog.close()
      }
    }

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick)
    }

    return () => {
      dialog.removeEventListener('click', handleBackdropClick)
    }
  }, [])

  const handleWhatsApp = () => {
    const coords = "12.9352° N, 77.6245° E"
    const message = encodeURIComponent(`EMERGENCY SOS! I require immediate assistance. Current coordinates: ${coords}`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const handleSMS = () => {
    const coords = "12.9352° N, 77.6245° E"
    const message = encodeURIComponent(`EMERGENCY SOS! I need help. Location: ${coords}`)
    window.open(`sms:?body=${message}`, '_self')
  }

  return (
    <>
      <button
        onClick={openModal}
        className="fixed top-4 right-6 z-50 bg-destructive hover:opacity-90 text-destructive-foreground font-mono text-xs font-bold px-4 py-2.5 border border-destructive shadow-md transition-colors duration-150 flex items-center gap-2 cursor-pointer uppercase tracking-wider rounded-md"
        aria-haspopup="dialog"
      >
        <span className="font-mono">[!] EMERGENCY SOS (FIXED)</span>
      </button>

      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' })}
        aria-labelledby="sos-dialog-title"
        className="p-0 bg-transparent backdrop:bg-black/70 open:flex items-center justify-center m-auto outline-none"
      >
        <div className="bg-card text-foreground border border-border p-6 sm:p-8 w-[92vw] max-w-md shadow-2xl relative rounded-xl font-sans transition-colors duration-200">
          <div className="flex items-start justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-destructive text-destructive-foreground font-mono text-sm font-bold rounded-md">
                !
              </span>
              <div>
                <h2 id="sos-dialog-title" className="text-base font-bold tracking-tight uppercase text-foreground">
                  Emergency SOS Signal
                </h2>
                <p className="text-xs text-muted-foreground">Immediate location broadcast</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-1 border border-border text-muted-foreground hover:text-foreground transition-colors rounded"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-5 p-4 bg-accent/40 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Current Coordinates</span>
            </div>
            <div className="font-mono text-base font-bold text-primary tracking-wide">
              12.9352° N, 77.6245° E
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Precision: High accuracy GPS • Timestamp: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mb-5">
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm tracking-wide rounded-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              onClick={handleSMS}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-card hover:bg-accent text-foreground border border-border font-semibold text-sm tracking-wide rounded-md transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Send via SMS</span>
            </button>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2 text-xs uppercase tracking-wider font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
