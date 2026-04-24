import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useFitness } from './context/FitnessContext'
import { useLenis } from './hooks/useLenis'
import { useIsMobile } from './hooks/useMediaQuery'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './components/Dashboard'
import WorkoutTracker from './components/WorkoutTracker'
import DietTracker from './components/DietTracker'
import ProgressTracker from './components/ProgressTracker'
import GoalSystem from './components/GoalSystem'
import AICoach from './components/AICoach'
import Reminders from './components/Reminders'
import UserProfile from './components/UserProfile'
import AuthPage from './components/auth/AuthPage'

const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  workouts: WorkoutTracker,
  diet: DietTracker,
  progress: ProgressTracker,
  goals: GoalSystem,
  ai_coach: AICoach,
  reminders: Reminders,
  profile: UserProfile,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const ALWAYS_FULL_WIDTH = new Set(['reminders', 'profile', 'ai_coach'])

const PAGE_MAX_WIDTHS = {
  dashboard: 'max-w-6xl',
  workouts: 'max-w-5xl',
  diet: 'max-w-5xl',
  progress: 'max-w-5xl',
  goals: 'max-w-5xl',
}

const toastStyle = {
  style: {
    background: 'rgba(13, 13, 26, 0.95)',
    color: '#f8fafc',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    fontSize: '14px',
  },
  success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
  error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
}

export default function App() {
  const { state, dispatch } = useFitness()
  const { currentPage, sidebarOpen, isAuthenticated } = state
  const isMobile = useIsMobile()
  useLenis()

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onAuth={({ user, data }) => dispatch({ type: 'LOGIN', payload: { user, data } })} />
        <Toaster position="top-right" toastOptions={toastStyle} />
      </>
    )
  }

  const PageComponent = PAGE_COMPONENTS[currentPage] || Dashboard

  const contentMaxW =
    isMobile || !sidebarOpen || ALWAYS_FULL_WIDTH.has(currentPage)
      ? 'w-full'
      : (PAGE_MAX_WIDTHS[currentPage] ?? 'w-full')

  const marginLeft = isMobile ? 0 : sidebarOpen ? 240 : 72

  return (
    <div className="flex bg-dark-950 min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none z-0" />

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          />
        )}
      </AnimatePresence>

      <Sidebar isMobile={isMobile} />

      <div
        className="flex flex-col flex-1 min-w-0 min-h-screen transition-all duration-300"
        style={{ marginLeft }}
      >
        <Header isMobile={isMobile} />
        <main className="flex-1 p-4 md:p-6 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={contentMaxW}
            >
              <PageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toaster position="top-right" toastOptions={toastStyle} />
    </div>
  )
}
