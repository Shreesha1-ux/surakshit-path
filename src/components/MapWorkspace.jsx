import React, { useState } from 'react'

export default function MapWorkspace({ activeRoute, setActiveRoute, theme }) {
  const [startPoint, setStartPoint] = useState('Koramangala 4th Block')
  const [destinationPoint, setDestinationPoint] = useState('Indiranagar 100ft Road')

  const handleRouteSelect = (routeKey) => {
    setActiveRoute(routeKey)
  }

  const isDark = theme === 'dark'

  return (
    <div className="relative w-full h-full bg-background overflow-hidden flex flex-col select-none transition-colors duration-200">
      
      {/* Background Cartographic Grid */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      {/* Blueprint Header Label */}
      <div className="absolute top-2 right-4 z-10 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        &lt; MAP WORKSPACE (65% WIDTH) / MAP IMAGE CONTAINER &gt;
      </div>

      {/* Top-Left Floating Card */}
      <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 bg-card border border-border p-4 shadow-2xl rounded-lg transition-colors duration-200">
        <div className="space-y-3 mb-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground font-bold mb-1">
              START LOCATION
            </label>
            <div className="flex items-center border border-border focus-within:border-primary px-2.5 py-1.5 bg-background rounded transition-colors">
              <span className="font-mono text-xs text-primary mr-1.5 font-bold">o</span>
              <input
                type="text"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full text-xs font-mono outline-none bg-transparent text-foreground"
                placeholder="Start location"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-foreground font-bold mb-1">
              DESTINATION
            </label>
            <div className="flex items-center border border-border focus-within:border-primary px-2.5 py-1.5 bg-background rounded transition-colors">
              <span className="font-mono text-xs text-destructive mr-1.5 font-bold">x</span>
              <input
                type="text"
                value={destinationPoint}
                onChange={(e) => setDestinationPoint(e.target.value)}
                className="w-full text-xs font-mono outline-none bg-transparent text-foreground"
                placeholder="Destination location"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => setActiveRoute('A')}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider py-2.5 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>[&gt;] Find Safest Route</span>
        </button>
      </div>

      {/* Large SVG Map Area filling entire space */}
      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          className="w-full h-full absolute inset-0" 
          viewBox="0 0 850 600" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Broad Street Corridors in Adaptive Accent */}
          <g 
            stroke={isDark ? "#15202B" : "#E1E8ED"} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          >
            {/* Main Diagonal Avenue */}
            <path d="M 100 480 L 720 180" strokeWidth="44" />
            {/* Cross Arterials */}
            <path d="M 80 180 L 750 480" strokeWidth="38" />
            <path d="M 380 80 L 450 540" strokeWidth="32" />
            <path d="M 220 540 L 680 80" strokeWidth="26" strokeDasharray="8 6" />
          </g>

          {/* ROUTE B: Dashed Gray Line (Shortcut) */}
          <g 
            className="cursor-pointer"
            onClick={() => handleRouteSelect('B')}
            opacity={activeRoute === 'B' ? 1 : 0.65}
          >
            {/* Click halo */}
            <path
              d="M 120 400 L 190 480 L 370 530 L 530 460"
              stroke="transparent"
              strokeWidth="28"
              fill="none"
            />
            {/* Dashed Line */}
            <path
              d="M 120 400 L 190 480 L 370 530 L 530 460"
              stroke={isDark ? "#71767B" : "#9CA3AF"}
              strokeWidth={activeRoute === 'B' ? '4.5' : '3.5'}
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Vertices */}
            <circle cx="190" cy="480" r="4.5" fill={isDark ? "#71767B" : "#9CA3AF"} />
            <circle cx="370" cy="530" r="4.5" fill={isDark ? "#71767B" : "#9CA3AF"} />

            {/* Label */}
            <text 
              x="240" 
              y="515" 
              className={`font-mono text-[11px] font-bold uppercase tracking-wider ${isDark ? 'fill-[#71767B]' : 'fill-[#6B7280]'}`}
            >
              [ROUTE B - SHORTCUT]
            </text>
          </g>

          {/* ROUTE A: Vibrant Twitter Blue Line (Lit Safe Route) */}
          <g 
            className="cursor-pointer"
            onClick={() => handleRouteSelect('A')}
            opacity={activeRoute === 'A' ? 1 : 0.75}
          >
            {/* Click halo */}
            <path
              d="M 120 400 L 260 440 L 415 320 L 530 460"
              stroke="transparent"
              strokeWidth="28"
              fill="none"
            />
            {/* Glowing backdrop path */}
            <path
              d="M 120 400 L 260 440 L 415 320 L 530 460"
              stroke="#1D9BF0"
              strokeWidth="10"
              strokeOpacity="0.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Solid Line */}
            <path
              d="M 120 400 L 260 440 L 415 320 L 530 460"
              stroke="#1D9BF0"
              strokeWidth={activeRoute === 'A' ? '5.5' : '4'}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Vertices */}
            <circle cx="260" cy="440" r="6" fill="#1D9BF0" />
            <circle cx="260" cy="440" r="2.5" fill="#ffffff" />
            
            <circle cx="415" cy="320" r="6" fill="#1D9BF0" />
            <circle cx="415" cy="320" r="2.5" fill="#ffffff" />

            {/* Label */}
            <text x="315" y="475" className="font-mono text-[11px] font-bold fill-[#1D9BF0] uppercase tracking-wider">
              [ROUTE A - LIT]
            </text>
          </g>

          {/* Start Location Node */}
          <g transform="translate(120, 400)">
            <circle cx="0" cy="0" r="14" fill="#1D9BF0" fillOpacity="0.2" />
            <circle cx="0" cy="0" r="9" stroke="#1D9BF0" strokeWidth="2.5" fill={isDark ? "#16181C" : "#FFFFFF"} />
            <circle cx="0" cy="0" r="4" fill="#1D9BF0" />
          </g>

          {/* Destination Node */}
          <g transform="translate(530, 460)">
            <circle cx="0" cy="0" r="14" fill="#1D9BF0" fillOpacity="0.2" />
            <circle cx="0" cy="0" r="9" stroke="#1D9BF0" strokeWidth="2.5" fill={isDark ? "#16181C" : "#FFFFFF"} />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Bottom Overlay Cards: Route Comparison */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-4">
        {/* Card 1: Route A (Recommended) */}
        <button
          onClick={() => handleRouteSelect('A')}
          className={`flex-1 text-left p-3.5 bg-card rounded-lg transition-all cursor-pointer ${
            activeRoute === 'A'
              ? 'border-2 border-primary shadow-lg shadow-primary/10'
              : 'border border-border opacity-80 hover:opacity-100 hover:border-foreground/40'
          }`}
        >
          <div className="font-mono text-xs font-bold text-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-primary rounded-full inline-block" />
              [*] Route A (Recommended)
            </span>
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">
              86/100
            </span>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Score: <span className="text-foreground font-semibold">86/100</span> | 22 min | <span className="text-primary font-semibold">88% Lit</span>
          </div>
        </button>

        {/* Card 2: Route B (Shortcut) */}
        <button
          onClick={() => handleRouteSelect('B')}
          className={`flex-1 text-left p-3.5 bg-card rounded-lg transition-all cursor-pointer ${
            activeRoute === 'B'
              ? 'border-2 border-primary shadow-lg shadow-primary/10'
              : 'border border-border opacity-80 hover:opacity-100 hover:border-foreground/40'
          }`}
        >
          <div className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border border-muted-foreground rounded-full inline-block" />
              [ ] Route B (Shortcut)
            </span>
            <span className="text-[10px] border border-border text-muted-foreground px-1.5 py-0.5 rounded">
              52/100
            </span>
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Score: 52/100 | 18 min | 41% Lit
          </div>
        </button>
      </div>

    </div>
  )
}
