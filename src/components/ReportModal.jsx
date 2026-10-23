import React, { useState } from 'react'
import { X, AlertTriangle, Lightbulb, Construction, ShieldCheck, MapPin, Loader2 } from 'lucide-react'

export default function ReportModal({ isOpen, onClose, onSubmitReport, userLocationName }) {
  if (!isOpen) return null

  const [category, setCategory] = useState('light')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationText, setLocationText] = useState(userLocationName || 'Near current location')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newReport = {
      id: Date.now(),
      type: category,
      title: title || (category === 'light' ? 'Dark Stretch / Broken Light' : category === 'construction' ? 'Road Construction Hazard' : 'Safety Checkpoint'),
      category: category === 'light' ? 'Streetlight' : category === 'construction' ? 'Construction' : 'Safe Haven',
      location: locationText,
      time: 'Just now',
      votes: 1,
      verified: true,
      description: description || 'Reported by local commuter.',
    }

    setTimeout(() => {
      onSubmitReport(newReport)
      setIsSubmitting(false)
      onClose()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] p-5 w-full max-w-[390px] shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#5E5CE6] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Report Road Incident</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Incident Type Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Hazard Category
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCategory('light')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  category === 'light'
                    ? 'border-2 border-[#2563EB] bg-blue-50/50 font-bold text-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-[11px]">Dark Stretch</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('construction')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  category === 'construction'
                    ? 'border-2 border-[#2563EB] bg-blue-50/50 font-bold text-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Construction className="w-4 h-4 text-orange-500" />
                <span className="text-[11px]">Construction</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('haven')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  category === 'haven'
                    ? 'border-2 border-[#2563EB] bg-blue-50/50 font-bold text-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">Safe Haven</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Incident Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unlit road behind metro station"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Location Details</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Street name or landmark"
                className="w-full text-xs text-slate-900 outline-none bg-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Details (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lighting condition, safety risk, or landmark..."
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Submit Report</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
