import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { TrendingDown, TrendingUp, Scale, Plus, X, Check, Ruler } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts'
import { useFitness } from '../context/FitnessContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CHART_PERIODS = [
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
]

function AddProgressModal({ onClose }) {
  const { dispatch } = useFitness()
  const [form, setForm] = useState({
    weight: '', bodyFat: '',
    chest: '', waist: '', hips: '', arms: '', legs: '',
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.weight) { toast.error('Weight is required'); return }
    dispatch({
      type: 'ADD_PROGRESS',
      payload: {
        id: `p${Date.now()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: parseFloat(form.weight),
        bodyFat: parseFloat(form.bodyFat) || null,
        chest: parseFloat(form.chest) || null,
        waist: parseFloat(form.waist) || null,
        hips: parseFloat(form.hips) || null,
        arms: parseFloat(form.arms) || null,
        legs: parseFloat(form.legs) || null,
        notes: form.notes,
      }
    })
    toast.success('Progress entry saved! 📊')
    onClose()
  }

  const fields = [
    { key: 'weight', label: 'Weight (kg)*', icon: '⚖️' },
    { key: 'bodyFat', label: 'Body Fat %', icon: '📊' },
    { key: 'chest', label: 'Chest (cm)', icon: '📏' },
    { key: 'waist', label: 'Waist (cm)', icon: '📏' },
    { key: 'hips', label: 'Hips (cm)', icon: '📏' },
    { key: 'arms', label: 'Arms (cm)', icon: '💪' },
    { key: 'legs', label: 'Legs (cm)', icon: '🦵' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,13,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="font-bold text-white">Log Progress Entry</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {fields.map(({ key, label, icon }) => (
            <div key={key} className={key === 'weight' ? 'col-span-2' : ''}>
              <label className="text-xs text-gray-400 mb-1.5 block">{icon} {label}</label>
              <input
                type="number" step="0.1" placeholder="0"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors"
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1.5 block">📝 Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How are you feeling?"
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors resize-none" />
          </div>
        </div>
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Entry
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-bold">{p.value}{p.name}</p>
      ))}
    </div>
  )
}

export default function ProgressTracker() {
  const { state } = useFitness()
  const { progressEntries, user, workouts } = state
  const [showModal, setShowModal] = useState(false)
  const [period, setPeriod] = useState(30)
  const [activeMetric, setActiveMetric] = useState('weight')

  const sorted = [...progressEntries].sort((a, b) => a.date.localeCompare(b.date))
  const filtered = sorted.slice(-period)

  const chartData = filtered.map(e => ({
    date: format(parseISO(e.date), 'MMM d'),
    weight: e.weight,
    bodyFat: e.bodyFat,
    waist: e.waist,
  }))

  const latest = sorted.slice(-1)[0]
  const previous = sorted.slice(-2, -1)[0]
  const weightChange = latest && previous ? (latest.weight - previous.weight).toFixed(1) : 0
  const totalChange = sorted.length >= 2 ? (sorted.slice(-1)[0]?.weight - sorted[0]?.weight).toFixed(1) : 0

  const bmi = latest ? (latest.weight / ((user.height / 100) ** 2)).toFixed(1) : 0
  const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColor = bmi < 18.5 ? '#06b6d4' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444'

  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg', color: '#8b5cf6', value: latest?.weight },
    { key: 'bodyFat', label: 'Body Fat', unit: '%', color: '#f59e0b', value: latest?.bodyFat },
    { key: 'waist', label: 'Waist', unit: 'cm', color: '#06b6d4', value: latest?.waist },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Progress Tracking</h2>
          <p className="text-sm text-gray-500">{progressEntries.length} entries logged</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-xl shadow-glow-violet hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Log Progress
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current Weight', value: latest?.weight, unit: 'kg', color: '#8b5cf6', change: weightChange },
          { label: 'Body Fat', value: latest?.bodyFat, unit: '%', color: '#f59e0b', change: null },
          { label: 'BMI', value: bmi, unit: '', color: bmiColor, sub: bmiCategory },
          { label: 'Total Change', value: Math.abs(totalChange), unit: 'kg', color: totalChange <= 0 ? '#10b981' : '#ef4444', change: totalChange },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5"
          >
            <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{stat.value ?? '—'}</span>
              <span className="text-sm text-gray-500 mb-0.5">{stat.unit}</span>
            </div>
            {stat.change !== null && stat.change !== undefined && (
              <div className={clsx('flex items-center gap-1 mt-1 text-xs font-medium',
                parseFloat(stat.change) <= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {parseFloat(stat.change) <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {stat.change > 0 ? '+' : ''}{stat.change}kg
              </div>
            )}
            {stat.sub && <p className="text-xs mt-1 font-medium" style={{ color: bmiColor }}>{stat.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex gap-2">
            {metrics.map(m => (
              <button key={m.key} onClick={() => setActiveMetric(m.key)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                  activeMetric === m.key ? 'text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white')}
                style={activeMetric === m.key ? { background: `${m.color}20`, border: `1px solid ${m.color}40`, color: m.color } : {}}
              >
                {m.label}
                {m.value && <span className="text-xs opacity-70">{m.value}{m.unit}</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {CHART_PERIODS.map(p => (
              <button key={p.label} onClick={() => setPeriod(p.days)}
                className={clsx('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  period === p.days ? 'bg-violet-500 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white')}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metrics.find(m => m.key === activeMetric)?.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={metrics.find(m => m.key === activeMetric)?.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey={activeMetric}
              stroke={metrics.find(m => m.key === activeMetric)?.color}
              fill="url(#weightGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }}
              name={metrics.find(m => m.key === activeMetric)?.unit}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Measurements table + PR table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Measurements history */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white">Body Measurements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-white/[0.06]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Waist</th>
                  <th className="pb-2">Arms</th>
                  <th className="pb-2">BF%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sorted.slice(-8).reverse().map(entry => (
                  <tr key={entry.id} className="text-gray-300 hover:text-white transition-colors">
                    <td className="py-2 text-xs text-gray-500">{format(parseISO(entry.date), 'MMM d')}</td>
                    <td className="py-2 font-medium">{entry.weight}kg</td>
                    <td className="py-2">{entry.waist ? `${entry.waist?.toFixed(0)}cm` : '—'}</td>
                    <td className="py-2">{entry.arms ? `${entry.arms?.toFixed(0)}cm` : '—'}</td>
                    <td className="py-2">{entry.bodyFat ? `${entry.bodyFat}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Workout volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white mb-4">Weekly Workout Volume</h3>
          {(() => {
            const volData = Array.from({ length: 6 }, (_, i) => {
              const weekStart = new Date(Date.now() - (5 - i) * 7 * 86400000)
              const weekEnd = new Date(Date.now() - (4 - i) * 7 * 86400000)
              const weekWorkouts = workouts.filter(w => {
                const d = parseISO(w.date)
                return d >= weekStart && d < weekEnd
              })
              const vol = weekWorkouts.reduce((a, wk) =>
                a + wk.exercises?.reduce((b, ex) =>
                  b + ex.sets.reduce((c, s) => c + ((s.weight || 0) * (s.reps || 0)), 0), 0) || 0, 0)
              return { week: `W${i + 1}`, volume: Math.round(vol / 1000) }
            })
            return (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={volData} barSize={24}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={30} unit="t" />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 text-xs">
                      <p className="text-white font-bold">{payload[0]?.value}t volume</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]} fill="url(#volGrad)">
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#06b6d480" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          })()}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && <AddProgressModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
