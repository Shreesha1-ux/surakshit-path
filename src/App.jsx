import React, { useState, useEffect, useRef } from 'react'
import BottomNav from './components/BottomNav'
import HomeTab from './components/tabs/HomeTab'
import RouteTab from './components/tabs/RouteTab'
import ContactsTab from './components/tabs/ContactsTab'
import CommunityTab from './components/tabs/CommunityTab'
import ProfileTab from './components/tabs/ProfileTab'
import AiChatModal from './components/AiChatModal'
import ReportModal from './components/ReportModal'
import { CheckCircle2, AlertTriangle, ExternalLink, MessageCircle, X } from 'lucide-react'

const SOS_STORAGE_KEY = 'surakshit_sos_whatsapp'

const DEFAULT_SOS_CONFIG = {
  contactName: 'Emergency Contact',
  phone: '+917676757424',
  apiKey: '',
  email: 'shreeshapoojary37@gmail.com',
  dispatchMode: 'direct', // 'direct' | 'bot'
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [theme] = useState('light')

  // Live GPS Geolocation State (Continuous watchPosition)
  const [userLocation, setUserLocation] = useState(null)
  const [userLocationName, setUserLocationName] = useState('Locating GPS...')
  const [locationError, setLocationError] = useState(null)

  // Route & Evaluation State
  const [activeRoute, setActiveRoute] = useState('A')
  const [routesData, setRoutesData] = useState({
    startName: '',
    destName: '',
    dataSource: '',
    confidence: '',
    routes: {},
  })
  const [autoExpandRouteSearch, setAutoExpandRouteSearch] = useState(false)

  // Modals & Sheets
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Toasts & Notifications
  const [toastMessage, setToastMessage] = useState(null)
  const [toastActionUrl, setToastActionUrl] = useState(null)
  const toastTimeoutRef = useRef(null)

  // Community Reports List
  const [communityReports, setCommunityReports] = useState([])

  // Recent Activity Log
  const [recentActivity, setRecentActivity] = useState([
    { text: 'GPS Location Calibrated', time: 'Just now' },
  ])

  // SOS Emergency Configuration
  const [sosConfig, setSosConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(SOS_STORAGE_KEY)
      if (saved) return { ...DEFAULT_SOS_CONFIG, ...JSON.parse(saved) }
    } catch (e) {}
    return DEFAULT_SOS_CONFIG
  })
  const [sosStatus, setSosStatus] = useState('idle')

  // Show Toast Helper
  const showToast = (msg, actionUrl = null, duration = 4000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToastMessage(msg)
    setToastActionUrl(actionUrl)
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null)
      setToastActionUrl(null)
    }, duration)
  }

  // 1. Continuous WatchPosition for High-Accuracy GPS
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation not supported by browser.')
      setUserLocationName('Koramangala, Bengaluru')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        setLocationError(null)

        // Reverse-geocode to get landmark name
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          if (res.ok) {
            const data = await res.json()
            const name = data.address?.neighbourhood || data.address?.suburb || data.address?.city_district || data.address?.city || 'Current Location'
            const city = data.address?.city || data.address?.state || 'Bengaluru'
            setUserLocationName(`${name}, ${city}`)
          }
        } catch (e) {
          setUserLocationName('Koramangala, Bengaluru')
        }
      },
      (err) => {
        console.warn('GPS location access error:', err.message)
        setLocationError(err.message)
        setUserLocationName('Koramangala, Bengaluru')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Sync SOS config from localStorage on change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOS_STORAGE_KEY)
      if (saved) setSosConfig({ ...DEFAULT_SOS_CONFIG, ...JSON.parse(saved) })
    } catch (e) {}
  }, [activeTab])

  // 2. Dispatch Live GPS Emergency SOS
  const handleTriggerSOS = async () => {
    if (sosStatus === 'sending') return
    setSosStatus('sending')

    const lat = userLocation?.lat ?? 12.9352
    const lng = userLocation?.lng ?? 77.6245
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const distressMessage = `🚨 *SURAKSHIT PATH AI - EMERGENCY SOS*\nI need immediate assistance!\n\n📍 Live GPS Location: https://www.google.com/maps?q=${lat},${lng}\n\n🕒 Time: ${timeString}`

    let cleanPhone = (sosConfig.phone || '').replace(/[\s\-\(\)]/g, '')
    const digitsOnly = cleanPhone.replace(/\+/g, '')

    const directUrl = `https://api.whatsapp.com/send?phone=${digitsOnly}&text=${encodeURIComponent(distressMessage)}`

    if (sosConfig.dispatchMode === 'direct') {
      window.open(directUrl, '_blank')
      showToast(`Dispatched WhatsApp SOS to ${sosConfig.contactName} (${sosConfig.phone})`, directUrl)
    } else {
      const apiKey = sosConfig.apiKey || ''
      try {
        const botUrl = `https://api.callmebot.com/whatsapp.php?phone=${digitsOnly}&text=${encodeURIComponent(distressMessage)}&apikey=${encodeURIComponent(apiKey)}`
        fetch(botUrl, { mode: 'no-cors' }).catch((e) => console.log('Bot request sent:', e))
      } catch (err) {
        console.log('Bot request error:', err)
      }
      showToast(`Dispatched silent CallMeBot SOS to ${sosConfig.contactName} (${sosConfig.phone})`, directUrl)
    }

    setRecentActivity((prev) => [
      { text: `SOS Alert dispatched to ${sosConfig.contactName}`, time: 'Just now' },
      ...prev.slice(0, 4),
    ])

    setTimeout(() => setSosStatus('idle'), 3000)
  }

  // 3. Share Live GPS Tracking Link
  const handleShareLiveTracking = () => {
    const lat = userLocation?.lat ?? 12.9352
    const lng = userLocation?.lng ?? 77.6245
    const trackingUrl = `https://www.google.com/maps?q=${lat},${lng}`
    
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(trackingUrl)
    }

    showToast('Live GPS tracking link copied to clipboard!', trackingUrl)
    setRecentActivity((prev) => [
      { text: 'Live GPS link shared', time: 'Just now' },
      ...prev.slice(0, 4),
    ])
  }

  // 4. Navigate to Route with Search
  const handleNavigateToRoute = (query = '') => {
    if (query) {
      setRoutesData((prev) => ({ ...prev, destName: query }))
    }
    setAutoExpandRouteSearch(true)
    setActiveTab('route')
  }

  // 5. Submit Incident Report
  const handleSubmitReport = (report) => {
    setCommunityReports((prev) => [report, ...prev])
    showToast(`Report submitted: ${report.title}`)
    setRecentActivity((prev) => [
      { text: `Reported hazard: ${report.title}`, time: 'Just now' },
      ...prev.slice(0, 4),
    ])
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-0 md:p-4 select-none">
      
      {/* ── Sleek Mobile App Shell Container (max-w-[430px], h-[100dvh]) ────── */}
      <div className="max-w-[430px] w-full mx-auto h-[100dvh] bg-[#F6F7FB] relative overflow-hidden flex flex-col shadow-2xl font-sans text-slate-900">
        
        {/* ── Global Floating Toast Notification ────────────────────────────── */}
        {toastMessage && (
          <div className="absolute top-4 left-4 right-4 z-[999] bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-700/60 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium leading-snug">{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {toastActionUrl && (
              <div className="mt-2 pl-6">
                <a
                  href={toastActionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open in WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Active Tab Viewport Content ──────────────────────────────────── */}
        <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
          {activeTab === 'home' && (
            <HomeTab
              userLocation={userLocation}
              userLocationName={userLocationName}
              onNavigateToRoute={handleNavigateToRoute}
              onTriggerSOS={handleTriggerSOS}
              onShareLiveTracking={handleShareLiveTracking}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onOpenAiChat={() => setIsAiModalOpen(true)}
              routesData={routesData}
              recentActivity={recentActivity}
            />
          )}

          {activeTab === 'route' && (
            <RouteTab
              activeRoute={activeRoute}
              setActiveRoute={setActiveRoute}
              theme={theme}
              routesData={routesData}
              setRoutesData={setRoutesData}
              userLocation={userLocation}
              onOpenAiChat={() => setIsAiModalOpen(true)}
              autoExpandSearch={autoExpandRouteSearch}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsTab
              userLocation={userLocation}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'community' && (
            <CommunityTab
              reports={communityReports}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              onShowToast={showToast}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onNavigateToContacts={() => setActiveTab('contacts')}
              onNavigateToCommunity={() => setActiveTab('community')}
            />
          )}
        </main>

        {/* ── Persistent Floating Bottom Navigation Bar (Across all 5 tabs) ── */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'route') setAutoExpandRouteSearch(false)
            setActiveTab(tab)
          }}
        />

        {/* ── Gemini AI Safety Advisor Chat Modal / Sheet ─────────────────── */}
        <AiChatModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          activeRoute={activeRoute}
          theme={theme}
          routesData={routesData}
        />

        {/* ── Community Incident Report Modal ──────────────────────────────── */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmitReport={handleSubmitReport}
          userLocationName={userLocationName}
        />

      </div>
    </div>
  )
}
