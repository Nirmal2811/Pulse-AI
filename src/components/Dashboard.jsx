import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { format, subDays } from 'date-fns'
import {
  Flame, Dumbbell, Droplets, Target, TrendingUp,
  Zap, ChevronRight, Star, Bot, Check,
} from 'lucide-react'
import { useFitness, useTodayMacros } from '../context/FitnessContext'
import clsx from 'clsx'

function useCountUp(target, delay = 0) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const end = Math.round(target || 0)
    if (end === 0) { setCount(0); return }
    let rafId
    let startTime = null
    const duration = 1100
    const delayMs = delay * 1000
    const start = () => {
      startTime = null
      function tick(now) {
        if (!startTime) startTime = now
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * end))
        if (progress < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }
    const timer = setTimeout(start, delayMs)
    return () => { clearTimeout(timer); cancelAnimationFrame(rafId) }
  }, [target, delay])
  return count
}

function StatCard({ icon: Icon, label, value, total, unit, color, index }) {
  const displayed = useCountUp(value, index * 0.1)
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/[0.12] transition-colors"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -translate-y-4 translate-x-4"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {percent !== null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}>
            {percent}%
          </span>
        )}
      </div>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-2xl font-bold text-white">{displayed}</span>
        <span className="text-sm text-gray-500 mb-0.5">{unit}</span>
        {total && <span className="text-sm text-gray-600 mb-0.5">/ {total}</span>}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      {percent !== null && (
        <div className="mt-3 h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
          />
        </div>
      )}
    </motion.div>
  )
}

function MacroRing({ label, value, total, color }) {
  const pct = Math.min(100, (value / total) * 100)
  const r = 36, cx = 44, cy = 44, stroke = 6
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[88px] h-[88px]">
        <svg width="88" height="88" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white">{Math.round(value)}</span>
          <span className="text-[9px] text-gray-500">g</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-white text-center">{label}</p>
        <p className="text-[10px] text-gray-600 text-center">{total}g goal</p>
      </div>
    </div>
  )
}

