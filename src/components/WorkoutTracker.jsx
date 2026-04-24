import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, Dumbbell, Clock, Flame, ChevronDown, ChevronUp, Trash2, X, Check, PlayCircle, RotateCcw, Activity, Zap, Timer, Crosshair, Moon } from 'lucide-react'
import { useFitness } from '../context/FitnessContext'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ─── Exercise Library (manual add) ───────────────────────────────────────────
const EXERCISE_LIBRARY = {
  Chest: ['Bench Press', 'Incline Dumbbell Press', 'Cable Flyes', 'Push-Ups', 'Chest Dips', 'Pec Deck'],
  Back: ['Pull-Ups', 'Barbell Row', 'Lat Pulldown', 'Seated Cable Row', 'Deadlift', 'T-Bar Row'],
  Shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Face Pulls', 'Arnold Press', 'Rear Delt Flyes'],
  Arms: ['Bicep Curls', 'Hammer Curls', 'Tricep Pushdowns', 'Skull Crushers', 'Preacher Curls', 'Overhead Tricep Extension'],
  Legs: ['Back Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Leg Extension', 'Leg Curl', 'Calf Raises'],
  Core: ['Plank', 'Crunches', 'Russian Twists', 'Leg Raises', 'Ab Wheel', 'Cable Crunches'],
  Cardio: ['Treadmill Run', 'Cycling', 'Rowing', 'Jump Rope', 'Stair Climber', 'Burpees', 'Box Jumps'],
}

// ─── Plan Engine ─────────────────────────────────────────────────────────────
// Values: string (fixed) or string[] (seeded random pick each week)

