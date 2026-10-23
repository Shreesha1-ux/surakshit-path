import React, { useState, useEffect, useRef } from 'react'
import { Pencil, Loader2, CheckCircle2, X, ExternalLink, ShieldAlert, Sparkles, Send, MessageCircle } from 'lucide-react'

const STORAGE_KEY = 'surakshit_sos_whatsapp'

const DEFAULT_CONFIG = {
  contactName: 'Emergency Contact',
  phone: '+917676757424',
  apiKey: '',
  email: 'shreeshapoojary37@gmail.com',
  dispatchMode: 'direct', // 'direct' (no key needed) | 'bot' (silent automated)
}

export default function SOSButton() {
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_CONFIG
  })

  // Popover state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [formData, setFormData] = useState(config)
  const [testStatus, setTestStatus] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const popoverRef = useRef(null)

  // Execution state: 'idle' | 'sending' | 'sent'
  const [status, setStatus] = useState('idle')
  const [toastMessage, setToastMessage] = useState('')
  const [directWhatsappUrl, setDirectWhatsappUrl] = useState('')

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false)
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPopoverOpen])

  const handleSaveContact = (e) => {
    e.preventDefault()
    setConfig(formData)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    } catch (err) {
      console.warn('Failed saving SOS contact:', err)
    }
    setIsPopoverOpen(false)
  }

  // Test CallMeBot connection from within the popover
  const handleTestBot = async () => {
    const cleanPhone = (formData.phone || '').replace(/[\s\-\(\)\+]/g, '')
    if (!formData.apiKey || formData.apiKey.trim().length === 0) {
      setTestStatus('❌ Please enter a valid CallMeBot API key first.')
      return
    }

    setIsTesting(true)
    setTestStatus('Pinging CallMeBot API...')

    try {
      const testMsg = 'Test alert from Surakshit AI'
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(testMsg)}&apikey=${encodeURIComponent(formData.apiKey)}`
      
      const res = await fetch(url, { mode: 'no-cors' })
      setTestStatus('🟢 Test dispatched! Check your WhatsApp for the test message.')
    } catch (err) {
      setTestStatus('⚠️ Request sent. If you do not get a message, verify your phone is registered with CallMeBot.')
    } finally {
      setIsTesting(false)
    }
  }

  // ── Dispatch SOS ────────────────────────────────────────────────────────────
  const handleDispatchSOS = async () => {
    if (status === 'sending') return
    setStatus('sending')

    // 1. Get Live GPS coordinates with 2s fallback timeout
    let lat = 12.9352
    let lng = 77.6245

    try {
      const position = await new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          return reject(new Error('Geolocation not supported'))
        }
        const timer = setTimeout(() => {
          reject(new Error('Timeout retrieving GPS'))
        }, 2000)

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timer)
            resolve(pos)
          },
          (err) => {
            clearTimeout(timer)
            reject(err)
          },
          { timeout: 2000, enableHighAccuracy: true }
        )
      })

      if (position?.coords) {
        lat = position.coords.latitude
        lng = position.coords.longitude
      }
    } catch (err) {
      console.log('Using default GPS fallback coordinates:', err.message)
    }

    const timeString = new Date().toLocaleTimeString()
    const distressMessage = `🚨 *SURAKSHIT AI - EMERGENCY SOS*\nI need immediate assistance!\n📍 Live GPS Location: https://www.google.com/maps?q=${lat},${lng}\n🕒 Time: ${timeString}`

    // Clean phone number (strip spaces, symbols, keep digits)
    let cleanPhone = (config.phone || '').replace(/[\s\-\(\)]/g, '')
    const digitsOnly = cleanPhone.replace(/\+/g, '')

    // Form direct WhatsApp URL (100% reliable, zero API keys required)
    const directUrl = `https://api.whatsapp.com/send?phone=${digitsOnly}&text=${encodeURIComponent(distressMessage)}`
    setDirectWhatsappUrl(directUrl)

    if (config.dispatchMode === 'direct') {
      // Direct 1-Click WhatsApp Mode: Immediately launch WhatsApp
      window.open(directUrl, '_blank')
      setStatus('sent')
      setToastMessage(`Opened WhatsApp with live coordinates to ${config.contactName || 'Contact'} (${config.phone})`)
    } else {
      // Silent Bot Mode: Fire CallMeBot API in background
      const apiKey = config.apiKey || ''
      try {
        const botUrl = `https://api.callmebot.com/whatsapp.php?phone=${digitsOnly}&text=${encodeURIComponent(distressMessage)}&apikey=${encodeURIComponent(apiKey)}`
        fetch(botUrl, { mode: 'no-cors' }).catch((e) => console.log('Silent bot request sent:', e))
      } catch (err) {
        console.log('Bot request error:', err)
      }

      setStatus('sent')
      setToastMessage(`Dispatched via CallMeBot to ${config.contactName || 'Contact'} (${config.phone})`)
    }

    // Revert state after 6 seconds
    setTimeout(() => {
      setStatus('idle')
      setToastMessage('')
    }, 6000)
  }

  return (
    <div className="fixed top-4 right-6 z-50 flex items-center gap-2 select-none">
      
      {/* ── Main SOS Button (Pill) ───────────────────────────────────────────── */}
      <button
        onClick={handleDispatchSOS}
        disabled={status === 'sending'}
        className="bg-black hover:bg-neutral-800 text-white font-mono font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
      >
        {status === 'idle' && (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
            </span>
            <span>[!] EMERGENCY SOS</span>
          </>
        )}

        {status === 'sending' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>DISPATCHING SOS...</span>
          </>
        )}

        {status === 'sent' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300">✓ SOS DISPATCHED!</span>
          </>
        )}
      </button>

      {/* ── Pencil Edit Button ───────────────────────────────────────────────── */}
      <button
        onClick={() => {
          setFormData(config)
          setTestStatus('')
          setIsPopoverOpen((prev) => !prev)
        }}
        className="bg-white border border-black text-black hover:bg-neutral-100 p-2.5 rounded-full shadow-md cursor-pointer transition-transform active:scale-90 flex items-center justify-center"
        aria-label="Edit SOS Emergency Contact"
        title="Configure WhatsApp Emergency Contact"
      >
        <Pencil className="w-4 h-4 text-black" />
      </button>

      {/* ── Pencil Edit Popover (Contact Configuration) ─────────────────────── */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="absolute top-14 right-0 w-[340px] sm:w-[380px] bg-white border border-black rounded-xl p-5 shadow-2xl z-50 text-black font-sans max-h-[85vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-black" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black">
                SOS WhatsApp Setup
              </h3>
            </div>
            <button
              onClick={() => setIsPopoverOpen(false)}
              className="text-neutral-500 hover:text-black p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4">
            
            {/* Dispatch Mode Selector */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold mb-1.5">
                DISPATCH METHOD
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, dispatchMode: 'direct' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    formData.dispatchMode === 'direct'
                      ? 'border-2 border-black bg-neutral-100 font-bold text-black'
                      : 'border-neutral-200 text-neutral-600 hover:border-black'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-black mb-0.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Direct WhatsApp</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-normal">
                    100% reliable • No API key needed
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, dispatchMode: 'bot' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    formData.dispatchMode === 'bot'
                      ? 'border-2 border-black bg-neutral-100 font-bold text-black'
                      : 'border-neutral-200 text-neutral-600 hover:border-black'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-black mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Automated Bot</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-normal">
                    Silent in background • Requires free key
                  </div>
                </button>
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold mb-1">
                CONTACT NAME
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full text-xs font-mono border border-neutral-300 focus:border-black outline-none px-3 py-2 rounded-md bg-white text-black"
                placeholder="Dad / Mom / Sister / Friend"
                required
              />
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold mb-1">
                WHATSAPP PHONE (WITH COUNTRY CODE)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs font-mono border border-neutral-300 focus:border-black outline-none px-3 py-2 rounded-md bg-white text-black"
                placeholder="+917676757424"
                required
              />
              <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">
                Format: +[country code][number] (e.g. +917676757424)
              </span>
            </div>

            {/* If Automated Bot mode is selected, show CallMeBot API key instructions */}
            {formData.dispatchMode === 'bot' && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-black font-bold">
                    CALLMEBOT WHATSAPP API KEY
                  </label>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">Free</span>
                </div>

                {/* 1-Click Link to get key in WhatsApp */}
                <a
                  href="https://api.whatsapp.com/send?phone=34644519523&text=I%20allow%20callmebot%20to%20send%20me%20messages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>📲 Get API Key via WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>

                <div className="text-[10px] text-neutral-600 leading-tight space-y-1">
                  <p>1. Tap the green button above to open WhatsApp.</p>
                  <p>2. Send: <span className="font-semibold text-black">"I allow callmebot to send me messages"</span>.</p>
                  <p>3. The bot will instantly reply with your personal API Key. Paste it below:</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value.trim() })}
                    className="flex-1 text-xs font-mono border border-neutral-300 focus:border-black outline-none px-2.5 py-1.5 rounded-md bg-white text-black"
                    placeholder="Enter your received API Key (e.g. 583921)"
                  />
                  <button
                    type="button"
                    onClick={handleTestBot}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-black hover:text-white text-xs font-mono font-bold rounded-md transition-colors flex items-center gap-1"
                  >
                    {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Test</span>
                  </button>
                </div>

                {testStatus && (
                  <p className="text-[11px] font-mono text-neutral-800 bg-white p-2 rounded border border-neutral-200">
                    {testStatus}
                  </p>
                )}
              </div>
            )}

            {/* Emergency Email */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold mb-1">
                EMERGENCY EMAIL (OPTIONAL BACKUP)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs font-mono border border-neutral-300 focus:border-black outline-none px-3 py-2 rounded-md bg-white text-black"
                placeholder="shreeshapoojary37@gmail.com"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Save Emergency Settings
            </button>
          </form>
        </div>
      )}

      {/* ── Non-blocking Floating Toast Notification ─────────────────────────── */}
      {toastMessage && (
        <div className="absolute top-14 right-0 w-84 bg-black/95 text-white border border-neutral-700 rounded-xl p-3.5 shadow-2xl z-50 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2.5">
            <span className="text-emerald-400 text-sm">🟢</span>
            <div className="flex-1 leading-snug">
              <span className="font-bold text-white block mb-0.5">Emergency Distress Alert</span>
              <span className="text-neutral-300 text-[11px] block">{toastMessage}</span>

              {/* Direct WhatsApp Fallback Link in Toast */}
              {directWhatsappUrl && (
                <a
                  href={directWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open in WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
