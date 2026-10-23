import React from 'react'
import AITelemetryPanel from './AITelemetryPanel'

export default function AiChatModal({ isOpen, onClose, activeRoute = 'A', theme = 'light', routesData }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex flex-col justify-end md:justify-center items-center animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Sheet */}
      <div className="relative z-10 w-full max-w-[430px] h-[86vh] md:h-[680px] bg-white dark:bg-neutral-900 rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 border border-slate-100 dark:border-neutral-800">
        
        {/* Drag Handle Pill */}
        <div className="w-full flex justify-center pt-2 pb-1 bg-white dark:bg-neutral-900 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-neutral-700 rounded-full" />
        </div>

        {/* AI Panel Body */}
        <div className="flex-1 overflow-hidden">
          <AITelemetryPanel
            activeRoute={activeRoute}
            theme={theme}
            routesData={routesData}
            onClose={onClose}
          />
        </div>

      </div>
    </div>
  )
}
