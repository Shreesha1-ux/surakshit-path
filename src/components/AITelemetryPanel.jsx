import React, { useState, useEffect, useRef, useMemo } from 'react'
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

// Smart conversational route selection response generator
function generateContextualReply(userMessage, rAData, rBData, startName, endName) {
  const q = (userMessage || '').trim().toLowerCase()
  const hour = new Date().getHours()
  const isNight = hour >= 18 || hour < 6
  const timeDiff = Math.abs((rAData?.duration || 22) - (rBData?.duration || 20))
  const hasTrip = startName && endName && startName !== 'Start Point'

  // 1. Casual Greetings & Welcomes ("hi", "hello", "hey", "how are you", "what's up", "good morning")
  if (/\b(hi|hii|hiii|hello|hey|heyy|howdy|sup|hola|good\s*(morning|afternoon|evening|day))\b/i.test(q) || ['hi', 'hii', 'hiii', 'hello', 'hey'].includes(q)) {
    if (hasTrip) {
      return `Hey! 👋 Good to talk to you. I've analyzed your trip to ${endName}. Route A (${rAData.score}/100) is the safest choice, while Route B (${rBData.score}/100) is about ${timeDiff} min faster. Which route are you leaning toward, or want my advice on the safest pick?`
    }
    return `Hey there! 👋 I'm Surakshit AI, your route safety co-pilot. I specialize in helping you pick the safest road based on street lighting, police presence, and road hazards. Where are you heading today?`
  }

  // 2. "How are you" / "What are you doing"
  if (q.includes('how are you') || q.includes('how r u') || q.includes('how are u') || q.includes('what are you doing') || q.includes("what's up") || q.includes('whats up')) {
    return `I'm doing great, thanks for asking! I'm actively monitoring road conditions and safety telemetry for your journey. Would you like a quick recommendation on whether to pick Route A or Route B?`
  }

  // 3. Identity & Purpose ("who are you", "what do you do", "what is your job", "what can you do")
  if (q.includes('who are you') || q.includes('what can you do') || q.includes('your job') || q.includes('what is this') || q.includes('help me')) {
    return `I'm your personal route selection assistant! My job is to compare multiple paths in real-time—analyzing continuous street lighting, police posts, hospitals, 24/7 petrol bunks, and dark forest stretches—so you can pick the safest corridor with confidence.`
  }

  // 4. Deciding Between Routes / Recommendations ("which route", "which one", "recommend", "should i take", "best route", "choose", "what do you think")
  if (q.includes('which route') || q.includes('which one') || q.includes('recommend') || q.includes('best route') || q.includes('should i') || q.includes('pick') || q.includes('choose') || q.includes('what do you think') || q.includes('better')) {
    return `I definitely recommend taking Route A (${rAData.score}/100)! Even though Route B is about ${timeDiff} minutes faster, Route A has ${rAData.lighting}% continuous street lighting, full 5G coverage, and ${rAData.totalPois} safe havens. Route B has ${rBData.forestOrDarkZones}% unlit dark stretches, so Route A is the smart pick${isNight ? ', especially tonight' : ''}.`
  }

  // 5. In a Rush / Speed vs Safety / Is Route B okay ("rush", "hurry", "fastest", "quickest", "save time", "is b bad", "can i take b", "take route b")
  if (q.includes('rush') || q.includes('hurry') || q.includes('fast') || q.includes('quick') || q.includes('speed') || q.includes('save time') || q.includes('shorter') || q.includes('shortest')) {
    return `Route B is the quicker option taking ${rBData.duration} minutes (${timeDiff} min faster than Route A). If it's bright daylight and you're in a rush, Route B is fine. But for night travel or solo trips, Route A's ${rAData.lighting}% lighting and emergency checkpoints make it well worth the extra ${timeDiff} minutes.`
  }

  // 5b. Is Route B safe at night?
  if ((q.includes('route b') || q.includes('b')) && (q.includes('night') || q.includes('dark') || q.includes('safe at night') || q.includes('safer at night'))) {
    return `No, Route B is not recommended at night. It only provides ${rBData.lighting}% street lighting with ${rBData.forestOrDarkZones}% unlit dark stretches and zero hospital proximity. Route A is much safer at night (${rAData.score}/100) with continuous ${rAData.lighting}% illumination and verified safe havens.`
  }

  // 6. Night Travel / Lighting / Dark Stretches ("light", "lighting", "dark", "night", "visibility", "lamp", "sunset")
  if (q.includes('light') || q.includes('dark') || q.includes('night') || q.includes('visibility') || q.includes('lamp') || q.includes('illum') || q.includes('sunset')) {
    return `Lighting is a major factor here. Route A gives you ${rAData.lighting}% continuous high-luminance street lighting along a multi-lane highway. Route B drops to ${rBData.lighting}% lighting with ${rBData.forestOrDarkZones}% dark or tree canopy sections. ${isNight ? 'Since you are traveling at night, Route A is strongly recommended for visibility.' : 'If you might be returning after dusk, stick with Route A.'}`
  }

  // 7. Safety / Solo Travel / Women's Travel ("solo", "women", "alone", "safe", "scary", "danger", "crime", "threat")
  if (q.includes('solo') || q.includes('women') || q.includes('woman') || q.includes('alone') || q.includes('safe') || q.includes('scary') || q.includes('danger') || q.includes('risk')) {
    return `For solo or late-night travel, stick strictly to Route A. It follows an active commercial corridor with high vehicular traffic, full cellular signal (${rAData.cellSignal}%), and ${rAData.policeCount} active police checkpoint(s). Route B passes through secluded areas with less surveillance.`
  }

  // 8. Police, Hospitals, Safe Havens & Fuel ("police", "hospital", "doctor", "fuel", "petrol", "safe haven", "emergency", "help")
  if (q.includes('police') || q.includes('hospital') || q.includes('doctor') || q.includes('fuel') || q.includes('petrol') || q.includes('haven') || q.includes('station') || q.includes('emergency')) {
    return `Route A has ${rAData.totalPois} verified safe havens: ${rAData.policeCount} police post(s), ${rAData.hospitalCount} hospital(s), and ${rAData.fuelCount} 24/7 petrol bunk(s). Route B only has ${rBData.totalPois} safe stops and no direct hospital proximity.`
  }

  // 9. Road Conditions / Construction / Potholes / Forest ("road", "condition", "construction", "pothole", "forest", "bump", "rough")
  if (q.includes('road') || q.includes('condition') || q.includes('construction') || q.includes('pothole') || q.includes('forest') || q.includes('paved') || q.includes('rough')) {
    return `Route A is a wide, well-paved arterial highway with ${rAData.constructionZones} construction zone(s). Route B uses secondary roads with ${rBData.constructionZones} construction/pothole warning areas and ${rBData.forestPercent || 32}% tree canopy stretches, which can make maneuvering more difficult.`
  }

  // 10. Cellular Network & Emergency SOS ("network", "signal", "cell", "5g", "phone", "reception", "tower", "sos")
  if (q.includes('network') || q.includes('signal') || q.includes('cell') || q.includes('5g') || q.includes('4g') || q.includes('phone') || q.includes('reception') || q.includes('sos')) {
    return `Route A has ${rAData.cellSignal}% high-density cellular coverage, so GPS navigation and emergency SOS will stay connected. Route B drops to ${rBData.cellSignal}% with occasional dead zones along secondary roads.`
  }

  // 11. Courtesy / Thanks ("thank", "thanks", "thx", "awesome", "great", "cool", "helpful", "ok", "okay")
  if (q.includes('thank') || q.includes('thx') || q.includes('awesome') || q.includes('great') || q.includes('cool') || q.includes('helpful') || q === 'ok' || q === 'okay') {
    return `You're very welcome! Safe travels out there. Keep your headlights on and let me know if you need any more advice on route selection!`
  }

  // 12. Farewell ("bye", "goodbye", "cya", "leaving", "gotta go")
  if (q.includes('bye') || q.includes('goodbye') || q.includes('cya') || q.includes('leaving')) {
    return `Drive safe and stay alert! I'll be right here if you need more route guidance along the way.`
  }

  // 13. General Conversational Fallback focused on route selection
  return `I'm here to help you pick the best path! Route A (${rAData.score}/100) is the safest choice with high lighting and emergency checkpoints, while Route B (${rBData.score}/100) is about ${timeDiff} minutes faster but has darker stretches. Feel free to ask which route is better for your specific travel needs!`
}

