import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInDays } from 'date-fns'
import { Target, Plus, X, Check, Trash2, Trophy, Flame, Dumbbell, Heart, Clock, Scale, Activity, Calendar, Salad, Leaf, Zap, Rocket, BarChart2 } from 'lucide-react'
import { useFitness } from '../context/FitnessContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const GOAL_CATEGORIES = [
  { id: 'body_composition', label: 'Body Composition', Icon: Scale, color: '#8b5cf6', examples: 'Lose weight, reach body fat %' },
  { id: 'strength', label: 'Strength', Icon: Dumbbell, color: '#06b6d4', examples: 'Bench press PR, squat target' },
  { id: 'endurance', label: 'Endurance', Icon: Activity, color: '#10b981', examples: '5k time, VO2 max' },
  { id: 'habit', label: 'Habit & Consistency', Icon: Calendar, color: '#f59e0b', examples: 'Workout 5x/week, log meals daily' },
  { id: 'nutrition', label: 'Nutrition', Icon: Salad, color: '#ec4899', examples: 'Hit protein goal, cut sugar' },
]

const BADGE_LEVELS = [
  { label: 'Starting Out', min: 0, max: 25, color: '#94a3b8', Icon: Leaf },
  { label: 'Building Momentum', min: 25, max: 50, color: '#06b6d4', Icon: Zap },
  { label: 'Halfway There', min: 50, max: 75, color: '#8b5cf6', Icon: Flame },
  { label: 'Almost Done', min: 75, max: 95, color: '#f59e0b', Icon: Rocket },
  { label: 'Goal Achieved!', min: 95, max: 101, color: '#10b981', Icon: Trophy },
]

function getBadge(pct) {
  return BADGE_LEVELS.find(b => pct >= b.min && pct < b.max) || BADGE_LEVELS[0]
}

function getProgress(goal) {
  if (goal.lowerIsBetter) {
    return Math.max(0, Math.min(100, Math.round(
      ((goal.startValue - goal.current) / (goal.startValue - goal.target)) * 100
    )))
  }
  return Math.max(0, Math.min(100, Math.round(
    ((goal.current - goal.startValue) / (goal.target - goal.startValue)) * 100
  )))
}

