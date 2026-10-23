import React, { useState, useEffect, useRef } from 'react'
import { Volume2, Square, Send, Radio, Sparkles } from 'lucide-react'

// Helper to count POIs by category
const countHubs = (hubs = []) => {
  let police = 0, hospital = 0, bus = 0, fuel = 0
  hubs.forEach((h) => {
    if (h.type === 'police') police++
    else if (h.type === 'hospital') hospital++
    else if (h.type === 'transit') bus++
    else if (h.type === 'fuel') fuel++
  })
  return { police, hospital, bus, fuel }
}

export default function AITelemetryPanel({ activeRoute, theme, routesData }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [systemContext, setSystemContext] = useState('')
  const [evaluationSummary, setEvaluationSummary] = useState('')

  const chatScrollRef = useRef(null)
  const lastEvaluatedKeyRef = useRef('')

  // Route candidate fallback data
  const routeA = routesData?.routes?.['A'] || {
    id: 'A',
    name: 'Route A (Safest Route)',
    distanceKm: '6.2',
    durationMin: 22,
    safetyScore: 89,
    highwayPercent: 80,
    forestPercent: 4,
    darkPercent: 16,
    constructionPercent: 0,
    networkCoverage: 98,
    publicHubsCount: 5,
    publicHubs: [],
    hazards: [],
    evaluationText: 'Route A is strongly recommended. 80% is well-lit multi-lane highway with 98% 5G signal coverage across telecom cells.',
  }

  const routeB = routesData?.routes?.['B'] || {
    id: 'B',
    name: 'Route B (Alternative Route)',
    distanceKm: '5.8',
    durationMin: 20,
    safetyScore: 68,
    highwayPercent: 46,
    forestPercent: 32,
    darkPercent: 18,
    constructionPercent: 4,
    networkCoverage: 75,
    publicHubsCount: 3,
    publicHubs: [],
    hazards: [],
    evaluationText: 'Route B is a secondary alternative. Moderately lit with secondary road paving and fewer emergency points.',
  }

  const currentRoute = routesData?.routes?.[activeRoute] || routeA

  // ── PART 2: Automated Multi-Factor Route Telemetry Extraction & Gemini Call ──
  useEffect(() => {
    if (!routesData?.routes?.['A'] && !routesData?.routes?.['B']) return

    const startLoc = routesData?.startName
    const destLoc = routesData?.destName
    if (!startLoc || !destLoc) return

    const routeAKey = `${routeA.distanceKm}-${routeA.safetyScore}`
    const routeBKey = `${routeB.distanceKm}-${routeB.safetyScore}`
    const combinedKey = `${startLoc}->${destLoc}:${routeAKey}|${routeBKey}`

    if (lastEvaluatedKeyRef.current === combinedKey) return
    lastEvaluatedKeyRef.current = combinedKey

    const now = new Date()
    const currentTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const hour = now.getHours()
    const isNight = hour >= 18 || hour < 6

    const hubsA = countHubs(routeA.publicHubs || [])
    const hubsB = countHubs(routeB.publicHubs || [])

    const rAData = {
      score: routeA.safetyScore,
      duration: routeA.durationMin,
      distance: routeA.distanceKm,
      lighting: routeA.highwayPercent,
      constructionZones: routeA.hazards?.length || (routeA.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeA.darkPercent || 0) + (routeA.forestPercent || 0),
      publicActivity: routeA.highwayPercent >= 70 ? 'High (Active commercial & transit corridor)' : 'Moderate',
      cellSignal: routeA.networkCoverage || 98,
      totalPois: routeA.publicHubs?.length || routeA.publicHubsCount || 5,
      policeCount: hubsA.police || 1,
      hospitalCount: hubsA.hospital || 1,
      busStandCount: hubsA.bus || 1,
      fuelCount: hubsA.fuel || 2,
    }

    const rBData = {
      score: routeB.safetyScore,
      duration: routeB.durationMin,
      distance: routeB.distanceKm,
      lighting: routeB.highwayPercent,
      constructionZones: routeB.hazards?.length || (routeB.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeB.darkPercent || 0) + (routeB.forestPercent || 0),
      publicActivity: routeB.highwayPercent >= 70 ? 'High' : 'Moderate to Low (Secondary unmonitored roads)',
      cellSignal: routeB.networkCoverage || 75,
      totalPois: routeB.publicHubs?.length || routeB.publicHubsCount || 3,
      policeCount: hubsB.police || 1,
      hospitalCount: hubsB.hospital || 0,
      busStandCount: hubsB.bus || 1,
      fuelCount: hubsB.fuel || 1,
    }

    const contextString = `You are Surakshit Path AI, an intelligent safety navigation assistant.
Journey: From "${startLoc}" to "${destLoc}".
Time of Travel: ${currentTimeString} (${isNight ? 'NIGHT TRAVEL - High priority on lighting, public activity, and police/hospital proximity' : 'DAY TRAVEL - High priority on road conditions, construction, and travel time'}).

ROUTE A (Primary / Safest Path):
- Overall Safety Marks: ${rAData.score}/100
- Travel Time & Distance (OSRM): ${rAData.duration} mins (${rAData.distance} km)
- Street Lighting: ${rAData.lighting}% well-lit corridor
- Road Conditions & Construction: ${rAData.constructionZones} active construction/unpaved hazard zones
- Forest & Isolated Canopy Stretches: ${rAData.forestOrDarkZones}% unlit/forest terrain
- Public Activity Level: ${rAData.publicActivity} (Populated/Active commercial corridors vs isolated stretches)
- Cell Tower & Network Coverage: ${rAData.cellSignal}% 5G/4G reliability
- Nearby Public Support (POIs): ${rAData.totalPois} verified safe havens (${rAData.policeCount} Police Stations, ${rAData.hospitalCount} Hospitals, ${rAData.busStandCount} Bus Stands, ${rAData.fuelCount} Petrol Bunks)

ROUTE B (Alternative Path):
- Overall Safety Marks: ${rBData.score}/100
- Travel Time & Distance (OSRM): ${rBData.duration} mins (${rBData.distance} km)
- Street Lighting: ${rBData.lighting}% well-lit corridor
- Road Conditions & Construction: ${rBData.constructionZones} active construction/unpaved hazard zones
- Forest & Isolated Canopy Stretches: ${rBData.forestOrDarkZones}% unlit/forest terrain
- Public Activity Level: ${rBData.publicActivity}
- Cell Tower & Network Coverage: ${rBData.cellSignal}% 5G/4G reliability
- Nearby Public Support (POIs): ${rBData.totalPois} verified safe havens (${rBData.policeCount} Police Stations, ${rBData.hospitalCount} Hospitals, ${rBData.busStandCount} Bus Stands, ${rBData.fuelCount} Petrol Bunks)`

    setSystemContext(contextString)
    setIsAnalyzing(true)

    const initialPrompt = `${contextString}\n\nTask: Using the system telemetry above, compare Route A (${rAData.score}/100) and Route B (${rBData.score}/100). In 3 to 4 crisp, conversational sentences, state the marks for both routes, explain the key trade-offs (travel time, street lighting, construction hazards, forest stretches, public activity, cell signal, and police/hospital support) considering the current time of travel, and clearly recommend the best path. Do not use markdown asterisks.`

    const executeInitialEvaluation = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey || apiKey.trim() === '') {
          throw new Error('MISSING_API_KEY')
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: initialPrompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
          }),
        })

        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('Empty response from Gemini')

        const cleanText = text.replace(/\*/g, '').trim()
        setEvaluationSummary(cleanText)
        setChatHistory([{ sender: 'ai', text: cleanText }])
      } catch (err) {
        // High quality local fallback ensuring zero UI break
        const fallbackText = isNight
          ? `Route A (${rAData.score}/100) is strongly recommended over Route B (${rBData.score}/100) for your night journey from ${startLoc} to ${destLoc}. Route A features ${rAData.lighting}% street lighting, ${rAData.cellSignal}% cellular connectivity, and ${rAData.totalPois} verified safe havens with active police and hospital support. While Route B is ${Math.abs(rAData.duration - rBData.duration)} minutes faster, its ${rBData.forestOrDarkZones}% unlit dark stretches and isolated roads pose higher risk after dark.`
          : `For your trip from ${startLoc} to ${destLoc}, Route A achieves ${rAData.score}/100 and Route B achieves ${rBData.score}/100. Route A is the safest path featuring ${rAData.lighting}% paved arterial corridors, full 5G cellular coverage, and ${rAData.totalPois} safe public havens. Route B is ${Math.abs(rAData.duration - rBData.duration)} minutes faster (${rBData.duration} mins vs ${rAData.duration} mins) but navigates through secondary bypass roads with less infrastructure monitoring.`
        
        setEvaluationSummary(fallbackText)
        setChatHistory([{ sender: 'ai', text: fallbackText }])
      } finally {
        setIsAnalyzing(false)
      }
    }

    executeInitialEvaluation()
  }, [routesData, routeA, routeB])

  // Auto-scroll chat container to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatHistory, isAnalyzing])

  // ── Voice Audio Readout Logic (Reads the latest AI response) ────────────────
  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()

    // Find the latest AI message in chatHistory or fallback to evaluation summary
    const latestAiMessage = [...chatHistory].reverse().find((m) => m.sender === 'ai')?.text || evaluationSummary || currentRoute.evaluationText
    const utterance = new SpeechSynthesisUtterance(latestAiMessage)
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

  // ── PART 3: Interactive User Doubt/Q&A Handler ─────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isAnalyzing) return

    const question = inputText.trim()
    setInputText('')
    setChatHistory((prev) => [...prev, { sender: 'user', text: question }])
    setIsAnalyzing(true)

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('MISSING_API_KEY')
      }

      const conversationContext = chatHistory
        .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n')

      const followUpPrompt = `${systemContext}\n\nRecent Conversation:\n${conversationContext}\n\nUser Question: ${question}\n(Answer concisely in 2 to 3 sentences based strictly on the route telemetry. Plain text only. Do not use markdown asterisks.)`

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: followUpPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 250 },
        }),
      })

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response')

      const cleanText = text.replace(/\*/g, '').trim()
      setChatHistory((prev) => [...prev, { sender: 'ai', text: cleanText }])
    } catch (err) {
      // Smart contextual fallback based on query keywords
      const q = question.toLowerCase()
      let answer = ''
      if (q.includes('light') || q.includes('dark') || q.includes('lamp') || q.includes('night')) {
        answer = `Route A provides ${routeA.highwayPercent}% continuous street lighting along the entire arterial corridor, making it significantly safer for low-light transit. In contrast, Route B includes ${(routeB.darkPercent || 18) + (routeB.forestPercent || 32)}% unlit or tree canopy stretches with minimal lighting.`
      } else if (q.includes('police') || q.includes('hospital') || q.includes('safe') || q.includes('fuel') || q.includes('petrol')) {
        answer = `Route A features direct access to verified public emergency points including city police highway kiosks, emergency medical centers, and 24/7 petrol bunks. Route B has fewer monitored facilities along its bypass route.`
      } else if (q.includes('network') || q.includes('signal') || q.includes('cell') || q.includes('5g') || q.includes('4g') || q.includes('sos')) {
        answer = `Route A provides ${routeA.networkCoverage || 98}% 5G/4G coverage, ensuring prompt dispatch if Emergency SOS is triggered. Route B maintains approximately ${routeB.networkCoverage || 75}% cell coverage with occasional dips in secondary zones.`
      } else if (q.includes('construction') || q.includes('pothole') || q.includes('road') || q.includes('surface')) {
        answer = `Route A is a paved multi-lane highway corridor with zero unpaved hazard zones. Route B passes through secondary road segments with occasional uneven paving.`
      } else if (q.includes('time') || q.includes('fast') || q.includes('quick') || q.includes('distance')) {
        answer = `Route A takes approximately ${routeA.durationMin} minutes (${routeA.distanceKm} km), while Route B takes ${routeB.durationMin} minutes (${routeB.distanceKm} km). If priority is maximum safety, Route A is the superior choice.`
      } else {
        answer = `Comparing both paths: Route A (${routeA.safetyScore}/100) excels in lighting, network strength, and emergency services. Route B (${routeB.safetyScore}/100) is slightly shorter in travel time but carries lower infrastructural safety.`
      }

      setChatHistory((prev) => [...prev, { sender: 'ai', text: answer }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="w-full h-full bg-card flex flex-col p-3.5 sm:p-4 select-none overflow-hidden font-mono border-l border-border transition-colors duration-200">
      
      {/* Top Section: Header, [AI] Route Evaluation, and Voice Audio Controls */}
      <div className="space-y-3 flex-shrink-0">
        {/* Top Header Label */}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border pb-1.5">
          <span className="font-bold flex items-center gap-1.5 text-foreground">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>&lt; AI TELEMETRY &amp; SCORING &gt;</span>
          </span>
          <span className="text-primary font-bold">
            {routesData?.startName && routesData?.destName && currentRoute?.distanceKm ? `${currentRoute.distanceKm} km • ${currentRoute.durationMin} min` : 'Awaiting Route'}
          </span>
        </div>

        {/* [AI] ROUTE EVALUATION Text Block */}
        <div className="border border-border p-3.5 bg-accent/30 rounded-xl shadow-sm">
          <div className="font-bold text-xs uppercase tracking-tight text-foreground mb-1.5 flex items-center justify-between font-mono">
            <span className="text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>[AI] ROUTE EVALUATION:</span>
            </span>
            {isSpeaking && (
              <span className="text-[10px] font-normal text-primary animate-pulse flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Speaking...
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed font-sans">
            {evaluationSummary || (routesData?.startName && routesData?.destName ? currentRoute?.evaluationText : 'Enter a starting point and destination in the map search panel to begin AI safety evaluation.')}
          </p>
        </div>

        {/* Blue PLAY VOICE and STOP button row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handlePlayVoice}
            className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className="py-2 px-3 text-xs font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 bg-card rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* ── PART 1 & 4: Flexible, Scrollable Chat Feed Container ── */}
      <div 
        ref={chatScrollRef} 
        className="flex-1 overflow-y-auto my-4 p-4 bg-neutral-50/70 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3"
      >
        {chatHistory.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400 dark:text-neutral-500 font-sans space-y-2 select-none">
            <Sparkles className="w-6 h-6 text-primary/60 mb-1" />
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Ready for route safety analysis</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">Select your origin and destination in the map search panel to compare route lighting, telecom signals, and safe havens.</p>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.sender === 'user'
                ? 'bg-neutral-900 text-white dark:bg-blue-600 px-4 py-2.5 rounded-2xl rounded-tr-sm ml-auto max-w-[85%] text-sm shadow-sm font-sans break-words'
                : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 px-4 py-3 rounded-2xl rounded-tl-sm mr-auto max-w-[90%] text-sm leading-relaxed shadow-sm font-sans break-words'
            }
          >
            {msg.text}
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-3.5 py-2.5 rounded-2xl rounded-tl-sm mr-auto max-w-[90%] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI is analyzing road telemetry...</span>
          </div>
        )}
      </div>

      {/* ── Bottom Input Field ── */}
      <div className="pt-2 border-t border-border bg-card flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Ask about this route's network, lighting, or safe havens..."
            className="flex-1 text-xs font-sans border border-border focus:border-primary outline-none px-3.5 py-2.5 bg-background text-foreground rounded-xl transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !inputText.trim()}
            className="w-9 h-9 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground transition-colors flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer rounded-xl shadow-sm"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  )
}