const PLAN_DB = {
  chest: [
    { area: 'Pectoralis Major', dumbbell: 'Dumbbell Bench Press',    barbell: 'Barbell Flat Bench Press',    cable: 'Cable Crossover',        mixed: 'Dumbbell Bench Press' },
    { area: 'Upper Chest',      dumbbell: 'Incline Dumbbell Press',   barbell: 'Barbell Incline Bench Press', cable: 'High-to-Low Cable Fly',  mixed: 'Incline Dumbbell Press' },
    { area: 'Inner Chest',      dumbbell: 'Dumbbell Fly',             barbell: 'Close-Grip Bench Press',      cable: 'Pec Fly (Cable)',         mixed: 'Dumbbell Fly' },
    { area: 'Lower Chest',      dumbbell: 'Decline Dumbbell Press',   barbell: 'Barbell Decline Bench Press', cable: 'Low-to-High Cable Fly',  mixed: 'Decline Dumbbell Press' },
  ],
  triceps: [
    { area: 'Long Head',    dumbbell: 'Dumbbell Overhead Extension', barbell: 'EZ-Bar Overhead Extension', cable: 'Cable Overhead Extension', mixed: 'Dumbbell Overhead Extension' },
    { area: 'Lateral Head', dumbbell: 'Dumbbell Triceps Kickback',   barbell: 'Close-Grip Bench Press',    cable: 'Cable Pushdown',           mixed: 'Cable Pushdown' },
    { area: 'Medial Head',  dumbbell: 'Dumbbell Skull Crushers',     barbell: 'Barbell Skull Crushers',    cable: 'Reverse Cable Pushdown',   mixed: 'Dumbbell Skull Crushers' },
    { area: 'All 3 Heads',  dumbbell: 'Close-Grip Dumbbell Press',   barbell: 'Close-Grip Barbell Press',  cable: 'Rope Pushdown',            mixed: 'Bench Dips' },
  ],
  lats: [
    {
      area: 'Middle & Lower Lats',
      dumbbell: ['One-Arm Dumbbell Row'],
      barbell:  ['Barbell Bent-Over Row', 'T-Bar Row', 'Underhand Barbell Row'],
      cable:    ['Seated Row (Cable)'],
      mixed:    ['Barbell Bent-Over Row', 'T-Bar Row'],  // excludes dumbbell option to avoid slot duplicates
    },
    {
      area: 'Upper Lats',
      dumbbell: ['Dumbbell Pullover', 'Incline Dumbbell Row'],
      barbell:  ['Wide-Grip Pull-Up'],
      cable:    ['Lat Pulldown'],
      mixed:    ['Incline Dumbbell Row', 'Wide-Grip Pull-Up'],  // excludes Lat Pulldown to avoid cable/mixed dup
    },
    {
      area: 'Lower Lats',
      dumbbell: 'Dumbbell Straight-Arm Pulldown',
      barbell:  'Underhand Barbell Row',
      cable:    'Straight Arm Pulldown',
      mixed:    'Low-Row (Cable)',  // differs from cable to avoid adjacent-slot duplicate
    },
  ],
  biceps_db: [
    { area: 'Long Head',          dumbbell: 'Incline Dumbbell Curl',     barbell: 'Incline Dumbbell Curl',     cable: 'Incline Dumbbell Curl',     mixed: 'Incline Dumbbell Curl' },
    { area: 'Short Head',         dumbbell: 'Concentration Curl',        barbell: 'Concentration Curl',        cable: 'Concentration Curl',        mixed: 'Concentration Curl' },
    { area: 'Brachialis',         dumbbell: 'Hammer Curl',               barbell: 'Hammer Curl',               cable: 'Hammer Curl',               mixed: 'Hammer Curl' },
    { area: 'Long + Short Heads', dumbbell: 'Alternating Dumbbell Curl', barbell: 'Alternating Dumbbell Curl', cable: 'Alternating Dumbbell Curl', mixed: 'Alternating Dumbbell Curl' },
  ],
  biceps_bar: [
    { area: 'Long Head',  barbell: ['Close-Grip Barbell Curl', 'Drag Curl'], cable: ['Bayesian Curl (Cable)'],   dumbbell: ['Close-Grip Barbell Curl'],  mixed: ['Drag Curl', 'Bayesian Curl (Cable)'] },
    { area: 'Short Head', barbell: 'Wide-Grip Barbell Curl',                 cable: 'Wide-Grip Cable Curl',     dumbbell: 'Spider Curl',                mixed: 'Preacher Curl' },
    { area: 'Brachialis', barbell: ['Reverse Barbell Curl'],                 cable: ['Rope Hammer Curl'],        dumbbell: ['Reverse Barbell Curl'],     mixed: ['Reverse Barbell Curl', 'Rope Hammer Curl'] },
  ],
  shoulders: [
    { area: 'Front Delts', dumbbell: ['Dumbbell Shoulder Press', 'Arnold Press'], barbell: ['Barbell Overhead Press'],  machine: ['Machine Shoulder Press'], cable: ['Cable Front Raise'],   mixed: ['Dumbbell Shoulder Press', 'Arnold Press'] },
    { area: 'Side Delts',  dumbbell: ['Dumbbell Lateral Raise'],                  barbell: ['Upright Row'],             machine: ['Machine Lateral Raise'],  cable: ['Cable Lateral Raise'], mixed: ['Dumbbell Lateral Raise'] },
    { area: 'Rear Delts',  dumbbell: ['Rear Delt Fly (Bent-Over)'],               barbell: ['Bent-Over Lateral Raise'], machine: ['Rear Delt Machine Fly'],  cable: ['Rear Delt Cable Fly'], mixed: ['Rear Delt Fly (Bent-Over)'] },
    { area: 'Upper Traps', dumbbell: ['Dumbbell Shrugs'],                         barbell: ['Barbell Upright Row'],     machine: ['Machine Shrugs'],         cable: ['Cable Upright Row'],   mixed: ['Dumbbell Shrugs'] },
  ],
  sat_shoulders: [
    { area: 'Front Delts',        dumbbell: 'Machine Shoulder Press', barbell: 'Machine Shoulder Press', machine: 'Machine Shoulder Press', cable: 'Machine Shoulder Press', mixed: 'Machine Shoulder Press' },
    { area: 'Side Delts + Traps', dumbbell: 'Upright Row',            barbell: 'Upright Row',            machine: 'Upright Row',            cable: 'Upright Row',            mixed: 'Upright Row' },
    { area: 'Rear Delts',  dumbbell: ['Rear Delt Fly (Bent-Over)'], barbell: ['Bent-Over Lateral Raise'], machine: ['Rear Delt Machine Fly'], cable: ['Rear Delt Cable Fly'], mixed: ['Rear Delt Fly (Bent-Over)'] },
    { area: 'Upper Traps', dumbbell: ['Dumbbell Shrugs'],            barbell: ['Barbell Upright Row'],     machine: ['Machine Shrugs'],        cable: ['Cable Upright Row'],   mixed: ['Dumbbell Shrugs'] },
  ],
  legs: [
    { area: 'Quads',      dumbbell: ['Goblet Squat', 'Dumbbell Walking Lunges'],       barbell: ['Back Squat', 'Front Squat'],       machine: ['Leg Press', 'Leg Extension'],  cable: ['Cable Squat'],        mixed: ['Goblet Squat', 'Leg Press'] },
    { area: 'Calves',     dumbbell: ['Standing Dumbbell Calf Raise'],                  barbell: ['Standing Barbell Calf Raise'],     machine: ['Seated Calf Raise'],           cable: ['Cable Calf Raise'],    mixed: ['Standing Dumbbell Calf Raise'] },
    { area: 'Glutes',     dumbbell: ['Dumbbell Walking Lunges', 'Dumbbell Hip Thrust'], barbell: ['Barbell Hip Thrust'],             machine: ['Glute Machine'],               cable: ['Cable Pull-Through'],  mixed: ['Dumbbell Walking Lunges'] },
    { area: 'Hamstrings', dumbbell: ['Romanian Deadlift (Dumbbell)'],                  barbell: ['Romanian Deadlift (Barbell)'],     machine: ['Leg Curl'],                    cable: ['Cable Leg Curl'],      mixed: ['Romanian Deadlift (Dumbbell)', 'Leg Curl'] },
  ],
}

