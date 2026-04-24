import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, ChevronLeft, Dumbbell, Salad, Bot, TrendingUp, Bell, Leaf, Flame, Trophy, Scale, Timer } from 'lucide-react'
import clsx from 'clsx'
import { auth, db } from '../../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc, getDocs, query, where, collection } from 'firebase/firestore'

const FITNESS_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: '0–1 yr', Icon: Leaf, color: '#10b981' },
  { id: 'intermediate', label: 'Intermediate', desc: '1–3 yrs', Icon: Zap, color: '#06b6d4' },
  { id: 'advanced', label: 'Advanced', desc: '3+ yrs', Icon: Flame, color: '#8b5cf6' },
  { id: 'athlete', label: 'Athlete', desc: 'Competitive', Icon: Trophy, color: '#f59e0b' },
]

const PRIMARY_GOALS = [
  { id: 'lose_fat', label: 'Lose Fat', Icon: Flame },
  { id: 'gain_muscle', label: 'Build Muscle', Icon: Dumbbell },
  { id: 'maintain', label: 'Maintain', Icon: Scale },
  { id: 'endurance', label: 'Endurance', Icon: Timer },
  { id: 'strength', label: 'Get Stronger', Icon: Dumbbell },
]

function Field({ label, type = 'text', value, onChange, placeholder, icon: Icon, error, right }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-400 mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'w-full bg-white/[0.05] border rounded-xl py-2.5 text-white placeholder-gray-600 text-sm transition-colors focus:border-violet-500/60',
            Icon ? 'pl-10' : 'pl-4',
            right ? 'pr-11' : 'pr-4',
            error ? 'border-red-500/40' : 'border-white/[0.1]'
          )}
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function calcMacros({ age, height, weight, gender, fitnessLevel, primaryGoal }) {
  const a = parseFloat(age), h = parseFloat(height), w = parseFloat(weight)
  if (!a || !h || !w) return {}
  const bmr = gender === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5
  const mult = { beginner: 1.375, intermediate: 1.55, advanced: 1.725, athlete: 1.9 }[fitnessLevel] || 1.55
  let tdee = Math.round(bmr * mult)
  if (primaryGoal === 'lose_fat') tdee -= 350
  else if (primaryGoal === 'gain_muscle') tdee += 250
  const protein = Math.round(w * 2.0)
  const fat = Math.round((tdee * 0.25) / 9)
  const carbs = Math.max(50, Math.round((tdee - protein * 4 - fat * 9) / 4))
  return { calorieGoal: tdee, proteinGoal: protein, carbsGoal: carbs, fatGoal: fat }
}

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('signin')
  const [step, setStep] = useState(1)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [signIn, setSignIn] = useState({ email: '', password: '' })
  const [acct, setAcct] = useState({ name: '', email: '', password: '', confirm: '' })
  const [fit, setFit] = useState({
    age: '', height: '', weight: '', gender: 'male',
    fitnessLevel: 'intermediate', primaryGoal: 'lose_fat',
    calorieGoal: '', proteinGoal: '', carbsGoal: '', fatGoal: '',
    waterGoal: '8', weeklyWorkoutGoal: '4',
  })

  const setA = (k, v) => setAcct(p => ({ ...p, [k]: v }))
  const setF = (k, v) => {
    setFit(p => {
      const next = { ...p, [k]: v }
      const m = calcMacros(next)
      return m.calorieGoal ? { ...next, ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v)])) } : next
    })
  }

  // ── Sign In ────────────────────────────────────────────────
  const handleSignIn = async () => {
    const e = {}
    if (!signIn.email) e.email = 'Email required'
    if (!signIn.password) e.password = 'Password required'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, signIn.email.trim().toLowerCase(), signIn.password)
      const uid = result.user.uid
      
      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        onAuth({ user: userData.profile || {}, data: userData })
      } else {
        setErrors({ form: 'User profile not found.' })
        setLoading(false)
        return
      }
    } catch (error) {
      let message = 'Email or password is incorrect.'
      if (error.code === 'auth/user-not-found') message = 'No account found with this email.'
      if (error.code === 'auth/wrong-password') message = 'Password is incorrect.'
      if (error.code === 'auth/invalid-email') message = 'Invalid email address.'
      setErrors({ form: message })
    }
    setLoading(false)
  }

  // ── Sign Up step 1 ─────────────────────────────────────────
  const validateAcct = async () => {
    const e = {}
    if (!acct.name.trim()) e.name = 'Name required'
    if (!acct.email.includes('@')) e.email = 'Valid email required'
    if (acct.password.length < 6) e.password = 'Minimum 6 characters'
    if (acct.password !== acct.confirm) e.confirm = 'Passwords do not match'
    
    // Check if email already exists in Firestore
    if (!e.email) {
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('emailLower', '==', acct.email.toLowerCase()))
        const querySnap = await getDocs(q)
        if (!querySnap.empty) {
          e.email = 'Email already registered'
        }
      } catch (error) {
        console.warn('Error checking email:', error)
      }
    }
    
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleNext = async () => {
    if (!await validateAcct()) return
    setF('age', fit.age) // trigger macro recalc
    setStep(2)
  }

  // ── Sign Up step 2 ─────────────────────────────────────────
  const validateFit = () => {
    const e = {}
    if (!fit.age || fit.age < 10 || fit.age > 100) e.age = 'Enter age (10–100)'
    if (!fit.height || fit.height < 100 || fit.height > 260) e.height = 'Height in cm (100–260)'
    if (!fit.weight || fit.weight < 30 || fit.weight > 300) e.weight = 'Weight in kg (30–300)'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSignUp = async () => {
    if (!validateFit()) return
    setLoading(true)
    try {
      // Create user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, acct.email.trim().toLowerCase(), acct.password)
      const uid = result.user.uid

      const macros = calcMacros(fit)

      const userProfile = {
        id: uid,
        name: acct.name.trim(),
        email: acct.email.trim().toLowerCase(),
        emailLower: acct.email.trim().toLowerCase(),
        age: parseFloat(fit.age),
        height: parseFloat(fit.height),
        weight: parseFloat(fit.weight),
        gender: fit.gender,
        fitnessLevel: fit.fitnessLevel,
        primaryGoal: fit.primaryGoal,
        calorieGoal: macros.calorieGoal || parseInt(fit.calorieGoal) || 2000,
        proteinGoal: macros.proteinGoal || parseInt(fit.proteinGoal) || 150,
        carbsGoal: macros.carbsGoal || parseInt(fit.carbsGoal) || 200,
        fatGoal: macros.fatGoal || parseInt(fit.fatGoal) || 65,
        waterGoal: parseInt(fit.waterGoal) || 8,
        weeklyWorkoutGoal: parseInt(fit.weeklyWorkoutGoal) || 4,
        memberSince: new Date().toISOString().split('T')[0],
      }

      const firstName = acct.name.trim().split(' ')[0]
      const welcomeMsg = `Welcome to PulseAI, ${firstName}! 🎉\n\nI'm your personal AI fitness coach. Based on your profile, here's what I've calculated for you:\n\n• **Daily calories:** ${userProfile.calorieGoal} kcal\n• **Protein goal:** ${userProfile.proteinGoal}g (supports muscle & recovery)\n• **Water goal:** ${userProfile.waterGoal} glasses/day\n• **Weekly workouts:** ${userProfile.weeklyWorkoutGoal} sessions\n\nThese are tailored to your goal of "${PRIMARY_GOALS.find(g => g.id === fit.primaryGoal)?.label}". You can adjust them in your Profile.\n\nReady to start? Ask me anything — workouts, nutrition, motivation, form advice. I'm here 24/7! 💪`

      const userData = {
        profile: userProfile,
        workouts: [],
        meals: [],
        waterLogs: [],
        progressEntries: [],
        goals: [],
        reminders: [],
        aiMessages: [{ id: 'welcome', role: 'assistant', content: welcomeMsg, timestamp: new Date().toISOString() }],
      }

      // Save user data to Firestore
      const userDocRef = doc(db, 'users', uid)
      await setDoc(userDocRef, userData)

      // Also keep localStorage for offline support
      localStorage.setItem('fitCurrentUserId', uid)
      localStorage.setItem(`fitData_${uid}`, JSON.stringify(userData))

      setLoading(false)
      onAuth({ user: userProfile, data: userData })
    } catch (error) {
      let message = 'Error creating account. Please try again.'
      if (error.code === 'auth/email-already-in-use') message = 'Email already registered.'
      if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters.'
      if (error.code === 'auth/invalid-email') message = 'Invalid email address.'
      setErrors({ form: message })
      setLoading(false)
    }
  }

  const switchMode = (m) => { setMode(m); setStep(1); setErrors({}) }

  const eyeBtn = (
    <button type="button" onClick={() => setShowPass(p => !p)} className="text-gray-500 hover:text-white transition-colors">
      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-dark-950 flex overflow-hidden relative">
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none z-0" />

      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-glow-violet">
            <Zap className="w-6 h-6 text-white" fill="white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Pulse<span className="gradient-text">AI</span></span>
        </div>

        <div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-5xl font-bold text-white leading-tight mb-4">
            Your intelligent<br /><span className="gradient-text">fitness companion</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="text-gray-400 text-lg mb-10">
            Track workouts, dial in nutrition, and let AI coach you to your best self.
          </motion.p>
          <div className="space-y-3">
            {[
              { Icon: Dumbbell, t: 'Log workouts with a full exercise library' },
              { Icon: Salad, t: 'Auto-calculated macros based on your goals' },
              { Icon: Bot, t: 'AI coach powered by your real data' },
              { Icon: TrendingUp, t: 'Progress charts and body measurements' },
              { Icon: Bell, t: 'Smart notifications that actually help' },
            ].map((f, i) => (
              <motion.div key={f.t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.09 }}
                className="flex items-center gap-3">
                <f.Icon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{f.t}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-gray-700 text-sm italic">"The only bad workout is the one that didn't happen."</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-5 relative z-10 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md py-6">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-7 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-glow-violet">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Pulse<span className="gradient-text">AI</span></span>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-7">
            {/* Toggle */}
            <div className="flex bg-white/[0.04] rounded-xl p-1 mb-5">
              {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([m, label]) => (
                <button key={m} onClick={() => switchMode(m)}
                  className={clsx('flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                    mode === m ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow' : 'text-gray-400 hover:text-white')}>
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ── SIGN IN ────────────────────────────────── */}
              {mode === 'signin' && (
                <motion.div key="signin" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                  <div className="mb-1">
                    <h2 className="text-xl font-bold text-white">Welcome back</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Sign in to continue your journey</p>
                  </div>

                  <Field label="Email" type="email" value={signIn.email}
                    onChange={v => setSignIn(p => ({ ...p, email: v }))}
                    placeholder="you@example.com" icon={Mail} error={errors.email} />

                  <Field label="Password" type={showPass ? 'text' : 'password'}
                    value={signIn.password} onChange={v => setSignIn(p => ({ ...p, password: v }))}
                    placeholder="Your password" icon={Lock} error={errors.password} right={eyeBtn} />

                  {errors.form && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{errors.form}</p>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSignIn} disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold shadow-glow-violet hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
                  </motion.button>

                  <p className="text-center text-sm text-gray-500">
                    No account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-violet-400 hover:text-violet-300 font-medium">Sign up free</button>
                  </p>
                </motion.div>
              )}

              {/* ── SIGN UP step 1 ─────────────────────────── */}
              {mode === 'signup' && step === 1 && (
                <motion.div key="signup-1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-xl font-bold text-white">Create account</h2>
                      <p className="text-xs text-gray-500">Step 1 of 2 — Account details</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-1.5 w-6 rounded-full bg-violet-500" />
                      <div className="h-1.5 w-3 rounded-full bg-white/[0.12]" />
                    </div>
                  </div>

                  <Field label="Full Name" value={acct.name} onChange={v => setA('name', v)}
                    placeholder="Alex Johnson" icon={User} error={errors.name} />
                  <Field label="Email" type="email" value={acct.email} onChange={v => setA('email', v)}
                    placeholder="you@example.com" icon={Mail} error={errors.email} />
                  <Field label="Password" type={showPass ? 'text' : 'password'}
                    value={acct.password} onChange={v => setA('password', v)}
                    placeholder="Min 6 characters" icon={Lock} error={errors.password} right={eyeBtn} />
                  <Field label="Confirm Password" type={showPass ? 'text' : 'password'}
                    value={acct.confirm} onChange={v => setA('confirm', v)}
                    placeholder="Repeat password" icon={Lock} error={errors.confirm} />

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 mt-1">
                    Continue <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <p className="text-center text-sm text-gray-500">
                    Have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-violet-400 hover:text-violet-300 font-medium">Sign in</button>
                  </p>
                </motion.div>
              )}

              {/* ── SIGN UP step 2 ─────────────────────────── */}
              {mode === 'signup' && step === 2 && (
                <motion.div key="signup-2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.05]">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">Fitness profile</h2>
                      <p className="text-xs text-gray-500">Step 2 of 2 — We'll calculate your targets</p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-1.5 w-6 rounded-full bg-violet-500" />
                      <div className="h-1.5 w-6 rounded-full bg-violet-500" />
                    </div>
                  </div>

                  {/* Body stats */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: 'age', label: 'Age', placeholder: '25', err: errors.age },
                      { key: 'height', label: 'Height (cm)', placeholder: '175', err: errors.height },
                      { key: 'weight', label: 'Weight (kg)', placeholder: '75', err: errors.weight },
                    ].map(({ key, label, placeholder, err }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-400 mb-1">{label}</label>
                        <input type="number" value={fit[key]} onChange={e => setF(key, e.target.value)} placeholder={placeholder}
                          className={clsx('w-full bg-white/[0.05] border rounded-xl px-3 py-2 text-white placeholder-gray-600 text-sm focus:border-violet-500/60 transition-colors',
                            err ? 'border-red-500/40' : 'border-white/[0.1]')} />
                        {err && <p className="text-[10px] text-red-400 mt-0.5">{err}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Gender */}
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button key={g} onClick={() => setF('gender', g)}
                        className={clsx('flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all',
                          fit.gender === g ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-transparent text-gray-400 hover:text-white')}>
                        {g}
                      </button>
                    ))}
                  </div>

                  {/* Fitness level */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Fitness Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FITNESS_LEVELS.map(l => (
                        <button key={l.id} onClick={() => setF('fitnessLevel', l.id)}
                          className={clsx('flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-left transition-all',
                            fit.fitnessLevel === l.id ? 'text-white' : 'bg-white/[0.04] text-gray-400 hover:text-white')}
                          style={fit.fitnessLevel === l.id ? { background: `${l.color}15`, border: `1px solid ${l.color}40`, color: l.color } : {}}>
                          <l.Icon className="w-4 h-4 flex-shrink-0" />
                          <div><p>{l.label}</p><p className="opacity-60 text-[9px]">{l.desc}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary goal */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Primary Goal</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIMARY_GOALS.map(g => (
                        <button key={g.id} onClick={() => setF('primaryGoal', g.id)}
                          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                            fit.primaryGoal === g.id ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border border-transparent text-gray-400 hover:text-white')}>
                          <g.Icon className="w-3.5 h-3.5" /> {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-calculated preview */}
                  {fit.calorieGoal && (
                    <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <p className="text-violet-300 font-semibold mb-2 flex items-center gap-1.5">✨ Auto-calculated targets</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { l: 'Calories', v: fit.calorieGoal, u: 'kcal', c: '#f59e0b' },
                          { l: 'Protein', v: fit.proteinGoal, u: 'g', c: '#8b5cf6' },
                          { l: 'Carbs', v: fit.carbsGoal, u: 'g', c: '#06b6d4' },
                          { l: 'Fat', v: fit.fatGoal, u: 'g', c: '#ec4899' },
                        ].map(m => (
                          <div key={m.l}>
                            <p className="font-bold" style={{ color: m.c }}>{m.v}</p>
                            <p className="text-gray-500">{m.u}</p>
                            <p className="text-gray-600 text-[9px]">{m.l}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-gray-600 mt-2 text-center text-[10px]">Adjustable in your profile later</p>
                    </div>
                  )}

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSignUp} disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 shadow-glow-violet disabled:opacity-60 mt-1">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Check className="w-4 h-4" /> Start My Journey</>}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
