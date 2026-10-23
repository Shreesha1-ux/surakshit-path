import React, { useState, forwardRef } from 'react'
import MapWorkspace from './MapWorkspace'
import AITelemetryPanel from './AITelemetryPanel'

const WorkspaceSection = forwardRef(function WorkspaceSection({ theme }, ref) {
  const [activeRoute, setActiveRoute] = useState('1')
  
  // Shared comprehensive route data for all 3 routes
  const [routesData, setRoutesData] = useState({
    startName: 'Koramangala 4th Block',
    destName: 'Indiranagar 100ft Road',
    dataSource: 'OSM Overpass Realtime + Telecom Grid',
    confidence: '95% (High)',
    routes: {
      '1': {
        id: '1',
        name: 'Route 1 (Primary Highway)',
        type: 'Well-Lit Highway / Commercial Corridor',
        distanceKm: '6.2',
        durationMin: 22,
        safetyScore: 89,
        scoreBreakdown: { highway: 20, network: 19, safePlaces: 24, constructionPenalty: 0, darkForestPenalty: 4, total: 89 },
        networkCoverage: 98,
        networkStatus: '5G / 4G High Reliability (98% SOS Dispatch Ready)',
        highwayPercent: 80,
        forestPercent: 4,
        darkPercent: 16,
        constructionPercent: 0,
        roadCondition: 'Multi-Lane Paved Highway',
        publicHubsCount: 5,
        publicHubs: [
          { label: '24/7 Fuel & Air Bunk', type: 'fuel', source: 'Spatial Infrastructure' },
          { label: 'Police Highway Outpost', type: 'police', source: 'Spatial Infrastructure' },
          { label: 'Public Transit Bus Hub', type: 'transit', source: 'Spatial Infrastructure' },
          { label: '24/7 Emergency Hospital', type: 'hospital', source: 'Spatial Infrastructure' },
          { label: 'Commercial CCTV Hub', type: 'shop', source: 'Spatial Infrastructure' },
        ],
        quickTags: '80% Highway • 98% 5G Signal • 5 Safe Hubs',
        evaluationText: 'Route 1 is strongly recommended. 80% is well-lit multi-lane highway with 98% 5G signal coverage across 3 telecom cells. Features 5 verified emergency havens (Petrol, Police, Transit, Hospital) and zero pothole hazards.',
      },
      '2': {
        id: '2',
        name: 'Route 2 (Forest Bypass)',
        type: 'Mixed Urban / Forest Bypass',
        distanceKm: '5.8',
        durationMin: 20,
        safetyScore: 64,
        scoreBreakdown: { highway: 11, network: 14, safePlaces: 16, constructionPenalty: 1, darkForestPenalty: 6, total: 64 },
        networkCoverage: 72,
        networkStatus: 'Moderate 4G (Signal dips to 1 bar in forest)',
        highwayPercent: 40,
        forestPercent: 38,
        darkPercent: 18,
        constructionPercent: 4,
        roadCondition: 'Paved Secondary Roads',
        publicHubsCount: 3,
        publicHubs: [
          { label: 'Highway Petrol Bunk', type: 'fuel', source: 'Spatial Infrastructure' },
          { label: 'Rural Police Patrol Beat', type: 'police', source: 'Spatial Infrastructure' },
          { label: 'Suburban Bus Stand', type: 'transit', source: 'Spatial Infrastructure' },
        ],
        quickTags: '38% Forest • 72% Signal • 3 Safe Hubs',
        evaluationText: 'Route 2 bypasses congestion via secondary bypass roads (20 mins, 5.8 km). Includes a 38% tree canopy corridor with moderate lighting and 3 safe hubs. Signal dips to 1 bar near forest stretches. Exercise caution after midnight.',
      },
      '3': {
        id: '3',
        name: 'Route 3 (Short Backroad)',
        type: 'Backroad / Construction Shortcut',
        distanceKm: '5.1',
        durationMin: 16,
        safetyScore: 41,
        scoreBreakdown: { highway: 6, network: 8, safePlaces: 6, constructionPenalty: 10, darkForestPenalty: 9, total: 41 },
        networkCoverage: 42,
        networkStatus: 'Poor Signal / Unstable 1-Bar Dead Spot',
        highwayPercent: 20,
        forestPercent: 10,
        darkPercent: 35,
        constructionPercent: 35,
        roadCondition: 'Under Construction / Rough Surface',
        publicHubsCount: 1,
        publicHubs: [
          { label: 'Corner Kirana & CCTV', type: 'shop', source: 'Spatial Infrastructure' },
        ],
        quickTags: '35% Bad Road • Dead Spot Area • 1 Hub',
        evaluationText: 'Warning: Route 3 is the fastest (saves 6 mins), but 35% is unpaved construction with severe potholes, 35% is unlit, and telecom signal drops into dead spots. Vulnerability risk is high for solo travelers.',
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
