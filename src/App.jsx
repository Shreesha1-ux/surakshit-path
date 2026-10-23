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

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <KineticGrid 
      themeMode={theme} 
      className="h-screen w-full font-sans selection:bg-[#1D9BF0] selection:text-white relative overflow-hidden"
    >
      {/* Global SOS Emergency Button */}
      <SOSButton theme={theme} />

      {/* Main Snap / Scroll Layout */}
      <main className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth relative z-10">
        <HeroSection 
          onExploreClick={scrollToWorkspace} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
        />
        <WorkspaceSection 
          ref={workspaceRef} 
          theme={theme} 
        />
      </main>
    </KineticGrid>
  )
}
