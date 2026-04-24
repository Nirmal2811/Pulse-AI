import { createContext, useContext, useReducer, useEffect } from 'react'
import { auth, db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { actionNotification, contextualNotifications } from '../utils/notificationEngine'

const FitnessContext = createContext(null)

const INITIAL_STATE = {
  isAuthenticated: false,
  currentPage: 'dashboard',
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  notifications: [],
  user: {
    id: null,
    name: '',
    email: '',
    age: 25,
    gender: 'male',
    weight: 70,
    height: 170,
    fitnessLevel: 'intermediate',
    primaryGoal: 'lose_fat',
    memberSince: '',
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
    waterGoal: 8,
    weeklyWorkoutGoal: 4,
  },
  workouts: [],
  meals: [],
  waterLogs: [],
  progressEntries: [],
  goals: [],
  reminders: [],
  aiMessages: [],
}

function addNotif(state, msg) {
  if (!msg) return state.notifications
  return [{ message: msg, time: 'Just now' }, ...state.notifications.slice(0, 9)]
}

function reducer(state, action) {
  switch (action.type) {

    // ── Auth ────────────────────────────────────────────────────
    case 'LOGIN': {
      const { user, data } = action.payload
      const loaded = {
        ...state,
        isAuthenticated: true,
        user: data.profile || user,
        workouts: data.workouts || [],
        meals: data.meals || [],
        waterLogs: data.waterLogs || [],
        progressEntries: data.progressEntries || [],
        goals: data.goals || [],
        reminders: data.reminders || [],
        aiMessages: data.aiMessages || [],
      }
      return { ...loaded, notifications: contextualNotifications(loaded) }
    }

    case 'LOGOUT':
      localStorage.removeItem('fitCurrentUserId')
      return {
        ...INITIAL_STATE,
        sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
      }

    // ── UI ──────────────────────────────────────────────────────
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload }

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }

    // ── User ────────────────────────────────────────────────────
    case 'UPDATE_USER': {
      const updatedUser = { ...state.user, ...action.payload }
      // Keep fitUsers auth record in sync
      try {
        const users = JSON.parse(localStorage.getItem('fitUsers') || '[]')
        localStorage.setItem('fitUsers', JSON.stringify(
          users.map(u => u.id === updatedUser.id ? { ...u, email: updatedUser.email } : u)
        ))
      } catch (_) {}
      return { ...state, user: updatedUser }
    }

    // ── Workouts ────────────────────────────────────────────────
    case 'ADD_WORKOUT': {
      const newWorkouts = [action.payload, ...state.workouts]
      const msg = actionNotification('ADD_WORKOUT', action.payload, state)
      return { ...state, workouts: newWorkouts, notifications: addNotif(state, msg) }
    }

    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.payload) }

    // ── Meals ───────────────────────────────────────────────────
    case 'ADD_MEAL': {
      const msg = actionNotification('ADD_MEAL', action.payload, state)
      return { ...state, meals: [action.payload, ...state.meals], notifications: addNotif(state, msg) }
    }

    case 'DELETE_MEAL':
      return { ...state, meals: state.meals.filter(m => m.id !== action.payload) }

    // ── Water ───────────────────────────────────────────────────
    case 'UPDATE_WATER': {
      const { date, glasses } = action.payload
      const exists = state.waterLogs.some(w => w.date === date)
      const newLogs = exists
        ? state.waterLogs.map(w => w.date === date ? { ...w, glasses } : w)
        : [action.payload, ...state.waterLogs]
      const msg = actionNotification('UPDATE_WATER', action.payload, state)
      return { ...state, waterLogs: newLogs, notifications: addNotif(state, msg) }
    }

    // ── Progress ────────────────────────────────────────────────
    case 'ADD_PROGRESS': {
      const msg = actionNotification('ADD_PROGRESS', action.payload, state)
      return { ...state, progressEntries: [...state.progressEntries, action.payload], notifications: addNotif(state, msg) }
    }

    // ── Goals ───────────────────────────────────────────────────
    case 'ADD_GOAL': {
      const msg = actionNotification('ADD_GOAL', action.payload, state)
      return { ...state, goals: [action.payload, ...state.goals], notifications: addNotif(state, msg) }
    }

    case 'UPDATE_GOAL': {
      const msg = actionNotification('UPDATE_GOAL', action.payload, state)
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g),
        notifications: addNotif(state, msg),
      }
    }

    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) }

    // ── Reminders ───────────────────────────────────────────────
    case 'ADD_REMINDER': {
      const msg = actionNotification('ADD_REMINDER', action.payload, state)
      return { ...state, reminders: [action.payload, ...state.reminders], notifications: addNotif(state, msg) }
    }

    case 'TOGGLE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map(r => r.id === action.payload ? { ...r, enabled: !r.enabled } : r),
      }

    case 'DELETE_REMINDER':
      return { ...state, reminders: state.reminders.filter(r => r.id !== action.payload) }

    // ── AI ──────────────────────────────────────────────────────
    case 'ADD_AI_MESSAGE':
      return { ...state, aiMessages: [...state.aiMessages, action.payload] }

    // ── Notifications ───────────────────────────────────────────
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications.slice(0, 9)] }

    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }

    case 'REFRESH_NOTIFICATIONS':
      return { ...state, notifications: contextualNotifications(state) }

    default:
      return state
  }
}

