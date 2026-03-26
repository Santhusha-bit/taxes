'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    if (!name.trim()) { setErr('Please enter your name'); setLoading(false); return }
    if (pass.length < 8) { setErr('Password must be at least 8 characters'); setLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name: name.trim() } },
    })
    if (error) { setErr(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-cream flex">
      {/* Left panel */}
      <div className="hidden md:flex w-96 bg-navy flex-col p-10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 70%, rgba(201,148,58,0.18) 0%, transparent 60%)' }} />
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
            Start keeping more<br />of what you earn.
          </h2>
          <div className="flex flex-col gap-4">
            {['Free forever — no credit card','Your data is encrypted & secure','2025 tax rules built in','AI advisor powered by Claude'].map(f => (
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
                <span className="font-serif italic text-cream text-sm">T</span>
              </div>
              <span className="font-serif text-lg text-navy">TaxWise</span>
            </Link>
          </div>

          <h1 className="font-serif text-2xl font-medium text-navy mb-1">Create your account</h1>
          <p className="text-sm text-navy/50 mb-7">Free forever · No credit card required</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="field-label">Full name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson" required />
            </div>
            <div>
              <label className="field-label">Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
            </div>
            {err && (
              <div className="bg-ruby-bg border border-ruby/20 rounded-lg px-4 py-3 text-sm text-ruby">{err}</div>
            )}
            <button type="submit" className="btn btn-navy w-full py-3 text-[15px] mt-1" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-navy/50">
            Already have an account?{' '}
            <Link href="/login" className="text-navy font-medium underline underline-offset-2">Sign in</Link>
          </p>
          <p className="text-center mt-3 text-xs text-navy/30">
            By creating an account you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}
