import React from 'react'
import { Home, Users, Navigation, UserCheck, User } from 'lucide-react'

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'route', label: 'Route', icon: Navigation },
    { id: 'community', label: 'Community', icon: UserCheck },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="fixed md:absolute bottom-4 left-4 right-4 max-w-[398px] mx-auto bg-white rounded-[30px] shadow-[0_10px_35px_rgba(0,0,0,0.08)] px-5 py-2.5 z-50 flex justify-between items-center border border-slate-100/60"
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-all active:scale-95"
            aria-label={tab.label}
          >
            {/* Active Indicator Bar */}
            <div className="h-1 flex items-center justify-center mb-1">
              {isActive ? (
                <div className="w-7 h-1 bg-[#2563EB] rounded-full animate-in fade-in zoom-in-50 duration-200" />
              ) : (
                <div className="w-7 h-1 bg-transparent" />
              )}
            </div>

            {/* Icon */}
            <IconComponent
              className={`w-5 h-5 transition-colors ${
                isActive ? 'text-[#2563EB] stroke-[2.3]' : 'text-[#334155] stroke-[1.8]'
              }`}
            />

            {/* Label */}
            <span
              className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
                isActive ? 'text-[#2563EB] font-semibold' : 'text-[#334155] font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
