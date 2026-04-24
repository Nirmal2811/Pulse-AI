import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, X, Bot, Dumbbell, Salad, Target } from 'lucide-react'
import { useFitness } from '../../context/FitnessContext'
import { format } from 'date-fns'

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  workouts:   'Workouts',
  diet:       'Diet & Macros',
  progress:   'Progress',
  goals:      'Goals',
  ai_coach:   'AI Coach',
  reminders:  'Reminders',
  profile:    'Profile',
}

const QUICK_ACTIONS = [
  { id: 'workouts', label: 'Log Workout', icon: Dumbbell },
  { id: 'diet',     label: 'Log Meal',    icon: Salad },
  { id: 'ai_coach', label: 'Ask AI',      icon: Bot },
  { id: 'goals',    label: 'Goals',       icon: Target },
]

export default function Header({ isMobile }) {
  const { state, dispatch } = useFitness()
  const { currentPage, notifications, user } = state
  const [showNotifications, setShowNotifications] = useState(false)
  const title = PAGE_TITLES[currentPage] || 'Dashboard'
  const today = format(new Date(), isMobile ? 'MMM d' : 'EEEE, MMMM d')

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 md:py-4"
      style={{
        background: 'rgba(6, 6, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.06] text-gray-400 hover:text-white transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <motion.h1
            key={currentPage}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base md:text-xl font-bold text-white truncate"
          >
            {title}
          </motion.h1>
          <p className="text-[11px] text-gray-500 mt-0.5 hidden sm:block">{today}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Quick actions — desktop only */}
        <div className="hidden md:flex items-center gap-1.5">
          {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Click-away */}
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-72 sm:w-80 rounded-2xl border border-white/[0.08] overflow-hidden z-50"
                  style={{ background: 'rgba(13,13,26,0.98)', backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-gray-600 hover:text-white p-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <div key={i} className="p-3 border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <p className="text-xs text-white">{n.message}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'profile' })}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-glow-violet flex-shrink-0"
        >
          {user.name?.charAt(0) || 'A'}
        </motion.button>
      </div>
    </header>
  )
}