export default function AITelemetryPanel({ activeRoute, theme, routesData, onClose }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [chatHistory, setChatHistory] = useState(() => {
    const hasActiveTrip = routesData?.startName && routesData?.destName
    if (hasActiveTrip) {
      return [
        {
          sender: 'ai',
          text: `Hey there! 🚗 I'm Surakshit AI, your route safety advisor. For your trip from ${routesData.startName} to ${routesData.destName}, I've analyzed Route A (Safest Highway) and Route B (Shorter Bypass). Which route are you considering, or would you like my advice?`,
        },
      ]
    }
    return [
      {
        sender: 'ai',
        text: `Hey! 👋 I'm Surakshit AI, your route safety co-pilot. I specialize in helping you select the safest travel path based on street lighting, police stations, hospitals, and dark patches. Where are you heading today, or how can I assist with your route choice?`,
      },
    ]
  })
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

  // Multi-factor route telemetry calculations
  const hubsA = useMemo(() => countHubs(routeA.publicHubs || []), [routeA.publicHubs])
  const hubsB = useMemo(() => countHubs(routeB.publicHubs || []), [routeB.publicHubs])

  const rAData = useMemo(() => ({
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
  }), [routeA, hubsA])

  const rBData = useMemo(() => ({
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
  }), [routeB, hubsB])

  const winner = useMemo(() => {
    if (rAData.score >= rBData.score) {
      return {
        id: 'A',
        name: 'Route A',
        score: rAData.score,
        otherId: 'B',
        otherScore: rBData.score,
        duration: rAData.duration,
        otherDuration: rBData.duration,
        timeDiff: Math.abs(rAData.duration - rBData.duration),
      }
    }
    return {
      id: 'B',
      name: 'Route B',
      score: rBData.score,
      otherId: 'A',
      otherScore: rAData.score,
      duration: rBData.duration,
      otherDuration: rAData.duration,
      timeDiff: Math.abs(rAData.duration - rBData.duration),
    }
  }, [rAData, rBData])

  const verdictSummary = useMemo(() => {
    if (winner.id === 'A') {
      return `Route A is recommended because it features superior street lighting (${rAData.lighting}% vs ${rBData.lighting}%) and ${rAData.totalPois} verified safe havens (${rAData.policeCount} police, ${rAData.hospitalCount} hospital), minimizing nighttime risks.`
    }
    return `Route B is recommended (${winner.score}/100) because it offers smooth highway connectivity and a faster travel time of ${winner.duration} mins with ${rBData.totalPois} verified safe havens.`
  }, [winner, rAData, rBData])

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

  // Auto-scroll chat container to bottom on user conversation updates
  useEffect(() => {
    if (chatScrollRef.current && chatHistory.length > 1) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatHistory, isAnalyzing])

  // Scroll to top when routes are evaluated or updated so the breakdown dashboard is immediately visible
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [routesData])

  // ── Voice Audio Readout Logic (Reads the latest AI response) ────────────────
  const handlePlayVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()

    const latestAiMessage = [...chatHistory].reverse().find((m) => m.sender === 'ai')?.text || verdictSummary || evaluationSummary || currentRoute.evaluationText
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
  const sendUserMessage = async (rawQuestion) => {
    if (!rawQuestion || !rawQuestion.trim() || isAnalyzing) return

    const question = rawQuestion.trim()
    setInputText('')
    setChatHistory((prev) => [...prev, { sender: 'user', text: question }])
    setIsAnalyzing(true)

    const startLoc = routesData?.startName || 'Your Starting Point'
    const destLoc = routesData?.destName || 'Your Destination'

    try {
      const apiKey = getEffectiveApiKey()
      if (!apiKey) {
        throw new Error('MISSING_API_KEY')
      }

      const conversationContext = chatHistory
        .slice(-6)
        .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
        .join('\n')

      const followUpPrompt = `${systemContext || `Journey: ${startLoc} to ${destLoc}`}

Conversation History:
${conversationContext}

User Message: "${question}"

Instructions:
You are Surakshit AI, a warm, smart, and natural conversational travel assistant.
Your #1 specialty and primary focus is ROUTE SELECTION (helping commuters compare and choose between Route A and Route B).

How to talk:
1. Talk back naturally, casually, and warmly like a modern AI chatbot (like ChatGPT or Google Assistant). Never sound robotic, formulaic, or overly bureaucratic.
2. KEEP IT CONVERSATIONAL AND SHORT: 2 to 3 natural sentences max per response.
3. Keep your focus on ROUTE SELECTION: whether the user is greeting you, asking for a recommendation, asking about time vs safety, or inquiring about solo travel, guide them clearly on which route to pick and why.
4. If the user asks a casual greeting or question ("hi", "how are you", "what's up"), respond warmly like a real person, then ask which route they're thinking of taking or explain why Route A is recommended.
5. Plain text only. Do not use asterisks (*), markdown formatting, or bullet points.`

      const cleanText = await callGemini(followUpPrompt, apiKey, 300)
      setChatHistory((prev) => [...prev, { sender: 'ai', text: cleanText }])
    } catch (err) {
      // Smart conversational fallback focused on route selection
      const contextualReply = generateContextualReply(question, rAData, rBData, startLoc, destLoc)
      setChatHistory((prev) => [...prev, { sender: 'ai', text: contextualReply }])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSendMessage = (e) => {
    e?.preventDefault()
    sendUserMessage(inputText)
  }

  const handleQuickPrompt = (promptText) => {
    sendUserMessage(promptText)
  }

  return (
    <div className="w-full h-full bg-card flex flex-col p-3.5 sm:p-4 select-none overflow-hidden font-sans border-l border-border transition-colors duration-200 relative">
      
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

      {/* Top Header Bar */}
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border pb-2 mb-2 flex-shrink-0">
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

      {/* ── Main Scrollable Container (Dashboard + Audio Controls + Chat History) ── */}
      <div 
        ref={chatScrollRef} 
        className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 no-scrollbar"
      >
        {/* ── 1. Clean Factor Breakdown Dashboard ── */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-xs border border-slate-100 dark:border-neutral-700/80 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>AI Safety Factor Breakdown</span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
              ⭐ Route {winner.id} Recommended ({winner.score}/100)
            </span>
          </div>

          {/* Factor Comparison Cards (Side-by-Side or Clean Progress Rows) */}
          <div className="space-y-2">
            {/* 1. Street Lighting */}
            <div className="bg-slate-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-slate-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>💡</span> Street Lighting (Night Visibility)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                  Route A +{Math.max(0, rAData.lighting - rBData.lighting)}% Brighter
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route A</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{rAData.lighting}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${rAData.lighting}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route B</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{rBData.lighting}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 dark:bg-neutral-500 rounded-full transition-all duration-500" style={{ width: `${rBData.lighting}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Public Support (Safe Havens) */}
            <div className="bg-slate-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-slate-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🛡️</span> Public Support (Safe Havens)
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-full">
                  {rAData.totalPois} vs {rBData.totalPois} Havens
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/90 border border-slate-100 dark:border-neutral-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Route A</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{rAData.totalPois} Havens</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1">
                    <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">👮 {rAData.policeCount} Police</span>
                    <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded font-medium">🏥 {rAData.hospitalCount} Hospital</span>
                    <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">⛽ {rAData.fuelCount} Fuel</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/90 border border-slate-100 dark:border-neutral-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Route B</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{rBData.totalPois} Havens</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-1">
                    <span className="bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">👮 {rBData.policeCount} Police</span>
                    <span className="bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">🏥 {rBData.hospitalCount} Hospital</span>
                    <span className="bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">⛽ {rBData.fuelCount} Fuel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Cellular / Network Signal */}
            <div className="bg-slate-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-slate-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>📶</span> Cellular / Network Signal
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                  Route A High SOS Reliability
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route A</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{rAData.cellSignal}% (5G)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${rAData.cellSignal}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route B</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{rBData.cellSignal}% (4G)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${rBData.cellSignal}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Road Conditions & Hazards */}
            <div className="bg-slate-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-slate-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🚧</span> Road Conditions & Hazards
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rAData.constructionZones === 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'}`}>
                  {rAData.constructionZones === 0 ? 'Paved Arterial Highway' : 'Active Hazard Zones'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/90 border border-slate-100 dark:border-neutral-700 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Route A</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {rAData.constructionZones === 0 ? '0 Hazards (0%)' : `${rAData.constructionZones} Hazard (-5%)`}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800/90 border border-slate-100 dark:border-neutral-700 flex items-center justify-between">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Route B</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {rBData.constructionZones} Hazard ({routeB.constructionPercent || 4}% penalty)
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Dark & Forest Stretches */}
            <div className="bg-slate-50/80 dark:bg-neutral-900/60 rounded-xl p-2.5 border border-slate-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🌲</span> Dark & Forest Stretches
                </span>
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-full">
                  Route B {rBData.forestOrDarkZones}% Isolated
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route A</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{rAData.forestOrDarkZones}% (Low Risk)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${rAData.forestOrDarkZones}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Route B</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{rBData.forestOrDarkZones}% (Night Risk)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${rBData.forestOrDarkZones}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable Verdict Summary */}
          <div className="rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 p-3 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium flex items-start gap-2 shadow-2xs">
            <span className="text-sm shrink-0">💡</span>
            <p>
              {verdictSummary}
            </p>
          </div>
        </div>

        {/* ── 2. Audio Buttons Directly Below Dashboard ── */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePlayVoice}
            className={`py-2.5 px-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
              isSpeaking 
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <span>{isSpeaking ? 'Speaking...' : 'Play Voice'}</span>
          </button>

          <button
            type="button"
            onClick={handleStopVoice}
            className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 bg-card rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>

        {/* ── 3. Scrollable Chat History ── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>AI Route Q&A</span>
          </div>

          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.sender === 'user'
                  ? 'bg-neutral-900 text-white dark:bg-indigo-600 px-4 py-2.5 rounded-2xl rounded-tr-sm ml-auto max-w-[85%] text-xs shadow-sm font-sans break-words'
                  : 'bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm mr-auto max-w-[92%] text-xs leading-relaxed shadow-sm font-sans break-words'
              }
            >
              {msg.text}
            </div>
          ))}

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-xs font-sans text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 px-3.5 py-2.5 rounded-2xl rounded-tl-sm mr-auto max-w-[90%] animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Surakshit AI is analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Input & Quick Suggestion Chips ── */}
      <div className="pt-2 border-t border-border bg-card flex-shrink-0 space-y-2">
        {/* Quick Suggestion Chips focused on route selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            'Which route should I take?',
            'Is Route B safer at night?',
            "How's the lighting?",
            'Where are police & hospitals?',
          ].map((pillText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleQuickPrompt(pillText)}
              disabled={isAnalyzing}
              className="text-[11px] whitespace-nowrap bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border border-border px-3 py-1.5 rounded-full transition-colors shadow-2xs cursor-pointer font-sans disabled:opacity-50"
            >
              {pillText}
            </button>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Ask which route to take, lighting, police, safety..."
            className="flex-1 text-xs font-sans border border-border focus:border-indigo-600 outline-none px-3.5 py-2.5 bg-background text-foreground rounded-xl transition-colors disabled:opacity-50 shadow-2xs"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !inputText.trim()}
            className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer rounded-xl shadow-sm"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  )
}