function WeekStrip({ workouts }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const hasWorkout = workouts.some(w => w.date === dateStr)
    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
    return { date: d, dateStr, hasWorkout, isToday, label: format(d, 'EEE') }
  })

  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto">
      {days.map((day, i) => (
        <motion.div
          key={day.dateStr}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center gap-1 flex-1 min-w-0"
        >
          <span className="text-[9px] sm:text-[10px] text-gray-600">{day.label}</span>
          <div className={clsx(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all',
            day.hasWorkout
              ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-glow-violet'
              : day.isToday
              ? 'bg-white/[0.08] text-white border border-white/20'
              : 'bg-white/[0.03] text-gray-600'
          )}>
            {day.hasWorkout ? <Check className="w-3 h-3" /> : format(day.date, 'd')}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function computePersonalRecords(workouts) {
  const prs = {}
  workouts.forEach(w => {
    w.exercises?.forEach(ex => {
      ex.sets?.forEach(set => {
        const weight = set.weight || 0
        const reps = set.reps || 0
        if (!weight && !reps) return
        if (!prs[ex.name] || weight > prs[ex.name].weight || (weight === prs[ex.name].weight && reps > prs[ex.name].reps)) {
          prs[ex.name] = { exercise: ex.name, weight, reps, date: w.date }
        }
      })
    })
  })
  return Object.values(prs).sort((a, b) => b.weight - a.weight).slice(0, 5)
}

function getDynamicTip(macros, weekWorkouts, user, progressEntries) {
  const proteinPct = (macros.protein / (user.proteinGoal || 1)) * 100
  const calPct = (macros.calories / (user.calorieGoal || 1)) * 100
  const weekCount = weekWorkouts.length
  if (proteinPct > 90) return `Protein is on point today (${macros.protein}g)! 💪 Your muscles will thank you at recovery time.`
  if (proteinPct < 40) return `Protein is low today (${macros.protein}g / ${user.proteinGoal}g). Add a protein source to protect your gains!`
  if (calPct > 105) return `You're slightly over your calorie goal today. Opt for lighter options in the evening — consistency beats perfection.`
  if (weekCount < 2) return `Only ${weekCount} workout${weekCount === 1 ? '' : 's'} logged this week. Even one session makes a difference — let's go! 🏋️`
  if (progressEntries.length === 0) return `Start logging your body measurements in Progress to track your transformation over time. 📊`
  return `You're doing great this week! ${weekCount}/${user.weeklyWorkoutGoal} sessions done. Stay consistent and the results will compound. 🔥`
}

export default function Dashboard() {
  const { state, dispatch } = useFitness()
  const { user, workouts, meals, goals, waterLogs, progressEntries } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const macros = useTodayMacros(meals, user, today)
  const todayWater = waterLogs.find(w => w.date === today)?.glasses || 0
  const todayWorkouts = workouts.filter(w => w.date === today)
  const weekWorkouts = workouts.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const diff = (now - d) / 86400000
    return diff <= 7
  })
  const latestWeight = progressEntries?.slice(-1)[0]?.weight || user.weight
  const personalRecords = computePersonalRecords(workouts)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const aiTip = getDynamicTip(macros, weekWorkouts, user, progressEntries)

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.1) 50%, rgba(6,182,212,0.05) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {greeting}, <span className="gradient-text">{user.name?.split(' ')[0]}</span>! 🔥
            </h2>
            <p className="text-gray-400 text-sm">
              {weekWorkouts.length}/{user.weeklyWorkoutGoal} workouts this week ·{' '}
              {Math.round(latestWeight)}kg
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'workouts' })}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-semibold rounded-xl shadow-glow-violet text-center"
            >
              + Log Workout
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'ai_coach' })}
              className="flex-1 sm:flex-none px-4 py-2 bg-white/[0.08] border border-white/[0.1] text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/[0.12] transition-colors"
            >
              <Bot className="w-4 h-4 text-violet-400" /> Ask AI
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Flame} label="Calories Today" value={macros.calories} total={user.calorieGoal} unit="kcal" color="#8b5cf6" index={0} />
        <StatCard icon={Dumbbell} label="Workouts This Week" value={weekWorkouts.length} total={user.weeklyWorkoutGoal} unit="sessions" color="#06b6d4" index={1} />
        <StatCard icon={Droplets} label="Water Intake" value={todayWater} total={user.waterGoal} unit="glasses" color="#10b981" index={2} />
        <StatCard icon={TrendingUp} label="Current Weight" value={latestWeight} unit="kg" color="#f59e0b" index={3} />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Today's Macros</h3>
            <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'diet' })}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-around">
            <MacroRing label="Protein" value={macros.protein} total={user.proteinGoal} color="#8b5cf6" />
            <MacroRing label="Carbs" value={macros.carbs} total={user.carbsGoal} color="#06b6d4" />
            <MacroRing label="Fat" value={macros.fat} total={user.fatGoal} color="#f59e0b" />
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Calories</p>
              <p className="text-lg font-bold text-white">{macros.calories} <span className="text-sm text-gray-500 font-normal">/ {user.calorieGoal}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-lg font-bold text-emerald-400">{Math.max(0, user.calorieGoal - macros.calories)}</p>
            </div>
          </div>
        </motion.div>

        {/* Week Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Weekly Activity</h3>
            <span className="text-xs text-gray-500">{weekWorkouts.length}/{user.weeklyWorkoutGoal} done</span>
          </div>
          <WeekStrip workouts={workouts} />
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-gray-500 mb-2">This week's burn</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">
                {weekWorkouts.reduce((a, w) => a + (w.calories || 0), 0).toLocaleString()}
                <span className="text-sm text-gray-500 font-normal ml-1">kcal</span>
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                {weekWorkouts.reduce((a, w) => a + (w.duration || 0), 0)} min total
              </span>
            </div>
          </div>
        </motion.div>

        {/* Goals snapshot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Active Goals</h3>
            <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'goals' })}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No goals yet.</p>
                <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'goals' })}
                  className="text-xs text-violet-400 hover:text-violet-300 mt-1">Create your first goal →</button>
              </div>
            ) : goals.slice(0, 3).map((goal, i) => {
              const pct = goal.lowerIsBetter
                ? Math.max(0, Math.round(((goal.startValue - goal.current) / (goal.startValue - goal.target)) * 100))
                : Math.max(0, Math.round(((goal.current - goal.startValue) / (goal.target - goal.startValue)) * 100))
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-white truncate">{goal.title}</p>
                    <span className="text-xs font-semibold" style={{ color: goal.color }}>{Math.min(100, pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, pct)}%` }}
                      transition={{ duration: 1, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: goal.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* AI Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-5 relative overflow-hidden cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'ai_coach' })}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-glow-violet">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white">FitAI Daily Insight</p>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-medium">AI</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{aiTip}</p>
              <p className="text-xs text-violet-400 mt-2 flex items-center gap-1">
                Chat with AI <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent workouts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Recent Workouts</h3>
            <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'workouts' })}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            {workouts.length === 0 && (
              <div className="text-center py-6">
                <Dumbbell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-600">No workouts logged yet.</p>
                <button onClick={() => dispatch({ type: 'SET_PAGE', payload: 'workouts' })}
                  className="text-xs text-violet-400 hover:text-violet-300 mt-1">Log your first workout →</button>
              </div>
            )}
            {workouts.slice(0, 3).map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{w.name}</p>
                  <p className="text-xs text-gray-500">
                    {w.exercises?.length} exercises · {w.duration}min · {w.calories} kcal
                  </p>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">{w.date === format(subDays(new Date(), 0), 'yyyy-MM-dd') ? 'Today' : w.date === format(subDays(new Date(), 1), 'yyyy-MM-dd') ? 'Yesterday' : w.date}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* PRs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">Personal Records</h3>
        </div>
        {personalRecords.length === 0 && (
          <div className="text-center py-6">
            <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Log workouts with weights to see your personal records here.</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {personalRecords.map((pr, i) => (
            <motion.div
              key={pr.exercise}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center hover:border-amber-500/20 transition-colors"
            >
              <p className="text-xs text-gray-500 mb-1">{pr.exercise}</p>
              <p className="text-base font-bold text-white">
                {pr.weight > 0 ? `${pr.weight}kg` : `${pr.reps} reps`}
              </p>
              {pr.weight > 0 && <p className="text-[10px] text-amber-400">× {pr.reps} reps</p>}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
