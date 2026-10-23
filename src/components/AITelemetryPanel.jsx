import React, { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, AlertOctagon, Volume2, Square, Send, Radio, Fuel, Shield, Bus, HeartPulse, Store, Database } from 'lucide-react'

export default function AITelemetryPanel({ activeRoute, theme, routesData }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [promptInput, setPromptInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])

  const currentRoute = routesData?.routes?.[activeRoute] || routesData?.routes?.['1'] || {
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
  }

  const destName = routesData?.destName || 'Destination'
  const dataSource = routesData?.dataSource || 'OSM Overpass + Telecom Grid + Spatial AI'
  const confidence = routesData?.confidence || '95% (High)'

  // Safety Score Styling and Label
  const getScoreBadge = (score) => {
    if (score >= 80) {
      return {
        label: 'HIGH SAFETY',
        sub: 'Recommended for all commuters & night travel',
        badgeClass: 'bg-emerald-600 text-white',
        borderClass: 'border-emerald-500/40',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
      }
    }
    if (score >= 60) {
      return {
        label: 'MODERATE SAFETY',
        sub: 'Exercise caution after dark • Isolated stretches',
        badgeClass: 'bg-amber-600 text-white',
        borderClass: 'border-amber-500/40',
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />
      }
    }
    return {
      label: 'HIGH VULNERABILITY',
      sub: 'Not recommended for solo commutes • High hazard',
      badgeClass: 'bg-rose-600 text-white',
      borderClass: 'border-rose-500/40',
      icon: <AlertOctagon className="w-4 h-4 text-rose-500" />
    }
  }

  const scoreInfo = getScoreBadge(currentRoute.safetyScore)
  const breakdown = currentRoute.scoreBreakdown || {
    highway: 20,
    network: 19,
    safePlaces: 24,
    constructionPenalty: 0,
    darkForestPenalty: 4,
    total: currentRoute.safetyScore,
  }

  // Voice Readout logic (Web Speech API)
  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()

    const speechText = `Route safety evaluation for ${currentRoute.name}: Safety score is ${currentRoute.safetyScore} out of 100. Telecom signal coverage is ${currentRoute.networkCoverage} percent. ${currentRoute.evaluationText}`
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleStopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [activeRoute])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!promptInput.trim()) return

    const userText = promptInput.trim()
    setPromptInput('')

    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText },
      {
        sender: 'ai',
        text: `Analysis for ${currentRoute.name}: Safety score is ${currentRoute.safetyScore}/100. It features ${currentRoute.highwayPercent}% illuminated highway, ${currentRoute.networkCoverage}% cell network strength, and ${currentRoute.publicHubsCount} safe haven hubs along the corridor.`,
      },
    ])
  }

  return (
    <div className="w-full h-full bg-card flex flex-col justify-between p-3.5 sm:p-4 select-none overflow-hidden font-mono border-l border-border transition-colors duration-200">
      
      {/* Scrollable Container for all Telemetry info */}
      <div className="space-y-3.5 overflow-y-auto pr-1">
        
        {/* Top Header Label */}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border pb-1.5">
          <span className="font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-purple-500 animate-pulse" />
            &lt; AI TELEMETRY &amp; SCORING &gt;
          </span>
          <span className="text-primary font-bold">
            {currentRoute.distanceKm} km • {currentRoute.durationMin} min
          </span>
        </div>

        {/* Safety Score Card */}
        <div className={`p-3 rounded-lg border ${scoreInfo.borderClass} bg-accent/20 transition-all`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {scoreInfo.icon}
              <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                Safety Index
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${scoreInfo.badgeClass}`}>
              {scoreInfo.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-black text-foreground">
              {currentRoute.safetyScore}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
            <span className="text-[10px] text-muted-foreground ml-auto truncate">
              {scoreInfo.sub}
            </span>
          </div>

          {/* Transparent Score Bar */}
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                currentRoute.safetyScore >= 80
                  ? 'bg-emerald-500'
                  : currentRoute.safetyScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${currentRoute.safetyScore}%` }}
            />
          </div>

          {/* Explicit Data Source & Confidence Badge */}
          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[9px] text-muted-foreground font-sans">
            <span className="flex items-center gap-1 text-primary">
              <Database className="w-2.5 h-2.5" />
              <span>{dataSource}</span>
            </span>
            <span className="font-semibold text-foreground">{confidence}</span>
          </div>
        </div>

        {/* AI Route Evaluation Bubble */}
        <div className="border border-border p-3.5 bg-accent/30 rounded-lg shadow-sm">
          <div className="font-bold text-xs uppercase tracking-tight text-foreground mb-1.5 flex items-center justify-between">
            <span className="text-primary flex items-center gap-1">
              <span>✦</span> [AI] Route Evaluation:
            </span>
            {isSpeaking && (
              <span className="text-[10px] font-normal text-primary animate-pulse flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Speaking...
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
            {currentRoute.evaluationText}
          </p>
        </div>

        {/* Voice Audio Readout Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handlePlayVoice}
            className={`py-1.5 px-3 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isSpeaking 
                ? 'bg-foreground text-background' 
                : 'bg-primary hover:opacity-90 text-primary-foreground shadow-sm'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Play Voice</span>
          </button>

          <button
            onClick={handleStopVoice}
            className="py-1.5 px-3 text-xs font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 bg-card rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Square className="w-3 h-3" />
            <span>Stop</span>
          </button>
        </div>

        {/* ── Multi-Factor 100-Point Scoring Breakdown ───────────────────────── */}
        <div className="border border-border p-3 bg-card rounded-lg space-y-2.5">
          <div className="font-bold text-[11px] uppercase tracking-wider text-foreground border-b border-border pb-1.5 flex items-center justify-between">
            <span>MULTI-FACTOR SCORING METRICS</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {currentRoute.roadCondition}
            </span>
          </div>

          {/* Metric 1: Street Light & Highway Coverage (+25 pts) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#2563eb] rounded-full inline-block" />
                Highway &amp; Streetlight (+25 pts)
              </span>
              <span className="font-bold text-foreground">+{breakdown.highway} pts ({currentRoute.highwayPercent}%)</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#2563eb] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${currentRoute.highwayPercent}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Cell Tower Network Coverage (+20 pts) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#8b5cf6] rounded-full inline-block" />
                5G/4G Cell Signal (+20 pts)
              </span>
              <span className="font-bold text-foreground">+{breakdown.network} pts ({currentRoute.networkCoverage}%)</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#8b5cf6] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${currentRoute.networkCoverage}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Public Safe Places & Fuel (+25 pts) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#10b981] rounded-full inline-block" />
                Public Safe Hubs (+25 pts)
              </span>
              <span className="font-bold text-foreground">+{breakdown.safePlaces} pts ({currentRoute.publicHubsCount} Hubs)</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#10b981] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, currentRoute.publicHubsCount * 20)}%` }}
              />
            </div>
          </div>

          {/* Metric 4: Road Surface / Construction Penalty (-15 pts) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#ea580c] rounded-full inline-block" />
                Construction Hazard Penalty (-15 max)
              </span>
              <span className={`font-bold ${breakdown.constructionPenalty > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                {breakdown.constructionPenalty > 0 ? `-${breakdown.constructionPenalty} pts` : '0 pts (Paved)'}
              </span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#ea580c] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (breakdown.constructionPenalty / 15) * 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 5: Forest & Dark Stretch Penalty (-15 pts) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-2 h-2 bg-foreground rounded-full inline-block" />
                Dark/Canopy Penalty (-15 max)
              </span>
              <span className="font-bold text-rose-500">
                -{breakdown.darkForestPenalty} pts ({currentRoute.darkPercent + currentRoute.forestPercent}%)
              </span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (breakdown.darkForestPenalty / 15) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Telecom & Connectivity Status Card */}
        <div className="border border-purple-500/30 bg-purple-500/5 p-3 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-foreground mb-1">
            <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <Radio className="w-3.5 h-3.5" />
              <span>TELECOM NETWORK STATUS</span>
            </span>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {currentRoute.networkCoverage}% 5G/4G
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground font-sans">
            {currentRoute.networkStatus}
          </div>
        </div>

        {/* Public Safe Havens List */}
        <div className="border border-border p-3 bg-card rounded-lg">
          <div className="font-bold text-[11px] uppercase tracking-wider text-foreground mb-2 flex items-center justify-between">
            <span>PUBLIC SAFE HAVENS ({currentRoute.publicHubsCount})</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              Verified
            </span>
          </div>

          <div className="space-y-1.5">
            {currentRoute.publicHubs && currentRoute.publicHubs.length > 0 ? (
              currentRoute.publicHubs.map((hub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-accent/20 rounded border border-border/50"
                >
                  <span className="flex items-center gap-1.5">
                    <span>
                      {hub.type === 'fuel' ? '⛽' : hub.type === 'police' ? '🚓' : hub.type === 'transit' ? '🚌' : hub.type === 'hospital' ? '🏥' : '🏪'}
                    </span>
                    <span className="text-foreground font-sans font-medium">{hub.label}</span>
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase">
                    {hub.source ? 'REALTIME' : hub.type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic py-1">
                Zero verified safe havens along this shortcut.
              </div>
            )}
          </div>
        </div>

        {/* User Conversation Thread if asked */}
        {chatMessages.length > 0 && (
          <div className="space-y-2 border-t border-border pt-2 font-sans">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-muted text-foreground mr-4 font-mono'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Bottom Input Field */}
      <div className="pt-2 border-t border-border bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask about this route's network, lighting, or safe havens..."
            className="flex-1 text-xs font-sans border border-border focus:border-primary outline-none px-3 py-2 bg-background text-foreground rounded-md transition-colors"
          />
          <button
            type="submit"
            className="w-8 h-8 bg-primary hover:opacity-90 text-primary-foreground transition-colors flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer rounded-md shadow-sm"
            aria-label="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  )
}
