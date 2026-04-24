const todayStr = () => new Date().toISOString().split('T')[0]
const currentHour = () => new Date().getHours()

function goalProgress(goal) {
  if (goal.lowerIsBetter) {
    return Math.max(0, Math.min(100, Math.round(
      ((goal.startValue - goal.current) / (goal.startValue - goal.target)) * 100
    )))
  }
  return Math.max(0, Math.min(100, Math.round(
    ((goal.current - goal.startValue) / (goal.target - goal.startValue)) * 100
  )))
}

function fmt12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Called inside the reducer after each action — returns notification message or null
export function actionNotification(actionType, payload, state) {
  const { user, workouts, meals, waterLogs } = state
  const today = todayStr()

  switch (actionType) {
    case 'ADD_WORKOUT': {
      const weekStart = new Date(Date.now() - 7 * 86400000)
      const weekCount = [...workouts, payload].filter(w => new Date(w.date) >= weekStart).length
      const totalCalsBurned = [...workouts, payload].reduce((a, w) => a + (w.calories || 0), 0)
      if (weekCount >= user.weeklyWorkoutGoal) {
        return `🏆 "${payload.name}" logged! Weekly goal crushed — ${weekCount}/${user.weeklyWorkoutGoal} sessions done. Incredible work!`
      }
      const remaining = user.weeklyWorkoutGoal - weekCount
      return `💪 "${payload.name}" logged! ${weekCount}/${user.weeklyWorkoutGoal} sessions this week. ${remaining} more to hit your goal.`
    }

    case 'ADD_MEAL': {
      const todayMeals = [...meals, payload].filter(m => m.date === today)
      const totalCals = Math.round(todayMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.calories, 0), 0))
      const totalProtein = Math.round(todayMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.protein, 0), 0))
      const remaining = user.calorieGoal - totalCals
      if (remaining < -50) {
        return `⚠️ Meal added. You're ${Math.abs(remaining)} kcal over your daily goal (${totalCals}/${user.calorieGoal}). ${totalProtein}g protein so far.`
      }
      if (remaining < 200) {
        return `🥗 Meal added! Almost at your calorie goal: ${totalCals}/${user.calorieGoal} kcal. ${totalProtein}g protein.`
      }
      return `🥗 Meal added! Today: ${totalCals}/${user.calorieGoal} kcal · ${totalProtein}g protein · ${remaining} kcal remaining.`
    }

    case 'UPDATE_WATER': {
      const glasses = payload.glasses
      if (glasses <= 0) return null
      if (glasses >= user.waterGoal) {
        return `💧 Hydration goal reached! ${glasses}/${user.waterGoal} glasses today. Great for performance and recovery!`
      }
      if (glasses === Math.floor(user.waterGoal / 2)) {
        return `💧 Halfway there! ${glasses}/${user.waterGoal} glasses. Keep drinking to stay sharp all day.`
      }
      return null
    }

    case 'ADD_PROGRESS': {
      const entries = [...state.progressEntries, payload].sort((a, b) => a.date.localeCompare(b.date))
      if (entries.length >= 2) {
        const prev = entries[entries.length - 2]
        const diff = (payload.weight - prev.weight).toFixed(1)
        const sign = parseFloat(diff) >= 0 ? '+' : ''
        const emoji = parseFloat(diff) < 0 ? '📉' : parseFloat(diff) > 0 ? '📈' : '➡️'
        return `${emoji} Progress logged! ${payload.weight}kg (${sign}${diff}kg). ${payload.bodyFat ? `Body fat: ${payload.bodyFat}%.` : ''} Keep tracking to see your trend!`
      }
      return `📊 First progress entry saved! ${payload.weight}kg logged. Track weekly for the best insights.`
    }

    case 'ADD_GOAL': {
      const daysLeft = Math.ceil((new Date(payload.deadline) - new Date()) / 86400000)
      return `🎯 Goal "${payload.title}" created! You have ${daysLeft} days. Log your progress regularly — small steps compound fast!`
    }

    case 'UPDATE_GOAL': {
      const pct = goalProgress(payload)
      if (pct >= 100) return `🏆 GOAL ACHIEVED: "${payload.title}"! You actually did it — phenomenal!`
      if (pct >= 90) return `🚀 ${pct}% toward "${payload.title}" — you're SO close! One final push!`
      if (pct >= 75) return `📈 "${payload.title}" is ${pct}% done. You're in the final stretch — stay consistent!`
      return `📈 Progress on "${payload.title}": ${pct}% complete. Every update matters!`
    }

    case 'ADD_REMINDER': {
      return `🔔 Reminder set: "${payload.title}" at ${fmt12(payload.time)} (${payload.recurring}). Consistent habits build results!`
    }

    default:
      return null
  }
}

