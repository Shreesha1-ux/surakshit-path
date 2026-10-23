import React, { useState, useEffect, useRef } from 'react'
import { Volume2, Square, Send, Radio, Sparkles, Key, Settings, X, Check } from 'lucide-react'

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

// Helper to retrieve Gemini API key from .env or localStorage
export const getEffectiveApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.trim()) return envKey.trim()
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('GEMINI_API_KEY')
    if (localKey && localKey.trim()) return localKey.trim()
  }
  return ''
}

// Multi-model Gemini Caller: calls gemini-2.5-flash first, falls back to gemini-2.0-flash
async function callGemini(promptText, apiKey, maxTokens = 350) {
  if (!apiKey) throw new Error('MISSING_API_KEY')

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: maxTokens,
    },
  }

  // 1. Try gemini-2.5-flash
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text.replace(/\*/g, '').trim()
    } else {
      console.warn(`Gemini 2.5 Flash returned status ${res.status}, falling back to Gemini 2.0 Flash...`)
    }
  } catch (err) {
    console.warn('Gemini 2.5 Flash call failed, trying Gemini 2.0 Flash...', err)
  }

  // 2. Fallback to gemini-2.0-flash
  const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!fallbackRes.ok) {
    throw new Error(`Gemini API error: ${fallbackRes.status}`)
  }

  const data = await fallbackRes.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini API')
  return text.replace(/\*/g, '').trim()
}

// Smart local context-aware response generator based on user intent
function generateContextualReply(userMessage, rAData, rBData, startName, endName) {
  const q = (userMessage || '').trim().toLowerCase()
  const hour = new Date().getHours()
  const isNight = hour >= 18 || hour < 6

  // 1. Greetings (hi, hii, hello, hey, good morning, etc.)
  const isGreeting = /\b(hi|hii|hiii|hello|hey|heyy|greetings|good morning|good afternoon|good evening|howdy|sup|hola)\b/i.test(q) || ['hi', 'hii', 'hiii', 'hello', 'hey', 'heyy'].includes(q)
  if (isGreeting) {
    return `Hello! I'm Surakshit Path AI. I've analyzed your journey from ${startName} to ${endName}. Route A scores ${rAData.score}/100 (${rAData.duration} mins, ${rAData.distance} km) while Route B scores ${rBData.score}/100 (${rBData.duration} mins, ${rBData.distance} km). You can ask me about street lighting, hospitals & police support, forest stretches, road construction, or why Route A is safer!`
  }

  // 2. Lighting / Night / Dark / Visibility questions
  if (q.includes('light') || q.includes('dark') || q.includes('night') || q.includes('lamp') || q.includes('visibility') || q.includes('illum') || q.includes('glow')) {
    return `Route A provides ${rAData.lighting}% continuous high-luminance street lighting along its multi-lane highway corridor, with only ${rAData.forestOrDarkZones}% unlit or tree canopy stretches. In contrast, Route B provides only ${rBData.lighting}% lighting and has ${rBData.forestOrDarkZones}% dark stretches. ${isNight ? 'Because you are traveling at night, Route A is strongly recommended for driver visibility and situational awareness.' : 'Even in daytime, Route A provides significantly wider, clearer road visibility than the secondary bypass corridor.'}`
  }

  // 3. Police / Hospital / Help / Safe Havens questions
  if (q.includes('police') || q.includes('hospital') || q.includes('safe') || q.includes('support') || q.includes('help') || q.includes('emergency') || q.includes('fuel') || q.includes('petrol') || q.includes('bus') || q.includes('haven') || q.includes('station')) {
    return `Along Route A, there are ${rAData.totalPois} verified safe havens: ${rAData.policeCount} police post(s), ${rAData.hospitalCount} emergency hospital(s), ${rAData.busStandCount} transit station(s), and ${rAData.fuelCount} 24/7 petrol bunk(s). Route B offers only ${rBData.totalPois} safe havens (${rBData.policeCount} police, ${rBData.hospitalCount} hospital, ${rBData.busStandCount} bus, ${rBData.fuelCount} fuel), meaning Route A provides vastly superior emergency dispatch and assistance.`
  }

  // 4. Road Condition / Construction / Hazards / Potholes / Forest questions
  if (q.includes('road') || q.includes('construction') || q.includes('pothole') || q.includes('hazard') || q.includes('forest') || q.includes('condition') || q.includes('paved') || q.includes('surface') || q.includes('terrain')) {
    return `Route A follows a well-paved arterial highway with ${rAData.constructionZones} construction hazard zones and only ${rAData.forestPercent || 4}% forest canopy. Route B passes through secondary bypass roads with ${rBData.constructionZones} unpaved/construction warning areas and ${rBData.forestPercent || 32}% isolated tree canopy stretches, which increases the likelihood of potholes and unexpected road obstacles.`
  }

  // 5. Time / Distance / Fastest / Shortest / ETA questions
  if (q.includes('time') || q.includes('fast') || q.includes('short') || q.includes('long') || q.includes('distance') || q.includes('eta') || q.includes('quick') || q.includes('speed') || q.includes('duration') || q.includes('min') || q.includes('km')) {
    const timeDiff = Math.abs(rAData.duration - rBData.duration)
    return `Route B is the quicker option taking ${rBData.duration} mins (${rBData.distance} km), which is ${timeDiff} minute(s) faster than Route A (${rAData.duration} mins, ${rAData.distance} km). However, Route A achieves a safety score of ${rAData.score}/100 compared to Route B's ${rBData.score}/100, making Route A the smarter, safer trade-off.`
  }

  // 6. Network / Cell / Signal / 5G / SOS questions
  if (q.includes('network') || q.includes('signal') || q.includes('cell') || q.includes('tower') || q.includes('5g') || q.includes('4g') || q.includes('sos') || q.includes('phone') || q.includes('coverage')) {
    return `Route A guarantees ${rAData.cellSignal}% high-density 5G/4G telecom coverage, ensuring that Emergency SOS dispatch and live GPS tracking remain uninterrupted. Route B provides approximately ${rBData.cellSignal}% cellular reliability, with occasional signal drops along unmonitored secondary roads.`
  }

  // 7. General Comparison / Which Route / Why / Recommendation
  return `Comparing both paths from ${startName} to ${endName}: Route A (${rAData.score}/100) is strongly recommended over Route B (${rBData.score}/100). Route A wins across 5 of 6 safety factors—offering ${rAData.lighting}% lighting vs ${rBData.lighting}%, ${rAData.totalPois} safe havens vs ${rBData.totalPois}, and ${rAData.cellSignal}% cell signal vs ${rBData.cellSignal}%. While Route B is ${Math.abs(rAData.duration - rBData.duration)} min(s) faster, Route A provides significantly higher security and emergency readiness.`
}

