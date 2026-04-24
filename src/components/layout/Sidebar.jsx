import { motion, AnimatePresence } from 'framer-motion'
import { useFitness } from '../../context/FitnessContext'
import {
  LayoutDashboard, Dumbbell, Salad, TrendingUp,
  Target, Bot, Bell, User, ChevronLeft, ChevronRight,
  Zap, X,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'diet', label: 'Diet & Macros', icon: Salad },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'ai_coach', label: 'AI Coach', icon: Bot, highlight: true },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function Sidebar({ isMobile }) {
  const { state, dispatch } = useFitness()
  const { currentPage, sidebarOpen, user } = state

  // On mobile: slide in/out as full-width overlay (always 240px, translateX for visibility)
  // On desktop: collapse to icon-only (72px) or expand to full (240px), never off-screen
  const motionProps = isMobile
    ? {
        animate: { x: sidebarOpen ? 0 : -260, width: 240 },
        initial: { x: -260, width: 240 },
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }
    : {
        animate: { x: 0, width: sidebarOpen ? 240 : 72 },
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }

  // Labels are visible whenever sidebar is expanded (desktop open) or on mobile (always 240px)
  const showLabels = isMobile ? true : sidebarOpen

  const handleNavClick = (id) => {
    dispatch({ type: 'SET_PAGE', payload: id })
    // Auto-close sidebar on mobile after navigation
    if (isMobile) dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  return (
    <motion.aside
      {...motionProps}
      className="fixed left-0 top-0 h-full z-50 flex flex-col"
      style={{
        background: 'rgba(6, 6, 15, 0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-glow-violet">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <AnimatePresence>
          {showLabels && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
            >
              <span className="text-white font-bold text-lg tracking-tight">
                Pulse<span className="gradient-text">AI</span>
              </span>
              <p className="text-[10px] text-gray-500 -mt-0.5">Fitness Intelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Close button — mobile only */}
        {isMobile && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="ml-auto text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = currentPage === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                active
                  ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]',
                item.highlight && !active && 'border border-violet-500/20'
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/15 to-pink-500/10 border border-violet-500/20"
                  transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
                />
              )}
              <div className={clsx(
                'relative z-10 flex-shrink-0 w-5 h-5',
                active ? 'text-violet-400' : 'text-current',
                item.highlight && !active && 'text-violet-400'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <AnimatePresence>
                {showLabels && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={clsx(
                      'relative z-10 text-sm font-medium truncate flex-1 text-left',
                      item.highlight && !active && 'text-violet-300'
                    )}
                  >
                    {item.label}
                    {item.highlight && (
                      <span className="ml-2 text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-semibold">
                        AI
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </nav>

      {/* User + Toggle */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        <motion.button
          onClick={() => handleNavClick('profile')}
          whileHover={{ x: 2 }}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user.name?.charAt(0) || 'A'}
          </div>
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left overflow-hidden"
              >
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-gray-500 text-xs truncate capitalize">{user.fitnessLevel}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.05] transition-colors text-gray-500 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </motion.aside>
  )
}