// Called on login / page change — generates context-aware nudges based on real data
export function contextualNotifications(state) {
  const { user, workouts, meals, waterLogs, goals, progressEntries } = state
  if (!user?.id) return []

  const today = todayStr()
  const h = currentHour()
  const notifications = []

  const todayWorkouts = workouts.filter(w => w.date === today)
  const todayMeals = meals.filter(m => m.date === today)
  const todayWater = waterLogs.find(w => w.date === today)?.glasses || 0
  const todayCals = Math.round(todayMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.calories, 0), 0))
  const todayProtein = Math.round(todayMeals.reduce((a, m) => a + m.foods.reduce((b, f) => b + f.protein, 0), 0))

  const weekStart = new Date(Date.now() - 7 * 86400000)
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart)

  // Weekly workout progress
  if (weekWorkouts.length >= user.weeklyWorkoutGoal) {
    notifications.push({ message: `🏆 Weekly goal done — ${weekWorkouts.length}/${user.weeklyWorkoutGoal} workouts! Your discipline is paying off.`, time: 'Now' })
  } else {
    const remaining = user.weeklyWorkoutGoal - weekWorkouts.length
    notifications.push({ message: `📊 ${weekWorkouts.length}/${user.weeklyWorkoutGoal} workouts this week. ${remaining} more to hit your goal — you can do it!`, time: 'Now' })
  }

  // No workout today (evening), still behind weekly goal
  if (h >= 17 && todayWorkouts.length === 0 && weekWorkouts.length < user.weeklyWorkoutGoal) {
    notifications.push({ message: `🏋️ No workout today yet. Even a 20-min session counts — check Quick Start templates!`, time: 'Now' })
  }

  // Water check (afternoon/evening)
  if (h >= 14 && todayWater < Math.round(user.waterGoal * 0.5)) {
    notifications.push({ message: `💧 Only ${todayWater}/${user.waterGoal} glasses today. Dehydration drops strength by up to 15% — drink now!`, time: 'Now' })
  }

  // No meals logged (afternoon)
  if (h >= 13 && todayMeals.length === 0) {
    notifications.push({ message: `🍽️ No meals logged today. Start tracking nutrition — it's the #1 factor in body composition!`, time: 'Now' })
  }

  // Calorie check (afternoon/evening, only if meals exist)
  if (h >= 15 && todayMeals.length > 0) {
    const pct = (todayCals / user.calorieGoal) * 100
    if (pct > 110) {
      notifications.push({ message: `⚠️ ${Math.round(todayCals - user.calorieGoal)} kcal over goal today. Opt for lighter food in the evening.`, time: 'Now' })
    } else if (pct < 55 && h >= 18) {
      notifications.push({ message: `⚡ Under-fueling alert: only ${todayCals} kcal today. Eating too little hurts training and recovery.`, time: 'Now' })
    }
  }

  // Low protein (evening)
  if (h >= 16 && todayProtein > 0 && todayProtein < user.proteinGoal * 0.55) {
    notifications.push({ message: `🥩 Protein low: ${todayProtein}/${user.proteinGoal}g. Add a protein source to protect your muscle gains.`, time: 'Now' })
  }

  // Goal near completion
  goals.forEach(goal => {
    const pct = goalProgress(goal)
    if (pct >= 85 && pct < 100) {
      notifications.push({ message: `🎯 "${goal.title}" is ${pct}% done — you're in the final stretch! Keep pushing!`, time: 'Now' })
    }
  })

  // Activity streak
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    const active = workouts.some(w => w.date === d) || meals.some(m => m.date === d)
    if (active) streak++
    else break
  }
  if (streak >= 5) {
    notifications.push({ message: `🔥 ${streak}-day streak! You're building an unstoppable habit — don't break it now!`, time: 'Now' })
  }

  // Progress log reminder
  if (workouts.length >= 3) {
    const latestEntry = progressEntries.length
      ? [...progressEntries].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null
    if (!latestEntry) {
      notifications.push({ message: `📏 You've logged ${workouts.length} workouts but no body measurements yet. Track your weight to see real results!`, time: 'Now' })
    } else {
      const daysSince = Math.ceil((Date.now() - new Date(latestEntry.date)) / 86400000)
      if (daysSince >= 7) {
        notifications.push({ message: `📏 Last body measurement was ${daysSince} days ago. Log your progress to see how much you've changed!`, time: 'Now' })
      }
    }
  }

  return notifications.slice(0, 6)
}
