import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus, X, Check, Trash2, Clock, Dumbbell, Salad, Droplets, Moon, Pill, Zap } from 'lucide-react'
import { useFitness } from '../context/FitnessContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const REMINDER_TYPES = [
  { id: 'workout', label: 'Workout', Icon: Dumbbell, color: '#8b5cf6' },
  { id: 'meal', label: 'Meal', Icon: Salad, color: '#10b981' },
  { id: 'water', label: 'Water', Icon: Droplets, color: '#06b6d4' },
  { id: 'sleep', label: 'Sleep', Icon: Moon, color: '#6366f1' },
  { id: 'supplement', label: 'Supplement', Icon: Pill, color: '#f59e0b' },
]

const RECURRING_OPTIONS = [
  { id: 'daily', label: 'Every Day' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'once', label: 'Once' },
]

function AddReminderModal({ onClose }) {
  const { dispatch } = useFitness()
  const [form, setForm] = useState({ title: '', time: '08:00', type: 'workout', recurring: 'daily' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.title) { toast.error('Please enter a reminder title'); return }
    dispatch({
      type: 'ADD_REMINDER',
      payload: { id: `r${Date.now()}`, ...form, enabled: true }
    })
    toast.success('Reminder set! 🔔')
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
        className="w-full max-w-md rounded-2xl"
        style={{ background: 'rgba(13,13,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="font-bold text-white">Add Reminder</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Reminder Type</label>
            <div className="grid grid-cols-3 gap-2">
              {REMINDER_TYPES.map(type => (
                <button key={type.id} onClick={() => set('type', type.id)}
                  className={clsx('flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all',
                    form.type === type.id ? 'text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white')}
                  style={form.type === type.id ? { background: `${type.color}15`, border: `1px solid ${type.color}40`, color: type.color } : {}}>
                  <type.Icon className="w-5 h-5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Reminder Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Morning Workout"
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Repeat</label>
              <select value={form.recurring} onChange={e => set('recurring', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500/50 transition-colors appearance-none">
                {RECURRING_OPTIONS.map(o => <option key={o.id} value={o.id} className="bg-dark-900">{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Bell className="w-4 h-4" /> Set Reminder
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ReminderCard({ reminder, index }) {
  const { dispatch } = useFitness()
  const type = REMINDER_TYPES.find(t => t.id === reminder.type)

  const formatTime = (time) => {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06 }}
      className={clsx(
        'glass-card rounded-2xl p-4 flex items-center gap-4 transition-all',
        !reminder.enabled && 'opacity-50'
      )}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${type?.color}15`, border: `1px solid ${type?.color}25` }}>
        {type ? <type.Icon className="w-6 h-6" style={{ color: type.color }} /> : <Bell className="w-6 h-6 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white">{reminder.title}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(reminder.time)}</span>
          <span className="capitalize">{RECURRING_OPTIONS.find(o => o.id === reminder.recurring)?.label}</span>
          <span className="capitalize px-1.5 py-0.5 rounded-full text-[10px]"
            style={{ background: `${type?.color}15`, color: type?.color }}>
            {type?.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_REMINDER', payload: reminder.id })}
          className={clsx('w-11 h-6 rounded-full transition-all relative',
            reminder.enabled ? 'bg-violet-500' : 'bg-white/[0.1]')}
        >
          <motion.div
            animate={{ x: reminder.enabled ? '20px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
          />
        </button>
        <button
          onClick={() => { dispatch({ type: 'DELETE_REMINDER', payload: reminder.id }); toast.success('Reminder deleted') }}
          className="text-gray-600 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function Reminders() {
  const { state } = useFitness()
  const { reminders } = state
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? reminders : reminders.filter(r => r.type === filter)
  const enabled = reminders.filter(r => r.enabled)
  const sortedFiltered = [...filtered].sort((a, b) => a.time.localeCompare(b.time))

  const getNextReminders = () => {
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return [...reminders]
      .filter(r => r.enabled)
      .map(r => {
        const [h, m] = r.time.split(':').map(Number)
        const reminderMinutes = h * 60 + m
        return { ...r, minutesAway: reminderMinutes > nowMinutes ? reminderMinutes - nowMinutes : 1440 - nowMinutes + reminderMinutes }
      })
      .sort((a, b) => a.minutesAway - b.minutesAway)
      .slice(0, 3)
  }

  const nextReminders = getNextReminders()

  const formatCountdown = (mins) => {
    if (mins < 60) return `in ${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `in ${h}h ${m > 0 ? m + 'm' : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Reminders</h2>
          <p className="text-sm text-gray-500">{enabled.length}/{reminders.length} active</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-xl shadow-glow-violet hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Reminder
        </motion.button>
      </div>

      {/* Upcoming */}
      {nextReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.07))', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-400" /> Upcoming Reminders
          </h3>
          <div className="space-y-2.5">
            {nextReminders.map((r, i) => {
              const type = REMINDER_TYPES.find(t => t.id === r.type)
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  {type ? <type.Icon className="w-5 h-5 flex-shrink-0" style={{ color: type.color }} /> : <Bell className="w-5 h-5 flex-shrink-0 text-gray-400" />}
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{r.title}</p>
                    <p className="text-xs text-gray-500">{r.time} · {RECURRING_OPTIONS.find(o => o.id === r.recurring)?.label}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: `${type?.color}15`, color: type?.color }}>
                    {formatCountdown(r.minutesAway)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {[{ id: 'all', label: 'All', count: reminders.length, Icon: Bell, color: null }, ...REMINDER_TYPES.map(t => ({ id: t.id, label: t.label, count: reminders.filter(r => r.type === t.id).length, color: t.color, Icon: t.Icon }))].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={clsx(
              'flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all',
              filter === item.id ? 'text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white'
            )}
            style={filter === item.id ? { background: item.color ? `${item.color}15` : 'rgba(139,92,246,0.15)', border: `1px solid ${item.color || '#8b5cf6'}40`, color: item.color || '#8b5cf6' } : {}}
          >
            <item.Icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.count > 0 && <span className="text-[10px] opacity-60">{item.count}</span>}
          </button>
        ))}
      </div>

      {/* Reminder list */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedFiltered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-16 text-center"
            >
              <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No reminders yet. Add one to stay on track!</p>
            </motion.div>
          ) : (
            sortedFiltered.map((reminder, i) => (
              <ReminderCard key={reminder.id} reminder={reminder} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Smart Reminders Tips</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <p>• Set your workout reminder 30 minutes before your usual gym time to mentally prepare</p>
          <p>• Water reminders every 2 hours help you hit your daily hydration goal consistently</p>
          <p>• Log meals right after eating for accurate macro tracking — set meal reminders!</p>
          <p>• A sleep reminder 1 hour before bedtime helps you wind down and maintain your schedule</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && <AddReminderModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
