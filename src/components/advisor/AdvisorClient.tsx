'use client'
import { useState, useRef, useEffect } from 'react'
import { calcTaxSummary, getIRARec, formatCurrency as fmt, formatPct as pct, type Profile, type Transaction } from '@/lib/tax'

interface ChatMessage { id: string; user_id: string; role: 'user'|'assistant'; content: string; created_at: string }
interface Props {
  profile: Profile | null
  transactions: Transaction[]
  initialHistory: ChatMessage[]
}

const QUICK_ASKS = [
  "What happens if I max out my 401(k) this year?",
  "How much would a $10,000 charitable donation save me?",
  "If I earn $30,000 freelancing, what's my new tax bill?",
  "Should I pay off my mortgage early or fund an IRA?",
  "How does buying a home change my tax situation?",
  "What deductions am I missing that I should be claiming?",
]

export default function AdvisorClient({ profile, transactions, initialHistory }: Props) {
  const [history, setHistory] = useState<ChatMessage[]>(initialHistory)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const p   = profile ?? {} as Profile
  const s   = calcTaxSummary(p, transactions)
  const ira = getIRARec(p)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, loading])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    // Optimistic UI
    const tempUser: ChatMessage = {
      id: `temp-${Date.now()}`, user_id: '', role: 'user', content: msg, created_at: new Date().toISOString()
    }
    setHistory(prev => [...prev, tempUser])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`, user_id: '', role: 'assistant',
        content: data.reply, created_at: new Date().toISOString()
      }
      setHistory(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`, user_id: '', role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.', created_at: new Date().toISOString()
      }
      setHistory(prev => [...prev, errMsg])
    } finally { setLoading(false) }
  }

  const clearChat = async () => {
    setHistory([])
    // Clear from DB
    await fetch('/api/chat/clear', { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div className="flex flex-col animate-fade-up" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-end flex-wrap gap-2">
          <div>
            <h1 className="font-serif text-2xl font-medium text-navy">Tax Impact Advisor</h1>
            <p className="text-sm text-navy/50 mt-0.5">Ask how any financial decision affects your specific tax bill</p>
          </div>
          {history.length > 0 && (
            <button className="btn btn-ghost btn-sm text-xs" onClick={clearChat}>Clear conversation</button>
          )}
        </div>

        {/* Context strip */}
        <div className="flex gap-2 flex-wrap mt-3">
          {[
            { l: 'Your tax', v: fmt(Math.round(s.federalTax)), cls: 'badge-ruby' },
            { l: 'Marginal', v: pct(s.marginalRate),           cls: 'badge-gold' },
            { l: 'AGI',      v: fmt(Math.round(s.agi)),        cls: 'badge-sky'  },
            { l: 'IRA rec',  v: ira.type,                      cls: 'badge-emerald' },
          ].map(b => (
            <div key={b.l} className="flex items-center gap-1.5 bg-white border border-navy/10 rounded-full px-3 py-1 shadow-card">
              <span className="text-[10px] text-navy/40">{b.l}</span>
              <span className={`badge ${b.cls} text-[10px] py-0`}>{b.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 min-h-0">
        {history.length === 0 && (
          <div>
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center mx-auto mb-4 shadow-card2">
                <span className="font-serif italic text-cream text-xl">✦</span>
              </div>
              <div className="font-serif text-lg text-navy mb-1">What would you like to know?</div>
              <p className="text-sm text-navy/40">I'll calculate the exact dollar impact on your {fmt(Math.round(s.federalTax))} tax bill</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {QUICK_ASKS.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="bg-white border border-navy/10 rounded-xl px-4 py-3 text-left text-sm text-navy/55 font-sans leading-relaxed shadow-card hover:border-navy hover:text-navy hover:shadow-card2 transition-all duration-150">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map(m => (
          <div key={m.id} className={`flex gap-2.5 items-start ${m.role==='user'?'justify-end':''}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-card">
                <span className="font-serif italic text-cream text-sm">✦</span>
              </div>
            )}
            <div className={m.role==='user'?'chat-user':'chat-ai'}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0 shadow-card">
              <span className="font-serif italic text-cream text-sm">✦</span>
            </div>
            <div className="chat-ai flex items-center gap-2">
              <span className="text-navy/50 text-sm">Crunching your numbers</span>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1 h-1 rounded-full bg-navy/40 inline-block animate-shimmer" style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-navy/10">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask how any financial action impacts your taxes… (Enter to send)"
              rows={2}
              className="resize-none"
            />
          </div>
          <button
            className="btn btn-navy h-[72px] px-5 flex-shrink-0"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            {loading ? '…' : 'Send →'}
          </button>
        </div>
        <p className="text-[10px] text-navy/25 mt-1.5">
          AI responses are for informational purposes. Always consult a licensed CPA for your specific tax situation.
        </p>
      </div>
    </div>
  )
}