// Mon/Thu=Chest+Tri | Tue/Fri=Lats+Bi | Wed/Sat=Shoulders+Legs | Sun=Rest
const DAILY_SPLIT = {
  1: { name: 'Chest & Triceps',  muscles: [{ key: 'chest', label: 'Chest', color: '#8b5cf6' }, { key: 'triceps', label: 'Triceps', color: '#06b6d4' }] },
  2: { name: 'Lats & Biceps',    muscles: [{ key: 'lats', label: 'Lats', color: '#10b981' }, { key: 'biceps_db', label: 'Biceps', color: '#f59e0b' }] },
  3: { name: 'Shoulders & Legs', muscles: [{ key: 'shoulders', label: 'Shoulders', color: '#ec4899' }, { key: 'legs', label: 'Legs', color: '#ef4444' }] },
  4: { name: 'Chest & Triceps',  muscles: [{ key: 'chest', label: 'Chest', color: '#8b5cf6' }, { key: 'triceps', label: 'Triceps', color: '#06b6d4' }] },
  5: { name: 'Lats & Biceps',    muscles: [{ key: 'lats', label: 'Lats', color: '#10b981' }, { key: 'biceps_bar', label: 'Biceps', color: '#f59e0b' }] },
  6: { name: 'Shoulders & Legs', muscles: [{ key: 'sat_shoulders', label: 'Shoulders', color: '#ec4899' }, { key: 'legs', label: 'Legs', color: '#ef4444' }] },
}

// Fri lats = same as Tue | Sat legs = same as Wed (shared seed → same exercises)
const MUSCLE_PRIMARY_DAY = { lats: 2, legs: 3 }

const EQUIP_ROTATION = ['dumbbell', 'barbell', 'cable', 'mixed']
const EQUIP_STYLE = {
  dumbbell: { text: '#a78bfa', bg: 'rgba(139,92,246,0.12)', label: 'Dumbbell' },
  barbell:  { text: '#22d3ee', bg: 'rgba(6,182,212,0.12)',  label: 'Barbell'  },
  cable:    { text: '#34d399', bg: 'rgba(16,185,129,0.12)', label: 'Cable'    },
  machine:  { text: '#fbbf24', bg: 'rgba(245,158,11,0.12)', label: 'Machine'  },
  mixed:    { text: '#f472b6', bg: 'rgba(236,72,153,0.12)', label: 'Mixed'    },
}

function getWeekOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
}

function seededRand(n) {
  const x = Math.sin(n + 1.618) * 10000
  return x - Math.floor(x)
}

function seededPick(arr, seed) {
  if (!Array.isArray(arr) || !arr.length) return arr
  return arr[Math.floor(seededRand(seed) * arr.length)]
}

function getDayEquipment(weekNum, day) {
  return EQUIP_ROTATION[(weekNum + day) % EQUIP_ROTATION.length]
}

function resolveEx(target, equip, seed) {
  const pool = target[equip] ?? target.dumbbell ?? target.barbell ?? target.cable ?? target.machine
  if (pool == null) return null
  return Array.isArray(pool) ? seededPick(pool, seed) : pool
}

