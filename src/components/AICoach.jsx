import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Zap, User, RefreshCw, Sparkles, ChevronRight, Salad, Dumbbell, TrendingUp, Flame, Moon, Pill, Target, Beef, Brain } from 'lucide-react'
import { useFitness } from '../context/FitnessContext'
import { generateAIResponse } from '../utils/aiEngine'
import { format } from 'date-fns'
import clsx from 'clsx'

const QUICK_PROMPTS = [
  { text: "What should I eat today?", Icon: Salad },
  { text: "Suggest a workout for me", Icon: Dumbbell },
  { text: "How's my progress looking?", Icon: TrendingUp },
  { text: "I need motivation!", Icon: Flame },
  { text: "Tips for better recovery", Icon: Moon },
  { text: "Best supplements for me?", Icon: Pill },
  { text: "How do I improve my bench press form?", Icon: Dumbbell },
  { text: "My goal progress update", Icon: Target },
]

const DAILY_INSIGHTS = [
  { title: "Protein Timing", body: "You're getting good total protein, but try spreading it across 4-5 meals for optimal muscle protein synthesis.", Icon: Beef, color: "#8b5cf6" },
  { title: "Progressive Overload", body: "Your bench press has been steady — try adding 2.5kg next session. Small jumps compound into big gains.", Icon: TrendingUp, color: "#06b6d4" },
  { title: "Sleep & Recovery", body: "Deep sleep is when GH peaks. If you're training hard, prioritize 8h sleep over an extra workout.", Icon: Moon, color: "#10b981" },
  { title: "Mind-Muscle Connection", body: "Slow down your reps — 2-3 seconds on the eccentric phase. You'll feel your muscles work harder at lighter weight.", Icon: Brain, color: "#f59e0b" },
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 typing-dot" />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isNew }) {
  const isUser = message.role === 'user'
  const [displayed, setDisplayed] = useState(isNew && !isUser ? '' : message.content)

  useEffect(() => {
    if (isNew && !isUser && message.content) {
      let i = 0
      const interval = setInterval(() => {
        setDisplayed(message.content.slice(0, i))
        i++
        if (i > message.content.length) clearInterval(interval)
      }, 8)
      return () => clearInterval(interval)
    }
  }, [message.content, isNew, isUser])

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={i}>
          {i > 0 && <br />}
          <span dangerouslySetInnerHTML={{ __html: boldLine }} />
        </span>
      )
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx('flex items-end gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
        isUser
          ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white'
          : 'bg-gradient-to-br from-violet-600 to-pink-600 text-white'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-br-sm'
          : 'bg-white/[0.06] border border-white/[0.08] text-gray-200 rounded-bl-sm'
      )}>
        <p className="whitespace-pre-line">{renderContent(displayed)}</p>
        <p className={clsx('text-[10px] mt-1.5', isUser ? 'text-violet-200/70' : 'text-gray-600')}>
          {format(new Date(message.timestamp), 'h:mm a')}
        </p>
      </div>
    </motion.div>
  )
}

export default function AICoach() {
  const { state, dispatch } = useFitness()
  const { aiMessages, workouts, meals, goals, waterLogs, progressEntries, user } = state
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [newMsgId, setNewMsgId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, isTyping])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || isTyping) return

    const userMsg = {
      id: `msg${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    }

    dispatch({ type: 'ADD_AI_MESSAGE', payload: userMsg })
    setInput('')
    setIsTyping(true)

    const thinkTime = 800 + Math.random() * 1200
    await new Promise(r => setTimeout(r, thinkTime))

    const response = generateAIResponse(msg, { user, workouts, meals, goals, waterLogs, progressEntries })

    const aiMsg = {
      id: `msg${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    }

    setIsTyping(false)
    setNewMsgId(aiMsg.id)
    dispatch({ type: 'ADD_AI_MESSAGE', payload: aiMsg })
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    dispatch({ type: 'ADD_AI_MESSAGE', payload: {
      id: `msg${Date.now()}`,
      role: 'assistant',
      content: "Chat cleared! I'm still here and ready to help. What's on your mind, champion? 💪",
      timestamp: new Date().toISOString(),
    }})
  }

  return (
    <div className="flex gap-5 h-[calc(100dvh-8rem)] md:h-[calc(100vh-8.75rem)] md:sticky md:top-[72px]">
      {/* Main chat */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden min-w-0" style={{ minHeight: 0 }}>
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]"
          style={{ background: 'rgba(139,92,246,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-glow-violet">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-dark-950" />
            </div>
            <div>
              <p className="font-semibold text-white">FitAI Coach</p>
              <p className="text-xs text-emerald-400">Online · Powered by fitness intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI
            </span>
            <button onClick={clearChat} className="text-gray-600 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" data-lenis-prevent>
          {aiMessages.map(msg => (
            <MessageBubble key={msg.id} message={msg} isNew={msg.id === newMsgId} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-5 py-3 border-t border-white/[0.06]">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.text}
                onClick={() => sendMessage(p.text)}
                disabled={isTyping}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-violet-500/20 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
              >
                <p.Icon className="w-3.5 h-3.5 flex-shrink-0" />{p.text}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask FitAI anything about fitness, nutrition, goals..."
                rows={1}
                disabled={isTyping}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus:border-violet-500/40 transition-colors disabled:opacity-50"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white shadow-glow-violet disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
            >
              {isTyping ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
          <p className="text-[10px] text-gray-700 mt-2 text-center">FitAI uses your data to give personalized advice · Not medical advice</p>
        </div>
      </div>

      {/* Sidebar: Insights */}
      <div className="hidden xl:flex flex-col gap-4 w-72">
        {/* Daily Insights */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Today's Insights</h3>
          </div>
          <div className="space-y-3">
            {DAILY_INSIGHTS.map((insight, i) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors"
                style={{ background: `${insight.color}08`, border: `1px solid ${insight.color}20` }}
                onClick={() => sendMessage(insight.title + ' — ' + insight.body.slice(0, 40))}
              >
                <div className="flex items-center gap-2 mb-1">
                  <insight.Icon className="w-4 h-4 flex-shrink-0" style={{ color: insight.color }} />
                  <p className="text-xs font-semibold" style={{ color: insight.color }}>{insight.title}</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{insight.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Context aware stats */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Your Context</h3>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Workouts this week', value: workouts.filter(w => (Date.now() - new Date(w.date)) < 7 * 86400000).length + `/${user.weeklyWorkoutGoal}`, color: '#8b5cf6' },
              { label: 'Active goals', value: goals.length.toString(), color: '#10b981' },
              { label: 'Calorie goal', value: `${user.calorieGoal} kcal`, color: '#f59e0b' },
              { label: 'Protein goal', value: `${user.proteinGoal}g`, color: '#06b6d4' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] text-gray-600 leading-relaxed">FitAI reads your workout logs, nutrition data, and goals to give personalized, context-aware advice.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