export function FitnessProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => {
    try {
      const userId = localStorage.getItem('fitCurrentUserId')
      if (!userId) return INITIAL_STATE

      const users = JSON.parse(localStorage.getItem('fitUsers') || '[]')
      if (!users.find(u => u.id === userId)) return INITIAL_STATE

      const raw = localStorage.getItem(`fitData_${userId}`)
      if (!raw) return INITIAL_STATE

      const data = JSON.parse(raw)
      if (!data.user) return INITIAL_STATE

      const loaded = {
        ...INITIAL_STATE,
        sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
        isAuthenticated: true,
        user: data.user,
        workouts: data.workouts || [],
        meals: data.meals || [],
        waterLogs: data.waterLogs || [],
        progressEntries: data.progressEntries || [],
        goals: data.goals || [],
        reminders: data.reminders || [],
        aiMessages: data.aiMessages || [],
      }
      return { ...loaded, notifications: contextualNotifications(loaded) }
    } catch (e) {
      return INITIAL_STATE
    }
  })

  // Persist user data on every meaningful state change
  useEffect(() => {
    if (!state.isAuthenticated || !state.user?.id) return
    
    const userData = {
      profile: state.user,
      workouts: state.workouts,
      meals: state.meals,
      waterLogs: state.waterLogs,
      progressEntries: state.progressEntries,
      goals: state.goals,
      reminders: state.reminders,
      aiMessages: state.aiMessages,
    }
    
    // Save to localStorage for offline support
    try {
      localStorage.setItem(`fitData_${state.user.id}`, JSON.stringify(userData))
    } catch (_) {}
    
    // Save to Firebase Firestore
    const currentUser = auth.currentUser
    if (currentUser && currentUser.uid === state.user.id) {
      const userDocRef = doc(db, 'users', state.user.id)
      setDoc(userDocRef, userData, { merge: true })
        .catch(err => console.error('Error saving to Firestore:', err))
    }
  }, [
    state.isAuthenticated, state.user, state.workouts, state.meals,
    state.waterLogs, state.progressEntries, state.goals, state.reminders, state.aiMessages,
  ])

  return (
    <FitnessContext.Provider value={{ state, dispatch }}>
      {children}
    </FitnessContext.Provider>
  )
}

export function useFitness() {
  const ctx = useContext(FitnessContext)
  if (!ctx) throw new Error('useFitness must be used inside FitnessProvider')
  return ctx
}

export function useTodayMacros(meals, user, todayStr) {
  const todayMeals = meals.filter(m => m.date === todayStr)
  const totals = todayMeals.reduce(
    (acc, meal) => {
      meal.foods.forEach(f => {
        acc.calories += f.calories || 0
        acc.protein += f.protein || 0
        acc.carbs += f.carbs || 0
        acc.fat += f.fat || 0
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    caloriePercent: Math.min(100, Math.round((totals.calories / (user.calorieGoal || 1)) * 100)),
    proteinPercent: Math.min(100, Math.round((totals.protein / (user.proteinGoal || 1)) * 100)),
    carbsPercent: Math.min(100, Math.round((totals.carbs / (user.carbsGoal || 1)) * 100)),
    fatPercent: Math.min(100, Math.round((totals.fat / (user.fatGoal || 1)) * 100)),
  }
}