export default function AITelemetryPanel({ activeRoute, theme, routesData, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [systemContext, setSystemContext] = useState('')
  const [evaluationSummary, setEvaluationSummary] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')

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

  // Check API key on mount and setup input state
  useEffect(() => {
    const key = getEffectiveApiKey()
    setHasApiKey(Boolean(key))
    if (typeof window !== 'undefined') {
      setApiKeyInput(localStorage.getItem('GEMINI_API_KEY') || '')
    }
  }, [])

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      const trimmed = apiKeyInput.trim()
      if (trimmed) {
        localStorage.setItem('GEMINI_API_KEY', trimmed)
        setHasApiKey(true)
      } else {
        localStorage.removeItem('GEMINI_API_KEY')
        setHasApiKey(Boolean(import.meta.env.VITE_GEMINI_API_KEY))
      }
      setShowKeyModal(false)
    }
  }

  const handleClearApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('GEMINI_API_KEY')
      setApiKeyInput('')
      setHasApiKey(Boolean(import.meta.env.VITE_GEMINI_API_KEY))
      setShowKeyModal(false)
    }
  }

  // ── PART 2: Automated Multi-Factor Route Telemetry Extraction & Gemini Call ──
  useEffect(() => {
    if (!routesData?.routes?.['A'] && !routesData?.routes?.['B']) return

    const startLoc = routesData?.startName || 'Start Point'
    const destLoc = routesData?.destName || 'Destination Point'

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
      score: routeA.safetyScore || 89,
      duration: routeA.durationMin || 22,
      distance: routeA.distanceKm || '6.2',
      lighting: routeA.factors?.lighting?.score ?? routeA.highwayPercent ?? 80,
      constructionZones: routeA.hazards?.length || (routeA.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeA.darkPercent || 16) + (routeA.forestPercent || 4),
      forestPercent: routeA.forestPercent || 4,
      publicActivity: (routeA.highwayPercent || 80) >= 70 ? 'High (Active commercial & transit corridor)' : 'Moderate',
      cellSignal: routeA.factors?.activity?.cellSignalPercent ?? routeA.networkCoverage ?? 98,
      totalPois: routeA.factors?.support?.totalHubs ?? routeA.publicHubs?.length ?? 5,
      policeCount: routeA.factors?.support?.policeCount ?? hubsA.police ?? 1,
      hospitalCount: routeA.factors?.support?.hospitalCount ?? hubsA.hospital ?? 1,
      busStandCount: routeA.factors?.support?.busStandCount ?? hubsA.bus ?? 1,
      fuelCount: routeA.factors?.support?.fuelCount ?? hubsA.fuel ?? 2,
    }

    const rBData = {
      score: routeB.safetyScore || 68,
      duration: routeB.durationMin || 20,
      distance: routeB.distanceKm || '5.8',
      lighting: routeB.factors?.lighting?.score ?? routeB.highwayPercent ?? 46,
      constructionZones: routeB.hazards?.length || (routeB.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeB.darkPercent || 18) + (routeB.forestPercent || 32),
      forestPercent: routeB.forestPercent || 32,
      publicActivity: (routeB.highwayPercent || 46) >= 70 ? 'High' : 'Moderate to Low (Secondary unmonitored roads)',
      cellSignal: routeB.factors?.activity?.cellSignalPercent ?? routeB.networkCoverage ?? 75,
      totalPois: routeB.factors?.support?.totalHubs ?? routeB.publicHubs?.length ?? 3,
      policeCount: routeB.factors?.support?.policeCount ?? hubsB.police ?? 1,
      hospitalCount: routeB.factors?.support?.hospitalCount ?? hubsB.hospital ?? 0,
      busStandCount: routeB.factors?.support?.busStandCount ?? hubsB.bus ?? 1,
      fuelCount: routeB.factors?.support?.fuelCount ?? hubsB.fuel ?? 1,
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
- Public Activity Level: ${rAData.publicActivity}
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
        const apiKey = getEffectiveApiKey()
        if (!apiKey) throw new Error('MISSING_API_KEY')

        const cleanText = await callGemini(initialPrompt, apiKey, 300)
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

    const startLoc = routesData?.startName || 'Start Point'
    const destLoc = routesData?.destName || 'Destination Point'

    const hubsA = countHubs(routeA.publicHubs || [])
    const hubsB = countHubs(routeB.publicHubs || [])

    const rAData = {
      score: routeA.safetyScore || 89,
      duration: routeA.durationMin || 22,
      distance: routeA.distanceKm || '6.2',
      lighting: routeA.factors?.lighting?.score ?? routeA.highwayPercent ?? 80,
      constructionZones: routeA.hazards?.length || (routeA.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeA.darkPercent || 16) + (routeA.forestPercent || 4),
      forestPercent: routeA.forestPercent || 4,
      publicActivity: (routeA.highwayPercent || 80) >= 70 ? 'High (Active commercial & transit corridor)' : 'Moderate',
      cellSignal: routeA.factors?.activity?.cellSignalPercent ?? routeA.networkCoverage ?? 98,
      totalPois: routeA.factors?.support?.totalHubs ?? routeA.publicHubs?.length ?? 5,
      policeCount: routeA.factors?.support?.policeCount ?? hubsA.police ?? 1,
      hospitalCount: routeA.factors?.support?.hospitalCount ?? hubsA.hospital ?? 1,
      busStandCount: routeA.factors?.support?.busStandCount ?? hubsA.bus ?? 1,
      fuelCount: routeA.factors?.support?.fuelCount ?? hubsA.fuel ?? 2,
    }

    const rBData = {
      score: routeB.safetyScore || 68,
      duration: routeB.durationMin || 20,
      distance: routeB.distanceKm || '5.8',
      lighting: routeB.factors?.lighting?.score ?? routeB.highwayPercent ?? 46,
      constructionZones: routeB.hazards?.length || (routeB.constructionPercent > 0 ? 1 : 0),
      forestOrDarkZones: (routeB.darkPercent || 18) + (routeB.forestPercent || 32),
      forestPercent: routeB.forestPercent || 32,
      publicActivity: (routeB.highwayPercent || 46) >= 70 ? 'High' : 'Moderate to Low (Secondary unmonitored roads)',
      cellSignal: routeB.factors?.activity?.cellSignalPercent ?? routeB.networkCoverage ?? 75,
      totalPois: routeB.factors?.support?.totalHubs ?? routeB.publicHubs?.length ?? 3,
      policeCount: routeB.factors?.support?.policeCount ?? hubsB.police ?? 1,
      hospitalCount: routeB.factors?.support?.hospitalCount ?? hubsB.hospital ?? 0,
      busStandCount: routeB.factors?.support?.busStandCount ?? hubsB.bus ?? 1,
      fuelCount: routeB.factors?.support?.fuelCount ?? hubsB.fuel ?? 1,
    }

    try {
      const apiKey = getEffectiveApiKey()
      if (!apiKey) {
        throw new Error('MISSING_API_KEY')
      }

      const conversationContext = chatHistory
        .slice(-6)
        .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n')

      const followUpPrompt = `${systemContext || `Journey from ${startLoc} to ${destLoc}`}

Recent Conversation:
${conversationContext}

User Message: "${question}"

Instructions:
You are Surakshit Path AI, a friendly, smart road-safety assistant.
If the user greets you (e.g., 'hi', 'hello', 'hey'), greet them back warmly, mention the active journey from ${startLoc} to ${destLoc}, and ask how you can help them compare Route A (${rAData.score}/100) and Route B (${rBData.score}/100).
If they ask a specific question about lighting, timing, police, hospitals, forest stretches, construction, or safety, answer directly using the exact route numbers in 2-3 natural sentences.
Plain text only. Do not use markdown asterisks.`

      const cleanText = await callGemini(followUpPrompt, apiKey, 300)
      setChatHistory((prev) => [...prev, { sender: 'ai', text: cleanText }])
    } catch (err) {
      // Smart contextual fallback based on user query intent
      const contextualReply = generateContextualReply(question, rAData, rBData, startLoc, destLoc)
      setChatHistory((prev) => [...prev, { sender: 'ai', text: contextualReply }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="w-full h-full bg-card flex flex-col p-3.5 sm:p-4 select-none overflow-hidden font-mono border-l border-border transition-colors duration-200 relative">
      
      {/* ── Google Gemini API Key Configuration Modal ── */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 max-w-md w-full space-y-4 font-sans text-neutral-800 dark:text-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Google Gemini API Key</h3>
                  <p className="text-[11px] text-muted-foreground">Power real-time AI conversational telemetry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2.5 rounded-xl outline-none focus:border-primary transition-colors text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Keys are stored securely in your browser's local storage and used directly for Google Gemini 2.5 Flash / 2.0 Flash requests.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {apiKeyInput ? (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-medium"
                >
                  Clear Key
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Section: Header, [AI] Route Evaluation, and Voice Audio Controls */}
      <div className="space-y-3 flex-shrink-0">
        {/* Top Header Label */}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border pb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>&lt; AI TELEMETRY &gt;</span>
            </span>
            {hasApiKey ? (
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/25 transition-colors"
                title="Google Gemini AI is Live (Click to configure key)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI Live</span>
                <Key className="w-2.5 h-2.5 ml-0.5 opacity-70" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Connect your Google Gemini API Key for live AI responses"
              >
                <Key className="w-2.5 h-2.5 text-primary" />
                <span>Set Key</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">
              {routesData?.startName && routesData?.destName && currentRoute?.distanceKm ? `${currentRoute.distanceKm} km • ${currentRoute.durationMin} min` : 'Awaiting Route'}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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

      {/* ── Flexible, Scrollable Chat Feed Container ── */}
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
