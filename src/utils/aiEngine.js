import { format, subDays, parseISO, differenceInDays } from 'date-fns'

const FITNESS_KB = {
  greetings: [
    "Hey! Ready to crush it today? 💪",
    "Welcome back, champion! What's on your mind?",
    "Good to see you! Let's talk fitness.",
  ],
  workoutAdvice: {
    frequency: [
      "Based on your logs, you've worked out {count} times this week. Aim for {goal} sessions — you're {progress}% there!",
      "Your training frequency is {assessment}. For best results, try to hit {goal} sessions per week with adequate rest days.",
    ],
    progressive_overload: [
      "I noticed you've been lifting the same weights for a while. Try adding 2.5-5kg to your main lifts — progressive overload is key to muscle growth.",
      "Your strength numbers are trending up nicely! Keep adding small increments week by week.",
    ],
    muscle_balance: [
      "Looking at your workout history, you're hitting {strong} muscles frequently. Don't neglect {weak} — muscle imbalances can lead to injury.",
      "Great balanced approach! You're targeting all major muscle groups effectively.",
    ],
    recovery: [
      "You've trained {streak} days in a row. A rest day would optimize your muscle recovery and prevent burnout.",
      "After your intense leg session, I'd recommend light cardio or active recovery tomorrow.",
      "Recovery is where the magic happens — your muscles grow during rest, not during the workout.",
    ],
    form_tips: {
      'Bench Press': 'Keep your shoulder blades retracted and your feet flat on the floor. A slight arch in the lower back is normal and safe.',
      'Back Squat': 'Drive your knees out over your toes, keep your chest up, and break parallel if your mobility allows.',
      'Deadlift': 'Start with the bar over your mid-foot, hinge at the hips, and keep your back neutral throughout the lift.',
      'Overhead Press': 'Keep your core tight, squeeze your glutes, and press the bar in a straight line — not forward.',
      'Pull-Ups': 'Start from a dead hang, engage your lats before pulling, and aim for a full range of motion.',
    },
  },
  dietAdvice: {
    protein: [
      "Your protein intake today is {current}g vs your goal of {goal}g. {assessment} Protein is crucial for muscle repair!",
      "Great protein game! Hitting {percent}% of your daily goal keeps you in an anabolic state.",
      "Try to distribute your protein across 4-5 meals — your body can optimally use about 30-40g per sitting.",
    ],
    calories: [
      "You've consumed {current} / {goal} calories today ({percent}%). {surplus_deficit} is perfectly calibrated for your goal.",
      "On workout days, don't be afraid to eat at maintenance or a slight surplus — your muscles need fuel to grow.",
      "Calorie timing matters — try having your largest carb meals around your workouts for optimal performance.",
    ],
    macros: [
      "Your macro split today: {protein}% protein, {carbs}% carbs, {fat}% fat. {assessment}",
      "For muscle building, aim for: 30% protein, 45% carbs, 25% fat. You're close to this ratio!",
      "Post-workout: prioritize carbs + protein within 2 hours to maximize glycogen replenishment and muscle protein synthesis.",
    ],
    hydration: [
      "You've logged {glasses} glasses of water today. {assessment} Proper hydration boosts performance by up to 25%!",
      "Try to sip water consistently throughout the day rather than gulping large amounts at once.",
      "Weigh yourself before and after training — every 0.5kg lost is approximately 500ml of sweat you need to replace.",
    ],
  },
  motivational: [
    "Every rep, every meal, every night of good sleep — it all compounds. Keep stacking those habits. 🔥",
    "The hardest workout is the one you don't want to do. Show up anyway — your future self will thank you.",
    "Progress isn't always visible on the scale. Body composition, strength, endurance — you're winning in ways you can't see yet.",
    "Consistency beats intensity. A moderate workout 5x/week destroys one epic session once a month.",
    "You didn't start this journey to quit. Every elite athlete was once a beginner. Trust the process.",
    "Pain is temporary. Quitting lasts forever. Your goals are worth the discomfort. 💪",
    "Small daily improvements lead to staggering long-term results. You're building a better version of yourself.",
    "The only bad workout is the one that didn't happen. Even a 20-minute session moves you forward.",
  ],
  injuryPrevention: [
    "Always warm up for 5-10 minutes before heavy lifting. Cold muscles are injury-prone muscles.",
    "If you feel sharp joint pain (not muscle burn), stop immediately. Push through discomfort, not pain.",
    "Deload every 4-6 weeks — reduce volume by 40-50% to allow connective tissue to recover.",
    "Focus on mobility work, especially for the hips, shoulders, and thoracic spine. It pays dividends long-term.",
    "Asymmetry between sides? Address weak side imbalances with unilateral exercises before they become injuries.",
  ],
  sleep: [
    "Sleep is your best performance enhancer — growth hormone peaks during deep sleep stages.",
    "Aim for 7-9 hours. Even one week of 6-hour sleep reduces testosterone levels significantly.",
    "Keep a consistent sleep schedule even on weekends. Your circadian rhythm doesn't know it's Saturday.",
    "No screens 1 hour before bed — blue light disrupts melatonin production and sleep quality.",
  ],
  supplementAdvice: [
    "The big 3 worth considering: Creatine monohydrate (3-5g/day), Protein powder (if you can't hit protein targets from food), Vitamin D (especially if you're indoors a lot).",
    "Creatine is the most researched supplement in sports science — take 3-5g daily consistently, timing doesn't matter.",
    "Caffeine (3-6mg/kg bodyweight) 30-60 min pre-workout can improve strength output by 5-10%.",
    "Most supplements are overhyped. Focus first on: whole food diet, adequate protein, consistent training, quality sleep.",
  ],
}