function generateDailyPlan(dayOfWeek, weekNum) {
  const split = DAILY_SPLIT[dayOfWeek]
  if (!split) return null
  const groups = split.muscles.map(({ key, label, color }) => {
    const primaryDay = MUSCLE_PRIMARY_DAY[key] ?? dayOfWeek
    const db = PLAN_DB[key] || []
    const numAreas = db.length

    // 3-area groups: rotate which area gets 2 exercises (→ 4 total, varies weekly)
    // 4-area groups: 1 exercise per area (→ 4 total)
    const areaSlots = numAreas === 3
      ? [0, 1, 2].flatMap(i => i === (weekNum % 3) ? [i, i] : [i])
      : db.map((_, i) => i)

    // Each slot gets a different equipment type cycling through the rotation
    const exercises = areaSlots.map((areaIdx, slotIdx) => {
      const target = db[areaIdx]
      const equip = EQUIP_ROTATION[(weekNum + primaryDay + slotIdx) % EQUIP_ROTATION.length]
      const seed = weekNum * 1000 + primaryDay * 100 + areaIdx * 10 + slotIdx
      const name = resolveEx(target, equip, seed)
      return name ? { name, area: target.area, equip } : null
    }).filter(Boolean)

    return { label, color, exercises, equip: 'mixed' }
  })
  return { name: split.name, groups }
}