function AddGoalModal({ onClose }) {
  const { dispatch } = useFitness()
  const [form, setForm] = useState({
    title: '', description: '', category: 'body_composition',
    target: '', current: '', unit: '', startValue: '',
    deadline: format(new Date(Date.now() + 60 * 86400000), 'yyyy-MM-dd'),
    lowerIsBetter: false,
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const cat = GOAL_CATEGORIES.find(c => c.id === form.category)

  const handleSave = () => {
    if (!form.title || !form.target || !form.current) { toast.error('Fill in required fields'); return }
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        id: `g${Date.now()}`,
        ...form,
        target: parseFloat(form.target),
        current: parseFloat(form.current),
        startValue: parseFloat(form.startValue || form.current),
        color: cat?.color || '#8b5cf6',
      }
    })
    toast.success('Goal created! Go crush it! 🎯')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'rgba(13,13,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="font-bold text-white">Create New Goal</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOAL_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => set('category', c.id)}
                  className={clsx('flex items-center gap-2 p-3 rounded-xl text-xs font-medium text-left transition-all',
                    form.category === c.id ? 'text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white border border-transparent')}
                  style={form.category === c.id ? { background: `${c.color}15`, border: `1px solid ${c.color}40`, color: c.color } : {}}
                >
                  <c.Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Goal Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder={`e.g. ${cat?.examples?.split(',')[0]}`}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does success look like?"
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'startValue', label: 'Start *', placeholder: '82' },
              { key: 'current', label: 'Current *', placeholder: '78' },
              { key: 'target', label: 'Target *', placeholder: '74' },
              { key: 'unit', label: 'Unit', placeholder: 'kg' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 transition-colors" />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set('lowerIsBetter', !form.lowerIsBetter)}
                  className={clsx('w-10 h-5 rounded-full transition-all relative',
                    form.lowerIsBetter ? 'bg-violet-500' : 'bg-white/[0.1]')}
                >
                  <div className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                    form.lowerIsBetter ? 'left-5' : 'left-0.5')} />
                </div>
                <span className="text-xs text-gray-400">Lower is better</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Target className="w-4 h-4" /> Create Goal
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function GoalCard({ goal, index }) {
  const { dispatch } = useFitness()
  const [editing, setEditing] = useState(false)
  const [newCurrent, setNewCurrent] = useState(goal.current)
  const pct = getProgress(goal)
  const badge = getBadge(pct)
  const daysLeft = differenceInDays(parseISO(goal.deadline), new Date())
  const cat = GOAL_CATEGORIES.find(c => c.id === goal.category)

  const handleUpdateProgress = () => {
    dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, current: parseFloat(newCurrent) || goal.current } })
    setEditing(false)
    toast.success('Progress updated! 💪')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card rounded-2xl p-5 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at 80% 20%, ${goal.color}08, transparent 60%)` }} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${goal.color}15`, border: `1px solid ${goal.color}25` }}>
              {cat ? <cat.Icon className="w-5 h-5" style={{ color: goal.color }} /> : <Target className="w-5 h-5" style={{ color: goal.color }} />}
            </div>
            <div>
              <h3 className="font-semibold text-white">{goal.title}</h3>
              <p className="text-xs text-gray-500">{goal.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', daysLeft < 0 ? 'bg-red-500/10 text-red-400' : daysLeft < 14 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/[0.05] text-gray-500')}>
              {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
            </span>
            <button
              onClick={() => dispatch({ type: 'DELETE_GOAL', payload: goal.id })}
              className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <badge.Icon className="w-4 h-4" style={{ color: badge.color }} />
              <span className="text-xs font-medium" style={{ color: badge.color }}>{badge.label}</span>
            </div>
            <span className="text-sm font-bold" style={{ color: goal.color }}>{pct}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.1 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs">
            <div>
              <p className="text-gray-600">Start</p>
              <p className="text-gray-300 font-medium">{goal.startValue}{goal.unit}</p>
            </div>
            <div>
              <p className="text-gray-600">Current</p>
              <p className="font-semibold" style={{ color: goal.color }}>{goal.current}{goal.unit}</p>
            </div>
            <div>
              <p className="text-gray-600">Target</p>
              <p className="text-gray-300 font-medium">{goal.target}{goal.unit}</p>
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number" value={newCurrent}
                onChange={e => setNewCurrent(e.target.value)}
                className="w-20 bg-white/[0.08] border rounded-lg px-2 py-1 text-white text-xs text-center focus:border-violet-500/50 transition-colors"
                style={{ borderColor: `${goal.color}40` }}
              />
              <button onClick={handleUpdateProgress} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-xl transition-all font-medium"
              style={{ background: `${goal.color}15`, border: `1px solid ${goal.color}25`, color: goal.color }}>
              Update
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function GoalSystem() {
  const { state } = useFitness()
  const { goals } = state
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? goals : goals.filter(g => g.category === filter)
  const completed = goals.filter(g => getProgress(g) >= 100)
  const active = goals.filter(g => getProgress(g) < 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Goal System</h2>
          <p className="text-sm text-gray-500">{active.length} active · {completed.length} completed</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-xl shadow-glow-violet hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Goal
        </motion.button>
      </div>

      {/* Achievement stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Goals', value: active.length, color: '#8b5cf6', Icon: Target },
          { label: 'Avg. Progress', value: `${goals.length ? Math.round(goals.reduce((a, g) => a + getProgress(g), 0) / goals.length) : 0}%`, color: '#10b981', Icon: BarChart2 },
          { label: 'Completed', value: completed.length, color: '#f59e0b', Icon: Trophy },
          { label: 'Days Tracked', value: Math.ceil((Date.now() - new Date('2024-01-01')) / 86400000), color: '#06b6d4', Icon: Calendar },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-1"><s.Icon className="w-5 h-5" style={{ color: s.color }} /></div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')}
          className={clsx('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            filter === 'all' ? 'bg-violet-500 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white')}>
          All Goals
        </button>
        {GOAL_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === cat.id ? 'text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white')}
            style={filter === cat.id ? { background: `${cat.color}20`, border: `1px solid ${cat.color}40`, color: cat.color } : {}}>
            <cat.Icon className="w-3.5 h-3.5 inline-block mr-1" />{cat.label}
          </button>
        ))}
      </div>

      {/* Goal cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No goals yet. Create your first goal!</p>
          </div>
        ) : (
          filtered.map((goal, i) => <GoalCard key={goal.id} goal={goal} index={i} />)
        )}
      </div>

      {/* Completed goals */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Completed Goals
          </h3>
          <div className="space-y-3">
            {completed.map((goal, i) => (
              <motion.div key={goal.id} className="glass-card rounded-xl p-4 flex items-center gap-4 border border-emerald-500/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><Check className="w-4 h-4" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{goal.title}</p>
                  <p className="text-xs text-gray-500">{goal.target}{goal.unit} achieved</p>
                </div>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Trophy className="w-3 h-3" /> Completed</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddGoalModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
