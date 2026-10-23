import React, { useState } from 'react'
import {
  Users,
  Phone,
  Mail,
  ShieldAlert,
  Send,
  Loader2,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Save,
  CheckCircle2,
} from 'lucide-react'

const STORAGE_KEY = 'surakshit_sos_whatsapp'

const DEFAULT_CONFIG = {
  contactName: 'Emergency Contact',
  phone: '+917676757424',
  apiKey: '',
  email: 'shreeshapoojary37@gmail.com',
  dispatchMode: 'direct', // 'direct' | 'bot'
}

export default function ContactsTab({ userLocation, onShowToast }) {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    } catch (e) {}
    return DEFAULT_CONFIG
  })

  const [formData, setFormData] = useState(config)
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSave = (e) => {
    e?.preventDefault?.()
    setConfig(formData)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      setSavedSuccess(true)
      if (onShowToast) onShowToast('Emergency contact settings saved!')
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.warn('Failed saving SOS contact:', err)
    }
  }

  const handleTestAlert = async () => {
    const cleanPhone = (formData.phone || '').replace(/[\s\-\(\)\+]/g, '')
    const digitsOnly = cleanPhone.replace(/\+/g, '')

    if (formData.dispatchMode === 'direct') {
      const lat = userLocation?.lat ?? 12.9565
      const lng = userLocation?.lng ?? 77.6337
      const time = new Date().toLocaleTimeString()
      const testMsg = `🚨 *SURAKSHIT PATH AI - TEST SOS ALERT*\nThis is a test emergency alert.\n\n📍 Live GPS Location: https://www.google.com/maps?q=${lat},${lng}\n🕒 Sent: ${time}`
      const directUrl = `https://api.whatsapp.com/send?phone=${digitsOnly}&text=${encodeURIComponent(testMsg)}`
      window.open(directUrl, '_blank')
      setTestStatus('🟢 Opened WhatsApp with test emergency alert!')
      return
    }

    if (!formData.apiKey || formData.apiKey.trim().length === 0) {
      setTestStatus('❌ Please enter a valid CallMeBot API key first.')
      return
    }

    setIsTesting(true)
    setTestStatus('Pinging CallMeBot API...')

    try {
      const lat = userLocation?.lat ?? 12.9565
      const lng = userLocation?.lng ?? 77.6337
      const testMsg = `🚨 *SURAKSHIT PATH AI - TEST ALERT*\nAutomated test alert ping.\n📍 Live GPS: https://www.google.com/maps?q=${lat},${lng}`
      const url = `https://api.callmebot.com/whatsapp.php?phone=${digitsOnly}&text=${encodeURIComponent(testMsg)}&apikey=${encodeURIComponent(formData.apiKey)}`
      await fetch(url, { mode: 'no-cors' })
      setTestStatus('🟢 Test dispatched! Check your WhatsApp for the message.')
      if (onShowToast) onShowToast('Test alert sent to WhatsApp!')
    } catch (err) {
      setTestStatus('⚠️ Request sent. If you do not get a message, check CallMeBot registration.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4 no-scrollbar">
      
      {/* ── Top Header Card ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#EBF0FF] to-[#DCE6FF] p-5 rounded-[28px] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#2563EB]">
            <ShieldAlert className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Emergency Contacts</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Configured for 1-Click WhatsApp &amp; CallMeBot SOS
            </p>
          </div>
        </div>
      </section>

      {/* ── Form Settings Card ───────────────────────────────────────────── */}
      <section className="bg-white rounded-[26px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/60 space-y-4">
        
        {/* Dispatch Method */}
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Dispatch Method
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, dispatchMode: 'direct' })}
              className={`p-3 rounded-2xl border text-left transition-all ${
                formData.dispatchMode === 'direct'
                  ? 'border-2 border-[#2563EB] bg-blue-50/50 font-bold text-[#2563EB]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Direct WhatsApp</span>
              </div>
              <div className="text-[10px] text-slate-500 font-normal leading-tight">
                100% reliable • Opens chat directly
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, dispatchMode: 'bot' })}
              className={`p-3 rounded-2xl border text-left transition-all ${
                formData.dispatchMode === 'bot'
                  ? 'border-2 border-[#2563EB] bg-blue-50/50 font-bold text-[#2563EB]'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Silent Bot</span>
              </div>
              <div className="text-[10px] text-slate-500 font-normal leading-tight">
                Dispatches in background silently
              </div>
            </button>
          </div>
        </div>

        {/* Contact Name */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Contact Name</label>
          <input
            type="text"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            placeholder="Dad / Mom / Sister / Friend"
            className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            WhatsApp Phone Number (with country code)
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#2563EB]">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+917676757424"
              className="w-full text-sm text-slate-900 outline-none bg-transparent"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Format: +[country code][number] (e.g., +917676757424)
          </span>
        </div>

        {/* If Bot Mode is Active: CallMeBot API key */}
        {formData.dispatchMode === 'bot' && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">CallMeBot WhatsApp Key</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>

            <a
              href="https://api.whatsapp.com/send?phone=34644519523&text=I%20allow%20callmebot%20to%20send%20me%20messages"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Get Free API Key on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value.trim() })}
              placeholder="Paste your CallMeBot API key"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB] bg-white"
            />
          </div>
        )}

        {/* Emergency Email */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Emergency Email (Backup)
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-[#2563EB]">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="shreeshapoojary37@gmail.com"
              className="w-full text-sm text-slate-900 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={isTesting}
            className="flex-1 py-3 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <Send className="w-4 h-4 text-slate-600" />
            )}
            <span>Send Test Alert</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-3 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition"
          >
            {savedSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

        {testStatus && (
          <div className="text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
            {testStatus}
          </div>
        )}

      </section>

    </div>
  )
}
