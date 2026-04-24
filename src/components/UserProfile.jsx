import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Edit2, Camera, Award, Zap, Target, Dumbbell, Calendar, Scale, LogOut, Leaf, Flame, Trophy, Ruler, BarChart2, Activity, Droplets, Moon, Beef, Check } from 'lucide-react'
import { useFitness } from '../context/FitnessContext'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FITNESS_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: '0-1 year training', color: '#10b981', Icon: Leaf },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 years', color: '#06b6d4', Icon: Zap },
  { id: 'advanced', label: 'Advanced', desc: '3+ years', color: '#8b5cf6', Icon: Flame },
  { id: 'athlete', label: 'Athlete', desc: 'Competitive', color: '#f59e0b', Icon: Trophy },
]

const GOALS_LIST = [
  { id: 'lose_fat', label: 'Lose Fat', emoji: '🔥' },
  { id: 'gain_muscle', label: 'Build Muscle', emoji: '💪' },
  { id: 'maintain', label: 'Maintain', emoji: '⚖️' },
  { id: 'endurance', label: 'Improve Endurance', emoji: '🏃' },
  { id: 'strength', label: 'Get Stronger', emoji: '🏋️' },
  { id: 'health', label: 'General Health', emoji: '❤️' },
]

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-base font-bold text-white">{value}<span className="text-xs text-gray-500 font-normal ml-1">{unit}</span></p>
      </div>
    </div>
  )
}

