import React, { useState, forwardRef } from 'react'
import MapWorkspace from './MapWorkspace'
import AITelemetryPanel from './AITelemetryPanel'

const WorkspaceSection = forwardRef(function WorkspaceSection({ theme, userLocation }, ref) {
  const [activeRoute, setActiveRoute] = useState('A')
  
  // Shared comprehensive route data for Top 2 routes
  const [routesData, setRoutesData] = useState({
    startName: 'Koramangala 4th Block',
    destName: 'Indiranagar 100ft Road',
    dataSource: 'OSM Overpass Realtime + Pure OSRM Geometry',
    confidence: '96% (High)',
    routes: {
      'A': {
        id: 'A',
        name: 'Route A (Safest Route)',
        type: 'Primary Arterial & Lit Highway Corridor',
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
          { pos: [12.9450, 77.6300], label: 'HP 24/7 Fuel & Air Bunk', type: 'fuel', source: 'Spatial Infrastructure' },
          { pos: [12.9565, 77.6337], label: 'City Police Highway Post', type: 'police', source: 'Spatial Infrastructure' },
          { pos: [12.9680, 77.6380], label: 'Central Bus Transit Hub', type: 'transit', source: 'Spatial Infrastructure' },
          { pos: [12.9720, 77.6400], label: '24/7 Emergency Hospital', type: 'hospital', source: 'Spatial Infrastructure' },
          { pos: [12.9760, 77.6405], label: 'All-Night Commercial CCTV Zone', type: 'shop', source: 'Spatial Infrastructure' },
        ],
        quickTags: '80% Lit • Safest Choice',
        evaluationText: 'Route A is the highest scoring safest route (22 mins, 6.2 km). 80% is well-lit multi-lane road with 98% 5G telecom coverage, 5 verified safe havens, and zero unpaved hazard zones.',
      },
      'B': {
        id: 'B',
        name: 'Route B (Alternative Route)',
        type: 'Secondary Road / Urban Bypass',
        distanceKm: '5.8',
        durationMin: 20,
        safetyScore: 68,
        scoreBreakdown: { highway: 13, network: 15, safePlaces: 18, constructionPenalty: 1, darkForestPenalty: 7, total: 68 },
        networkCoverage: 75,
        networkStatus: 'Moderate 4G Coverage along Secondary Roads',
        highwayPercent: 46,
        forestPercent: 32,
        darkPercent: 18,
        constructionPercent: 4,
        roadCondition: 'Paved Secondary Roads',
        publicHubsCount: 3,
        publicHubs: [
          { pos: [12.9400, 77.6380], label: 'Highway Petrol Bunk', type: 'fuel', source: 'Spatial Infrastructure' },
          { pos: [12.9550, 77.6450], label: 'Police Beat Kiosk', type: 'police', source: 'Spatial Infrastructure' },
          { pos: [12.9690, 77.6420], label: 'Suburban Bus Stand', type: 'transit', source: 'Spatial Infrastructure' },
        ],
        quickTags: '46% Lit • Alternative Path',
        evaluationText: 'Route B is the secondary alternative (20 mins, 5.8 km). Moderately lit (46%) with secondary road paving and 3 emergency points. Exercise vigilance after dark.',
      },
    },
  })

  return (
    <section 
      ref={ref}
      id="workspace" 
      className="min-h-screen h-screen w-full snap-start relative grid grid-cols-12 overflow-hidden bg-background text-foreground border-b border-border select-none transition-colors duration-200"
    >
      {/* Left Column (65% width) - MapWorkspace */}
      <div className="col-span-8 h-full relative overflow-hidden bg-background/90">
        <MapWorkspace 
          activeRoute={activeRoute} 
          setActiveRoute={setActiveRoute} 
          theme={theme}
          routesData={routesData}
          setRoutesData={setRoutesData}
          userLocation={userLocation}
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
