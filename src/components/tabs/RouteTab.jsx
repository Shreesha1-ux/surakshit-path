import React from 'react'
import MapWorkspace from '../MapWorkspace'

export default function RouteTab({
  activeRoute,
  setActiveRoute,
  theme,
  routesData,
  setRoutesData,
  userLocation,
  userLocationName,
  onOpenAiChat,
  autoExpandSearch = false,
}) {
  return (
    <div className="w-full h-full relative z-0 overflow-hidden bg-slate-100">
      <MapWorkspace
        activeRoute={activeRoute}
        setActiveRoute={setActiveRoute}
        theme={theme}
        routesData={routesData}
        setRoutesData={setRoutesData}
        userLocation={userLocation}
        userLocationName={userLocationName}
        onOpenAiChat={onOpenAiChat}
        isMobile={true}
        autoExpandSearch={autoExpandSearch}
      />
    </div>
  )
}
