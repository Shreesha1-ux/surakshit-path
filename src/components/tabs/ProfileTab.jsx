import React, { useState } from 'react'
import {
  Pencil,
  Copy,
  Check,
  Shield,
  Users,
  FileText,
  ChevronRight,
  LogOut,
  CheckCircle,
  X,
} from 'lucide-react'

export default function ProfileTab({
  onShowToast,
  onOpenReportModal,
  onNavigateToContacts,
  onNavigateToCommunity,
}) {
  const [copiedId, setCopiedId] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('surakshit_user_profile')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {
      name: 'kanav',
      safarId: 'SF-00V1-4GCK',
      email: 'kanav6677@gmail.com',
    }
  })

  const [editForm, setEditForm] = useState(profile)

  const handleCopyId = () => {
    navigator.clipboard?.writeText(profile.safarId)
    setCopiedId(true)
    if (onShowToast) onShowToast(`Copied Safar ID: ${profile.safarId}`)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    setProfile(editForm)
    try {
      localStorage.setItem('surakshit_user_profile', JSON.stringify(editForm))
    } catch (e) {}
    setIsEditing(false)
    if (onShowToast) onShowToast('Profile updated successfully!')
  }

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out of Surakshit Path?')) {
      if (onShowToast) onShowToast('Signed out of session.')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3.5 no-scrollbar">
      
      {/* ── 1. Pastel Gradient Profile Header Card ─────────────────────────── */}
      <section className="relative rounded-[30px] p-6 bg-gradient-to-br from-[#F9E8F2] via-[#EBF0FF] to-[#DDE7FF] shadow-sm flex flex-col items-center text-center">
        {/* Top-Right Edit Button */}
        <button
          type="button"
          onClick={() => {
            setEditForm(profile)
            setIsEditing(true)
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#2563EB] hover:scale-105 active:scale-95 transition cursor-pointer"
          title="Edit Profile"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Center Avatar Circle */}
        <div className="w-24 h-24 rounded-full bg-white shadow-md flex items-center justify-center mb-3 p-4 overflow-hidden border border-slate-100">
          <img
            src="/logo-icon.png"
            alt="Profile Avatar"
            className="w-full h-full object-contain"
          />
        </div>

        {/* User Name & Verified Badge */}
        <div className="flex items-center gap-1.5 justify-center">
          <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
          <svg className="w-5 h-5 text-[#2563EB] fill-[#2563EB]" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
        </div>

        {/* Safar ID Pill */}
        <div
          onClick={handleCopyId}
          className="bg-white/90 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 mt-2 flex items-center gap-2 shadow-xs cursor-pointer hover:bg-white transition"
          title="Click to copy Safar ID"
        >
          <span>Safar ID: {profile.safarId}</span>
          {copiedId ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>

        {/* Email */}
        <p className="text-xs text-slate-500 mt-2 font-medium">{profile.email}</p>
      </section>

      {/* ── 2. Three Stacked Profile Action Cards ──────────────────────────── */}
      <section className="space-y-3">
        {/* Card 1 — Safety Stats */}
        <div className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-xs border border-slate-100/60">
          <div className="flex items-center gap-3.5">
            <div className="bg-[#EAF2FF] text-[#2563EB] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 fill-[#2563EB]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 leading-tight">Safety Stats</h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">You're all set!</p>
              <p className="text-[11px] text-slate-400">No alerts • All good</p>
            </div>
          </div>
          <div className="bg-[#E6F8EF] text-emerald-600 w-9 h-9 rounded-full flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2 — Connections */}
        <div 
          onClick={onNavigateToContacts}
          className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-xs border border-slate-100/60 cursor-pointer hover:bg-slate-50/60 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-[#F3EFFE] text-[#7C3AED] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 leading-tight">Connections</h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">Emergency Network</p>
              <p className="text-[11px] text-slate-400">Manage trusted contacts &amp; SOS</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* Card 3 — Reports */}
        <div 
          onClick={onNavigateToCommunity}
          className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-xs border border-slate-100/60 cursor-pointer hover:bg-slate-50/60 transition"
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-[#F3EFFE] text-[#7C3AED] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 leading-tight">Reports</h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">3 Recent Reports</p>
              <p className="text-[11px] text-slate-400">View community safety logs</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>
      </section>

      {/* ── 3. Sign Out Button (Pastel Pink) ──────────────────────────────── */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full bg-[#FFE9EE] hover:bg-[#FFD8E1] text-[#E11D48] font-semibold py-4 rounded-[22px] flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-xs"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>

      {/* ── Edit Profile Modal ────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[26px] p-5 w-full max-w-[360px] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">User Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Safar ID</label>
                <input
                  type="text"
                  value={editForm.safarId}
                  onChange={(e) => setEditForm({ ...editForm, safarId: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold text-xs hover:bg-blue-700 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
