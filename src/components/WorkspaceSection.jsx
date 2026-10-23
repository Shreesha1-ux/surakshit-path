import React, { useState, forwardRef } from 'react'
import MapWorkspace from './MapWorkspace'
import AITelemetryPanel from './AITelemetryPanel'

const WorkspaceSection = forwardRef(function WorkspaceSection({ theme }, ref) {
  const [activeRoute, setActiveRoute] = useState('1')
  
  // Shared comprehensive route data for all 3 routes
  const [routesData, setRoutesData] = useState({
    startName: 'Koramangala 4th Block',
    destName: 'Indiranagar 100ft Road',
    routes: {
      '1': {
        id: '1',
        name: 'Route 1 (Primary Highway)',
        type: 'Well-Lit Highway / Commercial Corridor',
        distanceKm: '6.2',
        durationMin: 22,
        safetyScore: 88,
        highwayPercent: 78,
        forestPercent: 4,
        darkPercent: 14,
        constructionPercent: 4,
        roadCondition: 'Multi-Lane Paved Highway',
        publicHubsCount: 4,
        publicHubs: [
          { label: 'Police Station #4', type: 'police' },
          { label: 'Central Bus Transit Hub', type: 'transit' },
          { label: '24/7 Fuel & Pharmacy', type: 'shop' },
          { label: 'Highway Patrol Post', type: 'police' },
        ],
        quickTags: '78% Highway • 4 Public Hubs',
        evaluationText: 'Route 1 is strongly recommended. 78% of the route is well-lit multi-lane highway with 4 active public safe havens (Police kiosk, Transit hub, 24/7 fuel) and zero unpaved construction zones.',
      },
      '2': {
        id: '2',
        name: 'Route 2 (Forest Bypass)',
        type: 'Mixed Urban / Forest Bypass',
        distanceKm: '5.8',
        durationMin: 20,
        safetyScore: 64,
        highwayPercent: 42,
        forestPercent: 36,
        darkPercent: 18,
        constructionPercent: 4,
        roadCondition: 'Paved Secondary Roads',
        publicHubsCount: 2,
        publicHubs: [
          { label: 'Forest Beat Kiosk', type: 'police' },
          { label: 'Suburban Bus Stop', type: 'transit' },
        ],
        quickTags: '36% Forest • 2 Public Hubs',
        evaluationText: 'Route 2 bypasses urban congestion via tree-covered bypass roads (36% forest stretch). Moderate lighting (58%) and 2 public hubs. Exercise caution after midnight.',
      },
      '3': {
        id: '3',
        name: 'Route 3 (Short Backroad)',
        type: 'Backroad / Construction Shortcut',
        distanceKm: '5.1',
        durationMin: 16,
        safetyScore: 42,
        highwayPercent: 22,
        forestPercent: 12,
        darkPercent: 40,
        constructionPercent: 26,
        roadCondition: 'Under Construction / Rough Surface',
        publicHubsCount: 1,
        publicHubs: [
          { label: 'Corner Convenience Store', type: 'shop' },
        ],
        quickTags: '40% Dark • Construction Zone',
        evaluationText: 'Warning: Route 3 is the fastest (saves 6 mins), but 40% is pitch dark with rough construction stretches and only 1 commercial hub. High vulnerability risk.',
      },
    },
  })

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
          routesData={routesData}
          setRoutesData={setRoutesData}
        />
      </div>

      {/* Right Column (35% width) - AITelemetryPanel */}
      <div className="col-span-4 h-full bg-card border-l border-border overflow-hidden flex flex-col transition-colors duration-200">
        <AITelemetryPanel 
          activeRoute={activeRoute} 
          theme={theme}
          routesData={routesData}
        />
      </div>
    </section>
  )
})

export default WorkspaceSection
