import React from 'react'
import { Sun, Moon } from 'lucide-react'
import phonePreviewImg from '../assets/phone-preview.png'

export default function HeroSection({ onExploreClick, theme, onToggleTheme }) {
  const handleScroll = (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (onExploreClick) {
      onExploreClick(e)
    } else {
      document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const isDark = theme === 'dark'

  return (
    <section
      id="hero"
      className="min-h-screen h-screen w-full snap-start relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-b border-border bg-transparent text-foreground overflow-hidden select-none transition-colors duration-200"
    >
      {/* Top System Header (Blueprint: [#] SURAKSHIT PATH AI | Good evening, User! + Theme Toggle) */}
      <div className="w-full flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-6">
          <span className="font-mono text-lg font-bold tracking-tight uppercase text-foreground flex items-center gap-2">
            <span className="text-primary">[#]</span> SURAKSHIT PATH AI
          </span>
          <span className="font-mono text-base font-medium text-muted-foreground hidden sm:inline">
            Good evening, User!
          </span>
        </div>

        {/* Right Header Area: Sliding Theme Toggle & SOS space */}
        <div className="flex items-center gap-3 mr-72 sm:mr-80">
          {/* Custom Sliding Pill Theme Switch */}
          <button
            onClick={onToggleTheme}
            className="w-14 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full relative transition-colors duration-300 p-0.5 cursor-pointer flex items-center select-none shadow-inner"
            aria-label="Toggle dark/light mode switch"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {/* Background track icons */}
            <Sun className="w-3.5 h-3.5 text-amber-500 absolute left-1.5 pointer-events-none" />
            <Moon className="w-3.5 h-3.5 text-blue-400 absolute right-1.5 pointer-events-none" />

            {/* Sliding Circle Indicator */}
            <div
              className={`w-5 h-5 bg-white dark:bg-neutral-900 rounded-full absolute top-1 left-1 transition-transform duration-300 shadow-md flex items-center justify-center ${
                isDark ? 'translate-x-7' : 'translate-x-0'
              }`}
            >
              {isDark ? (
                <Moon className="w-2.5 h-2.5 text-blue-400" />
              ) : (
                <Sun className="w-2.5 h-2.5 text-amber-500" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Main 2-Column Content: Left Text, Right Mockup, Centered Vertically */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center my-auto">
        {/* Left Column: Content */}
        <div className="flex flex-col justify-center max-w-2xl lg:max-w-3xl">
          <div className="text-[11px] font-mono text-primary mb-2 uppercase tracking-wider font-bold">
            [ SECTION 1: HERO &amp; PRODUCT SHOWCASE ]
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground uppercase leading-none mb-3">
            SURAKSHIT PATH AI
          </h1>

          <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-foreground uppercase leading-[1.02] mb-5">
            BEYOND DIRECTION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300">
              TOWARDS SAFETY.
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-medium text-muted-foreground mb-4 leading-snug">
            Intelligent, Transparent &amp; Safety-Aware Route Planning
          </h2>

          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal mb-8 max-w-xl">
            Night travel navigation comparing alternative routes, evaluating municipal street lighting, active late-night commercial zones, verified safe havens, and explicit data uncertainty metrics.
          </p>

          <div>
            <button
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <span>[v] Launch Interactive App (Scroll)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual (Product App Preview Image) */}
        <div className="flex items-center justify-center md:justify-center md:-translate-x-8 lg:-translate-x-12">
          <div className="relative group max-w-[280px] sm:max-w-[340px] md:max-w-[370px] lg:max-w-[400px] transition-transform duration-300 hover:scale-[1.02]">
            {/* Realistic Phone Frame Image */}
            <img
              src={phonePreviewImg}
              alt="Surakshit Path AI Smartphone Interface"
              className="relative w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] select-none pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Border & Spec */}
      <div className="w-full border-t border-border pt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>SURAKSHIT PATH ARCHITECTURE // VERIFIED METRICS</span>
        <span>100% CLIENT-SIDE EVALUATION</span>
      </div>
    </section>
  )
}
