import React from 'react'
import { Sun, Moon } from 'lucide-react'

export default function HeroSection({ onExploreClick, theme, onToggleTheme }) {
  const handleScroll = () => {
    if (onExploreClick) {
      onExploreClick()
    } else {
      document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isDark = theme === 'dark'

  return (
    <section
      id="hero"
      className="h-screen w-full snap-start relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 border-b border-border bg-background/85 backdrop-blur-[2px] text-foreground overflow-hidden select-none transition-colors duration-200"
    >
      {/* Top System Header (Blueprint: [#] SURAKSHIT AI | Good evening, User! + Theme Toggle) */}
      <div className="w-full flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-6">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight uppercase text-foreground flex items-center gap-2">
            <span className="text-primary">[#]</span> SURAKSHIT AI
          </span>
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
            Good evening, User!
          </span>
        </div>

        {/* Right Header Area: Theme Toggle & SOS space */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent text-foreground text-xs font-mono transition-colors cursor-pointer mr-44"
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline text-[11px] font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline text-[11px] font-semibold">Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Content: Left Text, Right Mockup, Centered Vertically */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center my-auto">
        {/* Left Column: Content */}
        <div className="flex flex-col justify-center max-w-xl">
          <div className="text-[10px] font-mono text-primary mb-2 uppercase tracking-wider font-semibold">
            [ SECTION 1: HERO &amp; PRODUCT SHOWCASE ]
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase leading-none mb-3">
            SURAKSHIT AI
          </h1>

          <h2 className="text-base sm:text-lg font-medium text-muted-foreground mb-4 leading-snug">
            Intelligent, Transparent &amp; Safety-Aware Route Planning
          </h2>

          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-normal mb-8 max-w-lg">
            Night travel navigation comparing alternative routes, evaluating municipal street lighting, active late-night commercial zones, verified safe havens, and explicit data uncertainty metrics.
          </p>

          <div>
            <button
              onClick={handleScroll}
              className="px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
            >
              <span>[v] Launch Interactive App (Scroll)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual (CSS Smartphone Mockup) */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="w-[270px] sm:w-[290px] h-[430px] sm:h-[460px] border-2 border-border rounded-[36px] p-2.5 bg-card shadow-2xl flex flex-col justify-between relative transition-colors duration-200">
            {/* Screen Area */}
            <div className="relative w-full h-full border border-border rounded-[28px] overflow-hidden bg-background flex flex-col justify-between p-3">
              
              {/* Top Notch & Label */}
              <div className="relative flex flex-col items-center pt-1 z-20">
                <div className="w-20 h-3 bg-card rounded-b-md mx-auto mb-2" />
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  [ MOBILE VIEWPORT PREVIEW ]
                </span>
              </div>

              {/* Mockup Map Canvas (Abstract Vector Schematic) */}
              <div className="relative flex-1 w-full my-2 border border-border bg-accent/20 rounded-lg overflow-hidden flex items-center justify-center">
                {/* Subtle Grid */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                <svg className="w-full h-full absolute inset-0" viewBox="0 0 240 230" fill="none">
                  {/* Route B: Dashed Line */}
                  <path
                    d="M 40 120 L 70 170 L 150 190 L 200 160"
                    stroke={isDark ? "#71767B" : "#9CA3AF"}
                    strokeWidth="2.5"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Route A: Vibrant Twitter Blue Line */}
                  <path
                    d="M 40 120 L 95 80 L 135 130 L 175 140 L 200 160"
                    stroke="#1D9BF0"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dot Markers */}
                  <circle cx="40" cy="120" r="5" fill="#1D9BF0" />
                  <circle cx="95" cy="80" r="4" fill="#1D9BF0" />
                  <circle cx="135" cy="130" r="4" fill="#ffffff" stroke="#1D9BF0" strokeWidth="1.5" />
                  <circle cx="175" cy="140" r="4" fill="#1D9BF0" />
                  <circle cx="200" cy="160" r="5" fill="#1D9BF0" />
                  
                  {/* Intermediate Route B dots */}
                  <circle cx="70" cy="170" r="3" fill={isDark ? "#71767B" : "#9CA3AF"} />
                  <circle cx="150" cy="190" r="3" fill={isDark ? "#71767B" : "#9CA3AF"} />
                </svg>
              </div>

              {/* Bottom Phone Preview Legend */}
              <div className="pt-2 border-t border-border flex flex-col gap-0.5 text-[9px] font-mono">
                <div className="flex items-center justify-between text-primary font-semibold">
                  <span>Route A: Lit Arterial</span>
                  <span className="text-primary-foreground bg-primary/80 px-1 py-0.2 rounded">[88% lit]</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Route B: Dark Shortcut</span>
                  <span>[41% lit]</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Border & Spec */}
      <div className="w-full border-t border-border pt-2 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>SURAKSHIT ARCHITECTURE // VERIFIED METRICS</span>
        <span>100% CLIENT-SIDE EVALUATION</span>
      </div>
    </section>
  )
}
