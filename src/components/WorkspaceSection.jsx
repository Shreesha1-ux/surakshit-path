import React, { useState, forwardRef } from 'react'
import MapWorkspace from './MapWorkspace'
import AITelemetryPanel from './AITelemetryPanel'

const WorkspaceSection = forwardRef(function WorkspaceSection({ theme }, ref) {
  const [activeRoute, setActiveRoute] = useState('A')

  return (
    <section 
      ref={ref}
      id="workspace" 
      className="h-screen w-full snap-start grid grid-cols-12 overflow-hidden bg-background text-foreground border-b border-border select-none transition-colors duration-200"
    >
      {/* Left Column (65% width) - MapWorkspace */}
      <div className="col-span-8 h-full relative overflow-hidden bg-background/90">
        <MapWorkspace 
          activeRoute={activeRoute} 
          setActiveRoute={setActiveRoute} 
          theme={theme}
        />
      </div>

      {/* Right Column (35% width) - AITelemetryPanel */}
      <div className="col-span-4 h-full bg-card border-l border-border overflow-hidden flex flex-col transition-colors duration-200">
        <AITelemetryPanel 
          activeRoute={activeRoute} 
          theme={theme}
        />
      </div>
    </section>
  )
})

export default WorkspaceSection
