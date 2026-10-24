import React, { useState } from 'react'
import {
  Search,
  Mic,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Crosshair,
  Flag,
  MessageCircle,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Bell,
} from 'lucide-react'

export default function HomeTab({
  userLocation,
  userLocationName,
  onNavigateToRoute,
  onTriggerSOS,
  onShareLiveTracking,
  onOpenReportModal,
  onOpenAiChat,
  routesData,
  recentActivity = [],
  onShowToast,
}) {
  const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Quick voice query mock or browser speech recognition
  const handleVoiceSearch = (e) => {
    e.stopPropagation()
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onNavigateToRoute()
      return
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        if (transcript) {
          const cleaned = transcript
            .replace(/^(navigate to|take me to|directions to|route to|go to|to)\s+/i, '')
            .trim()
          onNavigateToRoute(cleaned || transcript)
        }
      }
      recognition.start()
    } catch (err) {
      setIsListening(false)
      onNavigateToRoute()
    }
  }

  // Active route data from routesData if present
  const routeA = routesData?.routes?.A
  const routeB = routesData?.routes?.B

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28 space-y-4 no-scrollbar">
      
      {/* ── 1. Top Greeting & Notification Header Bar ─────────────────────── */}
      <div className="flex items-center justify-between px-1 mb-2">
        {/* Left Side: Custom App Logo + Greeting */}
        <div className="flex items-center gap-3">
          {/* Official SurakshitPath App Logo Icon */}
          <div className="w-[52px] h-[52px] rounded-[20px] bg-white shadow-[0_6px_20px_rgba(30,27,75,0.08)] p-1.5 flex items-center justify-center shrink-0 border border-slate-100/80 overflow-hidden">
            <img
              src="/logo-icon.png"
              alt="Surakshit Path Logo"
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Brand Name & Tagline Stack */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-xl font-extrabold text-[#1E1B4B] tracking-tight">
                Surakshit
              </span>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#7A1C49] via-[#C72C41] to-[#EA580C] tracking-tight">
                Path
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 tracking-tight leading-tight mt-0.5">
              Beyond Directions. Towards Safety.
            </span>
          </div>
        </div>

        {/* Right Side: Notification Bell Button */}
        <button
          type="button"
          onClick={() => {
            if (onShowToast) {
              onShowToast('Safety Notice: Highway patrols active on major routes.')
            }
          }}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <div className="relative">
            <Bell className="w-6 h-6 text-[#1E1B4B]" strokeWidth={2} />
            <span className="w-2 h-2 rounded-full bg-[#FF5A5F] absolute -top-0.5 right-0.5 border border-white" />
          </div>
        </button>
      </div>

      {/* ── 2. "Where are you going today?" Pastel Hero Card ────────────────── */}
      <section className="rounded-[30px] p-6 bg-gradient-to-br from-[#F9E7F0] via-[#EAEFFF] to-[#CADBFF] shadow-[0_8px_30px_rgba(99,102,241,0.08)] space-y-4">
        {/* Heading */}
        <div>
          <h1 className="text-[26px] leading-[1.2] font-extrabold text-[#1E1B4B] tracking-tight whitespace-pre-line">
            Where are you{'\n'}going today?
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Plan, travel, and reach safely.
          </p>
        </div>

        {/* Visual Route Line Indicator */}
        <div className="flex items-center w-full pt-2">
          {/* Left endpoint: Hollow blue circle */}
          <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#2563EB] bg-white shrink-0" />
          {/* Middle connector: Full-width horizontal dashed line */}
          <div className="flex-1 border-t-2 border-dashed border-[#93A8F4] mx-1" />
          {/* Right endpoint: Hollow coral-red circle */}
          <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#F43F5E] bg-white shrink-0" />
        </div>

        {/* "Your current route >" Link */}
        <div>
          <button
            type="button"
            onClick={() => onNavigateToRoute()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span>
              {routesData?.startName && routesData?.destName
                ? `Your current route: ${routesData.startName} → ${routesData.destName}`
                : 'Your current route'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Embedded White Pill Search Bar */}
        <div
          onClick={() => onNavigateToRoute()}
          className="bg-white rounded-full pl-5 pr-2 py-2 flex items-center justify-between shadow-[0_6px_20px_rgba(37,99,235,0.08)] mt-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 overflow-hidden flex-1 mr-3">
            <Search className="w-5 h-5 text-slate-500 shrink-0" />
            <span className="text-[15px] font-medium text-slate-500 truncate flex-1 text-left">
              {routesData?.destName ? `To: ${routesData.destName}` : 'Search destination'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-[#5865F2] to-[#7B88FF] flex items-center justify-center text-white shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer ${
              isListening ? 'ring-4 ring-indigo-300 animate-pulse' : ''
            }`}
            title="Voice Search"
          >
            <Mic className="w-5 h-5 text-white" />
          </button>
        </div>
      </section>

      {/* ── 3. Current Location Card ──────────────────────────────────────── */}
      <section className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 border border-slate-100/50">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] flex items-center justify-center text-[#4F46E5] shrink-0">
          <MapPin className="w-6 h-6 fill-[#4F46E5]" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block leading-none mb-1">
            CURRENT LOCATION
          </span>
          <h2 className="text-base font-bold text-slate-900 truncate">
            {userLocationName || (userLocation ? 'Moodbidri, Karnataka' : 'Locating GPS...')}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs text-slate-500 font-medium">
              Location accuracy: {userLocation ? 'High' : 'Approximate'}
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. Smart Safety Card (2 columns) ──────────────────────────────── */}
      <section className="bg-white rounded-[26px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/50">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-slate-900">Smart Safety</h3>
          <span className="w-5 h-5 rounded-full bg-[#5B4EFF] text-white flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100">
          {/* Left: Location Ready */}
          <div className="pr-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0EEFF] text-[#5B4EFF] flex items-center justify-center shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block leading-tight">Location</span>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">Ready</span>
              </div>
            </div>
          </div>

          {/* Right: Emergency Contacts Ready */}
          <div className="pl-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F0EEFF] text-[#5B4EFF] flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block leading-tight">Emergency contacts</span>
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 2x2 Feature Action Grid ────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3.5">
        
        {/* Card 1 — SOS (Top-Left) */}
        <div
          onClick={onTriggerSOS}
          className="bg-gradient-to-br from-[#FFE4EC] to-[#FFD6E4] rounded-[24px] p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-full bg-[#FF477E] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm tracking-wider">
            SOS
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 font-bold text-base">SOS</h4>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-tight mt-0.5">
              Instant help in an emergen...
            </p>
          </div>
        </div>

        {/* Card 2 — Live Tracking (Top-Right) */}
        <div
          onClick={onShareLiveTracking}
          className="bg-gradient-to-br from-[#E3F0FF] to-[#D6E8FF] rounded-[24px] p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-full bg-[#2B7FFF] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Crosshair className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 font-bold text-base">Live Tracki...</h4>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-tight mt-0.5">
              Share your trip in real-time
            </p>
          </div>
        </div>

        {/* Card 3 — Report (Bottom-Left) */}
        <div
          onClick={onOpenReportModal}
          className="bg-gradient-to-br from-[#EDE9FE] to-[#E0E7FF] rounded-[24px] p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-full bg-[#7C4DFF] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Flag className="w-5 h-5 fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 font-bold text-base">Report</h4>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-tight mt-0.5">
              Report incidents anonymously
            </p>
          </div>
        </div>

        {/* Card 4 — Chatbot (Bottom-Right) */}
        <div
          onClick={onOpenAiChat}
          className="bg-gradient-to-br from-[#EBE9FE] to-[#E4E2FF] rounded-[24px] p-4 flex items-center gap-3 cursor-pointer active:scale-95 transition shadow-sm hover:shadow-md"
        >
          <div className="w-12 h-12 rounded-full bg-[#5E5CE6] text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageCircle className="w-5 h-5 fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-slate-900 font-bold text-base">Chatbot</h4>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-tight mt-0.5">
              24/7 travel safety assistant
            </p>
          </div>
        </div>

      </section>

      {/* ── 6. Recent Activity Card (Collapsible) ─────────────────────────── */}
      <section className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-hidden">
        <div
          onClick={() => setIsRecentActivityOpen((prev) => !prev)}
          className="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h4 className="text-base font-bold text-slate-900">Recent activity</h4>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
              isRecentActivityOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {isRecentActivityOpen && (
          <div className="px-5 pb-4 pt-1 border-t border-slate-50 space-y-3">
            {/* Active or latest route */}
            {routeA ? (
              <div 
                onClick={() => onNavigateToRoute()}
                className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {routesData?.startName || 'Current Location'} → {routesData?.destName || 'Destination'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Route A ({routeA.safetyScore}/100) vs Route B ({routeB?.safetyScore || 70}/100)
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#2563EB] text-white px-2 py-0.5 rounded-full">
                  View Map
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                No recent trips yet. Tap "Search destination" above to generate 2 safest routes!
              </div>
            )}

            {/* Recent activity entries if any */}
            {recentActivity.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none">
                <span className="text-slate-700 font-medium">{act.text}</span>
                <span className="text-[10px] text-slate-400">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