function DailyPlanCard({ onStart }) {
  const weekNum = getWeekOfYear()
  const dayOfWeek = new Date().getDay()
  const plan = generateDailyPlan(dayOfWeek, weekNum)
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (!plan) return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-8 text-center"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Moon className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="font-semibold text-white">Rest Day — Sunday</p>
      <p className="text-xs text-gray-600 mt-1">Recovery is part of the program. See you tomorrow!</p>
    </motion.div>
  )

  const allExerciseNames = plan.groups.flatMap(g => g.exercises.map(e => e.name))

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(139,92,246,0.2)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white">{plan.name}</p>
            <p className="text-xs text-gray-500">{DAY_NAMES[dayOfWeek]} · Week {weekNum} · {allExerciseNames.length} exercises</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => onStart({ name: plan.name, exercises: allExerciseNames })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-semibold shadow-glow-violet flex-shrink-0">
          <PlayCircle className="w-3.5 h-3.5" /> Start Plan
        </motion.button>
      </div>

      {/* Muscle group exercise lists */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {plan.groups.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
              <p className="text-xs font-bold text-white uppercase tracking-widest">{group.label}</p>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: EQUIP_STYLE.mixed.bg, color: EQUIP_STYLE.mixed.text }}>Mixed</span>
            </div>
            <div className="space-y-1.5">
              {group.exercises.map((ex, i) => {
                const es = EQUIP_STYLE[ex.equip] || EQUIP_STYLE.dumbbell
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: `${group.color}08`, border: `1px solid ${group.color}18` }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
                    <p className="text-xs font-medium text-white flex-1 min-w-0 truncate">{ex.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 whitespace-nowrap"
                      style={{ background: es.bg, color: es.text }}>{es.label}</span>
                    <span className="text-[10px] text-gray-500 flex-shrink-0 text-right w-[78px] leading-tight truncate">{ex.area}</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const TEMPLATES = [
  { name: 'Push Day',     Icon: Dumbbell,   exercises: ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Shoulder Press', 'Dumbbell Lateral Raise', 'Dumbbell Overhead Extension'], color: '#8b5cf6' },
  { name: 'Pull Day',     Icon: RotateCcw,  exercises: ['One-Arm Dumbbell Row', 'Lat Pulldown', 'Incline Dumbbell Curl', 'Barbell Bent-Over Row', 'T-Bar Row'], color: '#06b6d4' },
  { name: 'Leg Day',      Icon: Activity,   exercises: ['Goblet Squat', 'Dumbbell Walking Lunges', 'Leg Press', 'Leg Curl', 'Standing Dumbbell Calf Raise'], color: '#10b981' },
  { name: 'Full Body',    Icon: Zap,        exercises: ['Goblet Squat', 'Barbell Flat Bench Press', 'Barbell Bent-Over Row', 'Upright Row', 'Leg Curl'], color: '#f59e0b' },
  { name: 'Upper Power',  Icon: Timer,      exercises: ['Barbell Flat Bench Press', 'Barbell Bent-Over Row', 'Close-Grip Barbell Curl', 'Cable Pushdown', 'Dumbbell Shoulder Press'], color: '#ec4899' },
  { name: 'Core & Cardio', Icon: Crosshair, exercises: ['Plank', 'Russian Twists', 'Leg Raises', 'Ab Wheel', 'Burpees'], color: '#ef4444' },
]

function SetRow({ set, index, onChange, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-2"
    >
      <span className="w-6 text-center text-xs text-gray-600 font-medium">{index + 1}</span>
      <input
        type="number"
        placeholder="kg"
        value={set.weight ?? ''}
        onChange={e => onChange({ ...set, weight: parseFloat(e.target.value) || 0 })}
        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors"
      />
      <span className="text-gray-600 text-xs">×</span>
      <input
        type="number"
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={e => onChange({ ...set, reps: parseInt(e.target.value) || 0 })}
        className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors"
      />
      <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors ml-auto">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

function ExerciseCard({ exercise, index, onChange, onRemove }) {
  const [collapsed, setCollapsed] = useState(false)
  const addSet = () => onChange({ ...exercise, sets: [...exercise.sets, { weight: exercise.sets.slice(-1)[0]?.weight || 0, reps: exercise.sets.slice(-1)[0]?.reps || 10 }] })
  const removeSet = (i) => onChange({ ...exercise, sets: exercise.sets.filter((_, idx) => idx !== i) })
  const updateSet = (i, s) => onChange({ ...exercise, sets: exercise.sets.map((ss, idx) => idx === i ? s : ss) })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{exercise.name}</p>
          <p className="text-xs text-gray-500">{exercise.sets.length} sets · {exercise.category}</p>
        </div>
        <button onClick={onRemove} className="text-gray-600 hover:text-red-400 transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-white transition-colors p-1">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 w-6 text-center">#</span>
                <span className="text-xs text-gray-600 w-20 text-center">Weight</span>
                <span className="text-xs text-gray-600 w-4 text-center"></span>
                <span className="text-xs text-gray-600 w-20 text-center">Reps</span>
              </div>
              <AnimatePresence>
                {exercise.sets.map((set, i) => (
                  <SetRow key={i} set={set} index={i}
                    onChange={s => updateSet(i, s)}
                    onRemove={() => removeSet(i)}
                  />
                ))}
              </AnimatePresence>
              <button onClick={addSet}
                className="w-full mt-2 py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-gray-500 hover:text-white hover:border-violet-500/30 transition-all flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Set
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NewWorkoutModal({ onClose, template }) {
  const { dispatch } = useFitness()
  const [name, setName] = useState(template?.name || '')
  const [duration, setDuration] = useState('')
  const [calories, setCalories] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState(
    template
      ? template.exercises.map((e, i) => ({
          id: `ne${i}`, name: e,
          category: Object.keys(EXERCISE_LIBRARY).find(cat => EXERCISE_LIBRARY[cat].includes(e)) || 'Other',
          sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }],
        }))
      : []
  )
  const [showExLib, setShowExLib] = useState(false)
  const [selCat, setSelCat] = useState('Chest')

  const addExercise = (name) => {
    const category = Object.keys(EXERCISE_LIBRARY).find(cat => EXERCISE_LIBRARY[cat].includes(name)) || 'Other'
    setExercises(prev => [...prev, {
      id: `ne${Date.now()}`, name, category,
      sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 0, reps: 10 }]
    }])
    setShowExLib(false)
  }

  const handleSave = () => {
    if (!name.trim()) { toast.error('Please enter a workout name'); return }
    if (exercises.length === 0) { toast.error('Add at least one exercise'); return }
    dispatch({
      type: 'ADD_WORKOUT',
      payload: {
        id: `w${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'),
        name, duration: parseInt(duration) || 0, calories: parseInt(calories) || 0,
        notes, exercises,
      }
    })
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Workout "${name}" logged! 💪`, time: 'Just now' } })
    toast.success(`Workout logged! Great work! 💪`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'rgba(13,13,26,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/[0.06]"
          style={{ background: 'rgba(13,13,26,0.98)' }}>
          <h2 className="text-lg font-bold text-white">{template ? `Start: ${template.name}` : 'Log New Workout'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs text-gray-400 mb-1.5">Workout Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Upper Body Power"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Duration (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Calories Burned</label>
              <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="400"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="How was it?"
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors text-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Exercises ({exercises.length})</h3>
              <button onClick={() => setShowExLib(!showExLib)}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
            <AnimatePresence>
              {showExLib && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="p-3 border-b border-white/[0.06] flex gap-2 overflow-x-auto">
                    {Object.keys(EXERCISE_LIBRARY).map(cat => (
                      <button key={cat} onClick={() => setSelCat(cat)}
                        className={clsx('px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                          selCat === cat ? 'bg-violet-500 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white')}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXERCISE_LIBRARY[selCat].map(ex => (
                      <button key={ex} onClick={() => addExercise(ex)}
                        className="text-left text-sm text-gray-300 hover:text-white bg-white/[0.03] hover:bg-violet-500/10 border border-white/[0.06] hover:border-violet-500/30 rounded-lg px-3 py-2 transition-all">
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-3">
              <AnimatePresence>
                {exercises.map((ex, i) => (
                  <ExerciseCard key={ex.id} exercise={ex} index={i}
                    onChange={updated => setExercises(prev => prev.map(e => e.id === ex.id ? updated : e))}
                    onRemove={() => setExercises(prev => prev.filter(e => e.id !== ex.id))}
                  />
                ))}
              </AnimatePresence>
              {exercises.length === 0 && (
                <div className="text-center py-10 text-gray-600">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No exercises yet. Add from the library above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 p-6 border-t border-white/[0.06] flex gap-3"
          style={{ background: 'rgba(13,13,26,0.98)' }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm shadow-glow-violet hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Workout
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function WorkoutTracker() {
  const { state, dispatch } = useFitness()
  const { workouts } = state
  const [showModal, setShowModal] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [expandedWorkout, setExpandedWorkout] = useState(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayWorkouts = workouts.filter(w => w.date === today)
  const pastWorkouts = workouts.filter(w => w.date !== today)

  const handleStartPlan = (planTemplate) => {
    setActiveTemplate(planTemplate)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Today's Plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Today's Workout Plan</h3>
        <DailyPlanCard onStart={handleStartPlan} />
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Workout Tracker</h2>
          <p className="text-sm text-gray-500">{workouts.length} total sessions logged</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setActiveTemplate(null); setShowModal(true) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold rounded-xl shadow-glow-violet hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Log Workout
        </motion.button>
      </div>

      {/* Quick Start Templates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Start Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TEMPLATES.map((t, i) => (
            <motion.button
              key={t.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveTemplate(t); setShowModal(true) }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:border-opacity-50"
              style={{ background: `${t.color}10`, borderColor: `${t.color}25` }}
            >
              <t.Icon className="w-6 h-6" style={{ color: t.color }} />
              <span className="text-xs font-medium text-white text-center leading-tight">{t.name}</span>
              <span className="text-[10px] text-gray-500">{t.exercises.length} exercises</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Today's logged workouts */}
      {todayWorkouts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Today</h3>
          <div className="space-y-3">
            {todayWorkouts.map(workout => (
              <WorkoutHistoryCard key={workout.id} workout={workout}
                expanded={expandedWorkout === workout.id}
                onToggle={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                onDelete={() => { dispatch({ type: 'DELETE_WORKOUT', payload: workout.id }); toast.success('Workout deleted') }}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">History</h3>
        <div className="space-y-3">
          {pastWorkouts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Dumbbell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No past workouts yet. Start logging!</p>
            </div>
          ) : (
            pastWorkouts.map(workout => (
              <WorkoutHistoryCard key={workout.id} workout={workout}
                expanded={expandedWorkout === workout.id}
                onToggle={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                onDelete={() => { dispatch({ type: 'DELETE_WORKOUT', payload: workout.id }); toast.success('Workout deleted') }}
              />
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <NewWorkoutModal onClose={() => setShowModal(false)} template={activeTemplate} />}
      </AnimatePresence>
    </div>
  )
}

function WorkoutHistoryCard({ workout, expanded, onToggle, onDelete }) {
  const totalVolume = workout.exercises?.reduce((acc, ex) =>
    acc + ex.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0

  return (
    <motion.div layout className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{workout.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{workout.duration}min</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{workout.calories}kcal</span>
            <span>{workout.exercises?.length} exercises</span>
            {totalVolume > 0 && <span className="hidden sm:inline">{totalVolume.toLocaleString()}kg vol</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{workout.date}</span>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-gray-600 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-white/[0.06] p-5">
              {workout.notes && (
                <p className="text-sm text-gray-400 mb-4 italic">"{workout.notes}"</p>
              )}
              <div className="space-y-3">
                {workout.exercises?.map((ex, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-xl p-4">
                    <p className="text-sm font-semibold text-white mb-2">{ex.name}
                      <span className="ml-2 text-xs text-gray-500 font-normal">{ex.category}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ex.sets.map((s, j) => (
                        <span key={j} className="text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-gray-300">
                          {s.weight > 0 ? `${s.weight}kg × ` : ''}{s.reps} reps
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