export default function UserProfile() {
  const { state, dispatch } = useFitness()
  const { user, workouts, goals, progressEntries } = state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...user })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const latestWeight = progressEntries?.slice(-1)[0]?.weight || user.weight
  const bmi = (latestWeight / ((user.height / 100) ** 2)).toFixed(1)
  const bmiCat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColor = bmi < 18.5 ? '#06b6d4' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444'
  const totalWorkouts = workouts.length
  const totalCalsBurned = workouts.reduce((a, w) => a + (w.calories || 0), 0)
  const memberDays = Math.ceil((Date.now() - new Date(user.memberSince)) / 86400000)

  const handleSave = () => {
    dispatch({ type: 'UPDATE_USER', payload: form })
    setEditing(false)
    toast.success('Profile updated! 🎉')
  }

  return (
    <div className="space-y-6">
      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-glow-violet">
              {user.name?.charAt(0)}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/[0.15] hover:bg-white/[0.25] border border-white/[0.2] rounded-lg flex items-center justify-center transition-colors">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {FITNESS_LEVELS.map(l => l.id === user.fitnessLevel ? (
                    <span key={l.id} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
                      style={{ background: `${l.color}20`, border: `1px solid ${l.color}30`, color: l.color }}>
                      <l.Icon className="w-3 h-3" /> {l.label}
                    </span>
                  ) : null)}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Member {memberDays} days
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => editing ? handleSave() : setEditing(true)}
                className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  editing
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-glow-violet'
                    : 'bg-white/[0.08] border border-white/[0.1] text-white hover:bg-white/[0.12]')}
              >
                {editing ? <><Save className="w-4 h-4" /><span className="hidden sm:inline"> Save</span></> : <><Edit2 className="w-4 h-4" /><span className="hidden sm:inline"> Edit</span></>}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
          {[
            { label: 'Workouts', value: totalWorkouts, Icon: Dumbbell },
            { label: 'Kcal Burned', value: totalCalsBurned.toLocaleString(), Icon: Flame },
            { label: 'Active Goals', value: goals.length, Icon: Target },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><s.Icon className="w-3 h-3" /> {s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-white">Sign Out</p>
          <p className="text-xs text-gray-500 mt-0.5">Your data is saved and will be here when you return.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            try {
              await signOut(auth)
              toast.success('Signed out. See you next time! 👋')
              setTimeout(() => dispatch({ type: 'LOGOUT' }), 800)
            } catch (error) {
              console.error('Sign out error:', error)
              toast.error('Error signing out')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" /> Personal Info
          </h3>
          <div className="space-y-3">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
              { key: 'age', label: 'Age', type: 'number', placeholder: '25' },
              { key: 'height', label: 'Height (cm)', type: 'number', placeholder: '175' },
              { key: 'weight', label: 'Current Weight (kg)', type: 'number', placeholder: '75' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <label className="text-xs text-gray-500 w-36 flex-shrink-0">{f.label}</label>
                {editing ? (
                  <input type={f.type} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                    className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 transition-colors" />
                ) : (
                  <span className="text-sm text-white font-medium">{user[f.key] || '—'}</span>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs text-gray-500 w-36 flex-shrink-0">Gender</label>
              {editing ? (
                <select value={form.gender} onChange={e => set('gender', e.target.value)}
                  className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 transition-colors appearance-none">
                  <option value="male" className="bg-dark-900">Male</option>
                  <option value="female" className="bg-dark-900">Female</option>
                  <option value="other" className="bg-dark-900">Other</option>
                </select>
              ) : (
                <span className="text-sm text-white font-medium capitalize">{user.gender || '—'}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Fitness Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cyan-400" /> Fitness Settings
          </h3>
          <div className="space-y-4">
            {/* Fitness level */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">Fitness Level</label>
              <div className="grid grid-cols-2 gap-2">
                {FITNESS_LEVELS.map(l => (
                  <button key={l.id}
                    onClick={() => editing && set('fitnessLevel', l.id)}
                    className={clsx('flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-left transition-all',
                      form.fitnessLevel === l.id ? 'text-white' : 'bg-white/[0.04] text-gray-400',
                      !editing && 'cursor-default')}
                    style={form.fitnessLevel === l.id ? { background: `${l.color}15`, border: `1px solid ${l.color}30`, color: l.color } : {}}>
                    <l.Icon className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p>{l.label}</p>
                      <p className="text-[10px] opacity-60">{l.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            {[
              { key: 'calorieGoal', label: 'Daily Calories', Icon: Flame, unit: 'kcal' },
              { key: 'proteinGoal', label: 'Protein Goal', Icon: Beef, unit: 'g' },
              { key: 'carbsGoal', label: 'Carbs Goal', Icon: Activity, unit: 'g' },
              { key: 'fatGoal', label: 'Fat Goal', Icon: Droplets, unit: 'g' },
              { key: 'waterGoal', label: 'Water Goal', Icon: Droplets, unit: 'glasses' },
              { key: 'weeklyWorkoutGoal', label: 'Weekly Workouts', Icon: Dumbbell, unit: 'sessions' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between gap-4">
                <label className="text-xs text-gray-500 flex items-center gap-1.5"><f.Icon className="w-3 h-3" /> {f.label}</label>
                {editing ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={form[f.key] || ''} onChange={e => set(f.key, parseFloat(e.target.value))}
                      className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-white text-sm text-right focus:border-violet-500/50 transition-colors" />
                    <span className="text-xs text-gray-600">{f.unit}</span>
                  </div>
                ) : (
                  <span className="text-sm text-white font-medium">{user[f.key]} <span className="text-xs text-gray-500">{f.unit}</span></span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Body Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" /> Body Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Scale} label="Current Weight" value={latestWeight} unit="kg" color="#8b5cf6" />
          <StatCard icon={Ruler} label="Height" value={user.height} unit="cm" color="#06b6d4" />
          <StatCard icon={BarChart2} label="BMI" value={bmi} unit="" color={bmiColor} />
          <StatCard icon={Activity} label="BMI Category" value={bmiCat} unit="" color={bmiColor} />
        </div>

        {/* BMI scale */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 25%, #f59e0b 60%, #ef4444 100%)' }}>
            <div className="absolute top-0 h-3 w-1 bg-white rounded-full shadow-lg transition-all"
              style={{ left: `${Math.min(95, Math.max(0, ((parseFloat(bmi) - 15) / 20) * 100))}%` }} />
          </div>
          <p className="text-xs mt-1.5 font-medium text-center" style={{ color: bmiColor }}>
            Your BMI: {bmi} — {bmiCat}
          </p>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Achievements
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { Icon: Dumbbell, label: 'First Workout', desc: 'Logged your first session', unlocked: totalWorkouts >= 1 },
            { Icon: Flame, label: '10 Workouts', desc: 'Stayed consistent', unlocked: totalWorkouts >= 10 },
            { Icon: Beef, label: 'Protein Pro', desc: 'Hit protein goal 7 days', unlocked: true },
            { Icon: Target, label: 'Goal Setter', desc: 'Created your first goal', unlocked: goals.length >= 1 },
            { Icon: Droplets, label: 'Hydrated', desc: 'Hit water goal 5 days', unlocked: true },
            { Icon: BarChart2, label: 'Tracker', desc: 'Logged progress 30 days', unlocked: progressEntries.length >= 30 },
            { Icon: Zap, label: 'AI User', desc: 'Chatted with FitAI', unlocked: true },
            { Icon: Moon, label: 'Night Owl', desc: 'Set sleep reminder', unlocked: false },
          ].map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-xl text-center border transition-all',
                a.unlocked
                  ? 'bg-white/[0.04] border-white/[0.08] hover:border-amber-500/20'
                  : 'bg-white/[0.02] border-white/[0.04] opacity-40'
              )}
            >
              <a.Icon className="w-6 h-6 text-amber-400" />
              <div>
                <p className={clsx('text-xs font-semibold', a.unlocked ? 'text-white' : 'text-gray-600')}>{a.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{a.desc}</p>
              </div>
              {a.unlocked && <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Unlocked</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {editing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 flex gap-3 z-50"
        >
          <button onClick={() => { setForm({ ...user }); setEditing(false) }}
            className="px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white text-sm hover:bg-white/[0.12] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm shadow-glow-violet hover:opacity-90 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </motion.div>
      )}
    </div>
  )
}
