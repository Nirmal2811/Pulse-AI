import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, Utensils, Droplets, Flame, X, Search, Check, Trash2, ChevronDown, ChevronUp, Sunrise, Sun, Moon, Apple } from 'lucide-react'
import { useFitness, useTodayMacros } from '../context/FitnessContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FOOD_DB = [
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'White Rice (100g cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Brown Rice (100g cooked)', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: 'Whey Protein (1 scoop)', calories: 130, protein: 25, carbs: 5, fat: 2 },
  { name: 'Oats (100g)', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Egg (1 whole)', calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
  { name: 'Greek Yogurt (100g)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Sweet Potato (100g)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Broccoli (100g)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Almond (28g)', calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: 'Peanut Butter (2 tbsp)', calories: 190, protein: 8, carbs: 6, fat: 16 },
  { name: 'Whole Milk (240ml)', calories: 149, protein: 8, carbs: 12, fat: 8 },
  { name: 'Cottage Cheese (100g)', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { name: 'Tuna Canned (100g)', calories: 116, protein: 25, carbs: 0, fat: 1 },
  { name: 'Avocado (half)', calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: 'Quinoa (100g cooked)', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: 'Pasta (100g cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Bread (1 slice)', calories: 79, protein: 2.7, carbs: 15, fat: 1 },
]

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', Icon: Sunrise, color: '#f59e0b' },
  { id: 'lunch', label: 'Lunch', Icon: Sun, color: '#10b981' },
  { id: 'snack', label: 'Snack', Icon: Apple, color: '#06b6d4' },
  { id: 'dinner', label: 'Dinner', Icon: Moon, color: '#8b5cf6' },
]

function MacroRing({ label, value, total, color, size = 100 }) {
  const r = (size / 2) - 8, cx = size / 2, cy = size / 2, sw = 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, (value / total) * 100)
  const offset = circ - (pct / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(value)}</span>
          <span className="text-[10px] text-gray-500">g</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-white mt-2">{label}</p>
      <p className="text-[10px] text-gray-600">{Math.round(pct)}% of {total}g</p>
    </div>
  )
}