function detectIntent(message) {
  const msg = message.toLowerCase()
  if (/hi|hello|hey|sup|what'?s up/i.test(msg)) return 'greeting'
  if (/workout|exercise|train|gym|lift|muscle|strength|reps|sets|push|pull|legs/i.test(msg)) return 'workout'
  if (/eat|food|diet|calorie|macro|protein|carb|fat|meal|nutrition|hungry/i.test(msg)) return 'diet'
  if (/tired|unmotivated|don'?t want|hard|give up|quit|struggling|help/i.test(msg)) return 'motivation'
  if (/pain|hurt|injury|sore|ache|discomfort|pulled/i.test(msg)) return 'injury'
  if (/goal|target|achieve|lose weight|gain muscle|progress/i.test(msg)) return 'goal'
  if (/sleep|rest|recover|tired|fatigue|exhausted/i.test(msg)) return 'sleep'
  if (/supplement|protein powder|creatine|vitamin|pre-workout/i.test(msg)) return 'supplement'
  if (/how many|how much|how often|when|schedule|plan|routine|program/i.test(msg)) return 'plan'
  if (/water|hydrat/i.test(msg)) return 'hydration'
  return 'general'
}

function getWorkoutsThisWeek(workouts) {
  const weekAgo = subDays(new Date(), 7)
  return workouts.filter(w => {
    try {
      return parseISO(w.date) >= weekAgo
    } catch { return false }
  })
}

function getTodayMacros(meals) {
  const today = format(new Date(), 'yyyy-MM-dd')
  return meals
    .filter(m => m.date === today)
    .reduce((acc, meal) => {
      meal.foods.forEach(f => {
        acc.calories += f.calories
        acc.protein += f.protein
        acc.carbs += f.carbs
        acc.fat += f.fat
      })
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateAIResponse(userMessage, context) {
  const { user, workouts, meals, goals, waterLogs } = context
  const intent = detectIntent(userMessage)
  const weekWorkouts = getWorkoutsThisWeek(workouts)
  const todayMacros = getTodayMacros(meals)
  const todayWater = waterLogs.find(w => w.date === format(new Date(), 'yyyy-MM-dd'))
  const latestWeight = context.progressEntries?.slice(-1)[0]?.weight || user.weight

  switch (intent) {
    case 'greeting':
      const hour = new Date().getHours()
      const tod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
      return `Good ${tod}, ${user.name}! 🌟 You've worked out **${weekWorkouts.length}x** this week.\n\nToday's quick snapshot:\n• 🔥 **${todayMacros.calories}** / ${user.calorieGoal} kcal consumed\n• 💧 **${todayWater?.glasses || 0}** / ${user.waterGoal} glasses of water\n• 🏋️ **${weekWorkouts.length}** / ${user.weeklyWorkoutGoal} workouts this week\n\nWhat would you like to focus on?`

    case 'workout':
      const workoutCount = weekWorkouts.length
      const goalDiff = user.weeklyWorkoutGoal - workoutCount
      if (/form|technique|how to/i.test(userMessage)) {
        const exercise = Object.keys(FITNESS_KB.workoutAdvice.form_tips).find(ex =>
          userMessage.toLowerCase().includes(ex.toLowerCase())
        )
        if (exercise) {
          return `**${exercise} Form Tips:**\n\n${FITNESS_KB.workoutAdvice.form_tips[exercise]}\n\n**Key cues:**\n• Control the eccentric (lowering) phase — 2-3 seconds down\n• Breathe out on exertion\n• Quality > quantity — reduce weight before breaking form\n\nWant a specific drill or mobility work for this exercise?`
        }
      }
      if (/recommend|suggest|what should|what workout/i.test(userMessage)) {
        const lastMuscles = workouts.slice(0, 3).flatMap(w => w.exercises.map(e => e.category))
        return `Based on your recent training, I'd suggest a **Pull Day** tomorrow:\n\n**Recommended Session:**\n• Barbell Row: 4×8 @ 75kg (↑ from last session)\n• Pull-Ups: 4×max reps (target 10+)\n• Face Pulls: 3×15 @ moderate weight\n• Bicep Curls: 3×12\n• Cable Row: 3×10\n\n**Why:** You've been heavy on push movements — balancing with pulling will prevent shoulder imbalances. Estimated duration: **50-55 min** 🔥`
      }
      return `Your training this week: **${workoutCount}/${user.weeklyWorkoutGoal} sessions**.\n\n${goalDiff > 0 ? `You need **${goalDiff} more** to hit your weekly goal!` : '🎉 **Weekly goal achieved!** Consider an active recovery day.'}\n\n**Recent intensity:** Your last session burned ~${workouts[0]?.calories || 400} kcal.\n\nPro tip: ${rand(FITNESS_KB.workoutAdvice.progressive_overload).replace('{assessment}', workoutCount >= 4 ? 'excellent' : 'decent')}`

    case 'diet':
      const calPercent = Math.round((todayMacros.calories / user.calorieGoal) * 100)
      const proteinPercent = Math.round((todayMacros.protein / user.proteinGoal) * 100)
      if (/protein/i.test(userMessage)) {
        const deficit = user.proteinGoal - todayMacros.protein
        return `**Today's Protein: ${Math.round(todayMacros.protein)}g / ${user.proteinGoal}g (${proteinPercent}%)**\n\n${deficit > 0 ? `You still need **${Math.round(deficit)}g more** today. Options:\n• 200g chicken breast = 46g protein\n• 1 scoop whey protein = 25g\n• 200g Greek yogurt = 20g\n• 4 eggs = 24g` : '✅ Protein goal crushed! Great job hitting your target.'}\n\n**Why it matters:** At your weight (${latestWeight}kg), aim for ${Math.round(latestWeight * 2)}g protein/day for optimal muscle retention.`
      }
      return `**Today's Nutrition (${calPercent}% of goal):**\n\n• 🔥 Calories: **${Math.round(todayMacros.calories)}** / ${user.calorieGoal} kcal\n• 🥩 Protein: **${Math.round(todayMacros.protein)}g** / ${user.proteinGoal}g\n• 🍚 Carbs: **${Math.round(todayMacros.carbs)}g** / ${user.carbsGoal}g\n• 🥑 Fat: **${Math.round(todayMacros.fat)}g** / ${user.fatGoal}g\n\n${calPercent < 70 ? `⚠️ You're undereating! Low calorie intake can **tank your energy** and muscle recovery. Try to eat more wholesome foods.` : calPercent > 110 ? `You're at a caloric surplus today. ${goals.find(g => g.type === 'weight_loss') ? 'This may slow fat loss progress.' : 'Great for muscle building!'}` : `✅ **On track!** Your nutrition looks solid today.`}`

    case 'motivation':
      return `${rand(FITNESS_KB.motivational)}\n\n---\n\n**Your stats tell the real story:**\n• 📅 You've logged workouts consistently this week\n• 📊 Weight trend: ${latestWeight}kg (${latestWeight < user.weight ? '↓ Trending down 🎯' : '→ Maintaining'})\n• 🎯 Active goals: ${goals.length}\n\nYou're further than you think. Keep going. 💪`

    case 'injury':
      return `⚠️ **Injury Prevention First:**\n\n${rand(FITNESS_KB.injuryPrevention)}\n\n**If you're experiencing current pain:**\n• 🛑 Stop the aggravating activity immediately\n• 🧊 Ice for 15-20 min if acute (within 48hr)\n• 📋 Consider seeing a sports physiotherapist if pain persists\n• 🔄 Switch to pain-free alternative exercises\n\n**Common substitutions:**\n• Knee pain → Leg press, leg extensions, step-ups\n• Shoulder pain → Cable work, neutral grip exercises\n• Lower back → Focus on core, avoid axial loading\n\nDon't push through sharp pain — train around it smartly.`

    case 'sleep':
      return `😴 **Sleep & Recovery Insights:**\n\n${rand(FITNESS_KB.sleep)}\n\n**Recovery optimization:**\n• 7-9 hours for athletes is non-negotiable\n• Protein synthesis peaks during deep sleep\n• Growth hormone is highest in the first sleep cycle\n\n**Quick wins for better sleep:**\n1. Set a consistent bedtime (±30 min)\n2. Keep bedroom cool (65-68°F / 18-20°C)\n3. No food 2-3 hours before bed\n4. Light stretching or meditation pre-sleep\n\nHow are you sleeping on average? That helps me give better recovery advice.`

    case 'supplement':
      return `💊 **Supplement Guide (Evidence-Based):**\n\n${rand(FITNESS_KB.supplementAdvice)}\n\n**Tier 1 (Strong evidence):**\n• ✅ Creatine Monohydrate — 3-5g/day\n• ✅ Caffeine — 200-400mg pre-workout\n• ✅ Protein powder (if needed)\n• ✅ Vitamin D3 — 2000-5000 IU (if deficient)\n\n**Tier 2 (Moderate evidence):**\n• Beta-alanine (reduces fatigue)\n• Magnesium (sleep quality, muscle function)\n• Omega-3 (inflammation, recovery)\n\n**Skip:** Most "fat burners", proprietary blends, and anything that sounds too good to be true.`

    case 'goal':
      const activeGoals = goals.filter(g => g.current < g.target || g.lowerIsBetter)
      if (activeGoals.length === 0) return `You have no active goals set yet! Let's create one. Head to the **Goals** section and I'll help you set SMART targets based on your current fitness level.`
      const topGoal = activeGoals[0]
      const progress = topGoal.lowerIsBetter
        ? Math.round(((topGoal.startValue - topGoal.current) / (topGoal.startValue - topGoal.target)) * 100)
        : Math.round(((topGoal.current - topGoal.startValue) / (topGoal.target - topGoal.startValue)) * 100)
      return `**Your #1 Goal: "${topGoal.title}"**\n\n📊 Progress: **${Math.max(0, progress)}%** complete\n📍 Current: **${topGoal.current}${topGoal.unit}** → Target: **${topGoal.target}${topGoal.unit}**\n📅 Deadline: ${topGoal.deadline}\n\n**My recommendation:**\n${topGoal.type === 'weight_loss' ? `At a 300-500 kcal deficit, you can lose ~0.5kg/week safely. Based on your current stats, you're about ${Math.ceil(Math.abs(topGoal.current - topGoal.target) * 2)} weeks out.` : `Stay consistent with your current training. Small, steady increases compound into big results.`}\n\nYou have **${activeGoals.length} active goals** total. Want a breakdown of all of them?`

    case 'hydration':
      const glasses = todayWater?.glasses || 0
      return `💧 **Hydration Status: ${glasses}/${user.waterGoal} glasses today**\n\n${glasses < user.waterGoal ? `You need **${user.waterGoal - glasses} more glasses** to hit your goal. Hydration tips:\n\n• Keep a water bottle visible at your desk\n• Drink a glass upon waking — overnight dehydration is real\n• Sip before, during, and after workouts\n• Flavor with lemon/cucumber if plain water is boring` : '🎉 **Hydration goal reached!** Well done!'}\n\n**Why it matters for fitness:**\n• Even 2% dehydration reduces strength by up to 15%\n• Fat metabolism requires water\n• Muscle pumps are largely water-driven\n\nAt ${latestWeight}kg, your minimum baseline is ~${Math.round(latestWeight * 35)}ml/day.`

    default:
      const insights = []
      if (weekWorkouts.length < user.weeklyWorkoutGoal) insights.push(`📋 **Training**: ${user.weeklyWorkoutGoal - weekWorkouts.length} more sessions needed this week`)
      if (todayMacros.protein < user.proteinGoal * 0.7) insights.push(`🥩 **Protein**: Only at ${Math.round(todayMacros.protein)}g — try to boost this`)
      if ((todayWater?.glasses || 0) < user.waterGoal * 0.6) insights.push(`💧 **Hydration**: Below 60% of daily goal`)
      return `I'm here to help with your fitness journey! Here's what I can assist with:\n\n• 🏋️ **Workout advice** — form, programming, recovery\n• 🥗 **Nutrition guidance** — macros, meal timing, foods\n• 💪 **Motivation** — when the grind gets tough\n• 🎯 **Goal strategy** — SMART goal setting\n• 😴 **Recovery tips** — sleep, deload, injury prevention\n• 💊 **Supplements** — evidence-based recommendations\n\n${insights.length > 0 ? `**Quick insights for today:**\n${insights.join('\n')}` : '**You\'re on track today! Keep it up.** 🔥'}\n\nAsk me anything!`
  }
}
