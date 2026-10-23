import React, { useState } from 'react'
import {
  UserCheck,
  Plus,
  AlertTriangle,
  Lightbulb,
  Construction,
  ShieldCheck,
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const INITIAL_REPORTS = [
  {
    id: 1,
    type: 'light',
    title: 'Streetlight Outage on 100ft Road',
    category: 'Streetlight',
    location: '100ft Road, Indiranagar',
    time: '12m ago',
    votes: 8,
    verified: true,
    description: 'Stretches for ~400m near junction. High pedestrian traffic.',
  },
  {
    id: 2,
    type: 'construction',
    title: 'Deep Trenching & Open Potholes',
    category: 'Construction',
    location: 'Intermediate Ring Rd, Koramangala',
    time: '45m ago',
    votes: 14,
    verified: true,
    description: 'Unbarricaded metro pipeline work on left lane.',
  },
  {
    id: 3,
    type: 'haven',
    title: '24/7 Women Police Help Desk',
    category: 'Safe Haven',
    location: 'Sony World Signal Checkpoint',
    time: '2h ago',
    votes: 29,
    verified: true,
    description: 'Active PCR patrol vehicle and well-lit kiosk.',
  },
  {
    id: 4,
    type: 'light',
    title: 'Flickering Solar Lamps',
    category: 'Streetlight',
    location: 'Near Sony Signal Underpass',
    time: '3h ago',
    votes: 5,
    verified: false,
    description: 'Dark patches after 9:30 PM.',
  },
]

export default function CommunityTab({ reports = [], onOpenReportModal, onShowToast }) {
  const [filter, setFilter] = useState('all')
  const [reportList, setReportList] = useState(() => {
    try {
      const saved = localStorage.getItem('surakshit_community_reports')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return INITIAL_REPORTS
  })

  // Merge external newly created reports if any
  const combinedReports = [...reports, ...reportList.filter(r => !reports.some(er => er.id === r.id))]

  const filtered = filter === 'all' 
    ? combinedReports 
    : combinedReports.filter(r => r.type === filter)

  const handleUpvote = (id) => {
    setReportList((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, votes: r.votes + 1 } : r)
      try {
        localStorage.setItem('surakshit_community_reports', JSON.stringify(updated))
      } catch (e) {}
      return updated
    })
    if (onShowToast) onShowToast('Thank you for verifying this report!')
  }

  const getCategoryIcon = (type) => {
    if (type === 'light') return <Lightbulb className="w-5 h-5 text-amber-500" />
    if (type === 'construction') return <Construction className="w-5 h-5 text-orange-500" />
    return <ShieldCheck className="w-5 h-5 text-emerald-500" />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4 no-scrollbar">
      
      {/* ── Top Header Card ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#EAF0FF] to-[#DCE6FF] p-5 rounded-[28px] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Community Safety</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Crowdsourced, real-time hazard verification
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="bg-[#2563EB] hover:bg-blue-700 text-white p-3 rounded-2xl shadow-sm flex items-center gap-1.5 text-xs font-bold active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report</span>
        </button>
      </section>

      {/* ── Filter Chips ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {[
          { id: 'all', label: 'All Hazards' },
          { id: 'light', label: 'Streetlights' },
          { id: 'construction', label: 'Construction' },
          { id: 'haven', label: 'Safe Havens' },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
              filter === chip.id
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Feed of Verified Reports ─────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/60 space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  {getCategoryIcon(item.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>

              {item.verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-12">
              {item.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
              <button
                type="button"
                onClick={() => handleUpvote(item.id)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-[#2563EB] font-medium py-1 px-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Confirm Hazard ({item.votes})</span>
              </button>

              <span className="text-[10px] text-slate-400">
                Surakshit Community Network
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