function AddFoodModal({ mealType, onClose, date }) {
  const { dispatch } = useFitness()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(1)
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [tab, setTab] = useState('search')

  const filtered = FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const mealTypeInfo = MEAL_TYPES.find(m => m.id === mealType)

  const handleAdd = () => {
    let food
    if (tab === 'custom') {
      if (!custom.name || !custom.calories) { toast.error('Name and calories required'); return }
      food = {
        id: `f${Date.now()}`,
        name: custom.name,
        calories: parseFloat(custom.calories) || 0,
        protein: parseFloat(custom.protein) || 0,
        carbs: parseFloat(custom.carbs) || 0,
        fat: parseFloat(custom.fat) || 0,
        amount: 1, unit: 'serving',
      }
    } else {
      if (!selected) { toast.error('Select a food item'); return }
      food = { id: `f${Date.now()}`, ...selected, amount: qty, unit: 'serving',
        calories: selected.calories * qty, protein: selected.protein * qty,
        carbs: selected.carbs * qty, fat: selected.fat * qty }
    }

    const existingMeal = null
    dispatch({
      type: 'ADD_MEAL',
      payload: {
        id: `m${Date.now()}`, date, mealType,
        name: mealTypeInfo.label, foods: [food],
      }
    })
    toast.success(`Added ${food.name}! 🥗`)
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
          <h3 className="font-bold text-white">Add Food to {mealTypeInfo?.label}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {['search', 'custom'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('flex-1 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                  tab === t ? 'bg-violet-500 text-white' : 'bg-white/[0.05] text-gray-400 hover:text-white')}>
                {t === 'search' ? '🔍 Search Foods' : '✏️ Custom Food'}
              </button>
            ))}
          </div>

          {tab === 'search' ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search food database..."
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:border-violet-500/50 transition-colors text-sm" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1.5">
                {filtered.slice(0, 12).map(food => (
                  <button key={food.name} onClick={() => setSelected(food)}
                    className={clsx('w-full text-left p-3 rounded-xl transition-all',
                      selected?.name === food.name ? 'bg-violet-500/15 border border-violet-500/30' : 'bg-white/[0.03] hover:bg-white/[0.06] border border-transparent')}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{food.name}</span>
                      <span className="text-xs text-gray-500">{food.calories} kcal</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-600">
                      <span>P: {food.protein}g</span><span>C: {food.carbs}g</span><span>F: {food.fat}g</span>
                    </div>
                  </button>
                ))}
              </div>
              {selected && (
                <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                  <span className="text-sm text-gray-400">Servings:</span>
                  <input type="number" min="0.5" step="0.5" value={qty} onChange={e => setQty(parseFloat(e.target.value) || 1)}
                    className="w-20 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-white text-sm text-center focus:border-violet-500/50 transition-colors" />
                  <div className="text-sm text-gray-400 ml-auto">
                    <span className="text-white font-semibold">{Math.round(selected.calories * qty)}</span> kcal
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Food Name *</label>
                <input value={custom.name} onChange={e => setCustom(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Protein Bar"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
              </div>
              {[['calories', 'Calories (kcal) *', '#f59e0b'], ['protein', 'Protein (g)', '#8b5cf6'], ['carbs', 'Carbs (g)', '#06b6d4'], ['fat', 'Fat (g)', '#ec4899']].map(([field, label, color]) => (
                <div key={field}>
                  <label className="text-xs mb-1 block" style={{ color }}>{label}</label>
                  <input type="number" value={custom[field]} onChange={e => setCustom(p => ({ ...p, [field]: e.target.value }))} placeholder="0"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:border-violet-500/50 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/[0.05] text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleAdd}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add Food
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DietTracker() {
  const { state, dispatch } = useFitness()
  const { meals, waterLogs, user } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const macros = useTodayMacros(meals, user, today)
  const todayMeals = meals.filter(m => m.date === today)
  const todayWater = waterLogs.find(w => w.date === today)?.glasses || 0
  const [addFoodFor, setAddFoodFor] = useState(null)

  const updateWater = (glasses) => dispatch({ type: 'UPDATE_WATER', payload: { date: today, glasses: Math.max(0, glasses) } })

  const weekCalories = Array.from({ length: 7 }, (_, i) => {
    const d = format(new Date(Date.now() - (6 - i) * 86400000), 'yyyy-MM-dd')
    const dayMeals = meals.filter(m => m.date === d)
    const cals = dayMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.calories, 0), 0)
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T00:00').getDay()], calories: Math.round(cals), goal: user.calorieGoal }
  })

  return (
    <div className="space-y-6">
      {/* Top: Calorie overview + Macros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calorie ring */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <p className="text-sm font-semibold text-gray-400 mb-4">Daily Calories</p>
          <div className="relative w-44 h-44">
            <svg width="176" height="176" className="-rotate-90">
              <circle cx="88" cy="88" r="72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <motion.circle
                cx="88" cy="88" r="72" fill="none" stroke="url(#calGrad)" strokeWidth="12"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 72}
                initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 72 - (Math.min(macros.caloriePercent, 100) / 100) * 2 * Math.PI * 72 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{macros.calories}</span>
              <span className="text-xs text-gray-500">of {user.calorieGoal} kcal</span>
              <span className="text-sm font-semibold mt-1" style={{ color: macros.caloriePercent > 100 ? '#ef4444' : '#10b981' }}>
                {macros.caloriePercent > 100 ? `+${macros.calories - user.calorieGoal} over` : `${user.calorieGoal - macros.calories} left`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Macros rings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-sm font-semibold text-gray-400 mb-5">Macronutrients</p>
          <div className="flex items-center justify-around">
            <MacroRing label="Protein" value={macros.protein} total={user.proteinGoal} color="#8b5cf6" />
            <MacroRing label="Carbs" value={macros.carbs} total={user.carbsGoal} color="#06b6d4" />
            <MacroRing label="Fat" value={macros.fat} total={user.fatGoal} color="#f59e0b" />
          </div>
        </motion.div>

        {/* Water tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-400">Hydration</p>
            <span className="text-sm font-bold text-cyan-400">{todayWater}/{user.waterGoal} glasses</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: user.waterGoal }).map((_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateWater(i < todayWater ? i : i + 1)}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
                  i < todayWater
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                    : 'bg-white/[0.04] border border-white/[0.08] text-gray-600'
                )}
              >
                <Droplets className="w-3 h-3" />
              </motion.button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateWater(todayWater - 1)}
              className="flex-1 py-2 rounded-xl bg-white/[0.05] text-gray-400 hover:text-white text-sm transition-colors">-1</button>
            <button onClick={() => updateWater(todayWater + 1)}
              className="flex-1 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-sm transition-colors font-medium">+1 Glass</button>
          </div>
        </motion.div>
      </div>

      {/* Weekly chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-sm font-semibold text-white mb-4">Weekly Calorie Intake</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weekCalories} barSize={28}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide domain={[0, Math.max(user.calorieGoal * 1.2, 500)]} />
            <Tooltip content={({ active, payload }) => active && payload?.length ? (
              <div className="bg-dark-800 border border-white/10 rounded-xl p-3 text-xs">
                <p className="text-gray-400">{payload[0]?.payload.day}</p>
                <p className="text-white font-bold">{payload[0]?.value} kcal</p>
                <p className="text-gray-500">Goal: {user.calorieGoal}</p>
              </div>
            ) : null} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} fill="url(#barGrad)">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#8b5cf680" />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Meal sections */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Today's Meals</h3>
        {MEAL_TYPES.map((mealType, mi) => {
          const typeMeals = todayMeals.filter(m => m.mealType === mealType.id)
          const typeCals = typeMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.calories, 0), 0)
          const typeProtein = typeMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.protein, 0), 0)

          return (
            <motion.div
              key={mealType.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.07 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 cursor-pointer"
                style={{ borderBottom: typeMeals.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <mealType.Icon className="w-5 h-5" style={{ color: mealType.color }} />
                  <div>
                    <p className="font-semibold text-white">{mealType.label}</p>
                    {typeCals > 0 && (
                      <p className="text-xs text-gray-500">{Math.round(typeCals)} kcal · {Math.round(typeProtein)}g protein</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAddFoodFor(mealType.id)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: `${mealType.color}15`, border: `1px solid ${mealType.color}30`, color: mealType.color }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {typeMeals.length > 0 && (
                <div className="p-4 space-y-2">
                  {typeMeals.map(meal => (
                    meal.foods.map(food => (
                      <div key={food.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{food.name}</p>
                          <div className="flex gap-3 text-[11px] text-gray-500 mt-0.5">
                            <span className="text-amber-400 font-medium">{food.calories} kcal</span>
                            <span>P: {food.protein}g</span>
                            <span>C: {food.carbs}g</span>
                            <span>F: {food.fat}g</span>
                          </div>
                        </div>
                        <button
                          onClick={() => { dispatch({ type: 'DELETE_MEAL', payload: meal.id }); toast.success('Removed') }}
                          className="text-gray-700 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ))}
                </div>
              )}
              {typeMeals.length === 0 && (
                <div className="px-4 pb-4 pt-3">
                  <p className="text-xs text-gray-600 italic">No food logged yet for {mealType.label.toLowerCase()}</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {addFoodFor && <AddFoodModal mealType={addFoodFor} date={today} onClose={() => setAddFoodFor(null)} />}
      </AnimatePresence>
    </div>
  )
}
