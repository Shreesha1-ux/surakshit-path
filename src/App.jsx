import React, { useRef, useState, useEffect } from 'react'
import KineticGrid from '@/components/ui/kinetic-grid'
import HeroSection from './components/HeroSection'
import WorkspaceSection from './components/WorkspaceSection'
import SOSButton from './components/SOSButton'

export default function App() {
  const workspaceRef = useRef(null)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('surakshit_theme') || 'dark'
    }
    return 'dark'
  })

  // Global persistent Geolocation State (Requested on initial load)
  const [userLocation, setUserLocation] = useState(null)
  const [locationWarning, setLocationWarning] = useState(null)
  const [showLocationToast, setShowLocationToast] = useState(false)

  // 1. Prompt GPS permissions immediately on initial load & watch continuously
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationWarning('Location access denied. SOS will send default map coordinates.')
      setShowLocationToast(true)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        setLocationWarning(null)
        setShowLocationToast(false)
      },
      (err) => {
        console.warn('Geolocation access error:', err.message)
        setLocationWarning('Location access denied. SOS will send default map coordinates.')
        setShowLocationToast(true)
        setTimeout(() => setShowLocationToast(false), 6000)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('surakshit_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const scrollToWorkspace = (e) => {
    if (e?.preventDefault) e.preventDefault()
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <KineticGrid 
      themeMode={theme} 
      className="h-screen w-full font-sans selection:bg-[#1D9BF0] selection:text-white relative overflow-hidden"
    >
      {/* Global SOS Emergency Button with Live Location */}
      <SOSButton theme={theme} userLocation={userLocation} />

      {/* Permission Warning Toast */}
      {showLocationToast && locationWarning && (
        <div className="fixed bottom-5 left-5 z-50 bg-amber-500/95 text-black font-mono text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-amber-300 flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <span>⚠️</span>
          <span>{locationWarning}</span>
          <button 
            onClick={() => setShowLocationToast(false)} 
            className="ml-2 font-bold hover:opacity-75 cursor-pointer text-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Snap / Scroll Layout */}
      <main className="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth relative z-10">
        <HeroSection 
          onExploreClick={scrollToWorkspace} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
        />
        <WorkspaceSection 
          ref={workspaceRef} 
          theme={theme} 
          userLocation={userLocation}
        />
      </main>
    </KineticGrid>
  )
}
