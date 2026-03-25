'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden md:flex w-96 bg-navy flex-col p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 20% 80%, rgba(201,148,58,0.18) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(29,90,142,0.25) 0%, transparent 60%)' }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2 mb-12 text-cream/50 hover:text-cream text-sm transition-colors">
            ← Back to TaxWise
          </Link>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center">
              <span className="font-serif italic text-cream text-xl leading-none">T</span>
            </div>
            <span className="font-serif text-xl text-cream">TaxWise</span>
          </div>
          <h2 className="font-serif text-3xl italic font-normal text-cream leading-tight mb-8">
            Welcome back.<br />Your taxes await.
          </h2>
          <div className="flex flex-col gap-4">
            {['Live federal tax estimates','Personalized IRA recommendation','AI tax impact advisor','Deduction tracker & optimizer'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-[10px]">✓</span>
                </div>
                <span className="text-sm text-cream/70">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
                <span className="font-serif italic text-cream text-sm">T</span>
              </div>
              <span className="font-serif text-lg text-navy">TaxWise</span>
            </Link>
          </div>

          <h1 className="font-serif text-2xl font-medium text-navy mb-1">Sign in</h1>
          <p className="text-sm text-navy/50 mb-7">Good to have you back</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="field-label">Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required />
            </div>
            {err && (
              <div className="bg-ruby-bg border border-ruby/20 rounded-lg px-4 py-3 text-sm text-ruby">{err}</div>
            )}
            <button type="submit" className="btn btn-navy w-full py-3 text-[15px] mt-1" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-navy/50">
            Don't have an account?{' '}
            <Link href="/register" className="text-navy font-medium underline underline-offset-2">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
