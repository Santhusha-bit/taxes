import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const features = [
  {
    icon: '📊',
    color: 'bg-sky-bg',
    title: 'Income & expense tracking',
    desc: 'Log every transaction with automatic tax-impact tagging. See exactly which expenses qualify as deductions and how much they save you at your marginal rate.',
  },
  {
    icon: '🏦',
    color: 'bg-emerald-bg',
    title: 'IRA recommendation engine',
    desc: 'Roth vs. Traditional analysis based on your exact income, age, filing status, and employer plan, with projected retirement values and an income sensitivity slider.',
  },
  {
    icon: '🧮',
    color: 'bg-gold-bg',
    title: 'Real-time tax estimator',
    desc: 'Your federal tax, effective rate, and marginal bracket update live as you log income and deductions. No more end-of-year surprises.',
  },
  {
    icon: '✦',
    color: 'bg-ruby-bg',
    title: 'AI tax impact advisor',
    desc: 'Ask "What if I donate $5,000?" and get a before/after calculation using your actual numbers, not generic advice. Powered by Claude AI.',
  },
]

const steps = [
  { n: '01', title: 'Create your profile', desc: 'Enter income, filing status, age, and retirement contributions. Under 2 minutes.' },
  { n: '02', title: 'Log your finances',   desc: 'Add income and expenses. Deductible categories are flagged and counted toward your Schedule A automatically.' },
  { n: '03', title: 'Ask anything',        desc: 'The AI advisor knows your exact numbers. Ask how buying a home, changing jobs, or maxing your IRA changes your bill.' },
]

const testimonials = [
  { quote: 'Found $4,200 in deductions I completely missed. The chatbot showed me exactly how each one would affect my bill.', name: 'Sarah K.', role: 'Freelance designer' },
  { quote: 'Finally understand whether Roth or Traditional is right for me. The income slider is exactly what I needed.', name: 'Marcus T.', role: 'Software engineer' },
  { quote: 'I log every expense now because I can instantly see the tax savings. Changed how I think about money.', name: 'Priya M.', role: 'Small business owner' },
]

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="bg-cream min-h-screen">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-navy/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <span className="font-serif italic text-cream text-base leading-none">T</span>
            </div>
            <span className="font-serif text-lg font-medium text-navy tracking-tight">TaxWise</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-sm">Sign in</Link>
            <Link href="/register" className="btn btn-navy btn-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 relative">
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-gold-bg border border-gold/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
            <span className="text-xs text-gold font-medium">2025 Tax Year · Updated for One Big Beautiful Bill Act</span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-normal leading-[1.05] text-navy tracking-tight mb-6">
            Stop leaving money<br />
            <span className="italic text-gold">on the table.</span>
          </h1>

          <p className="text-lg text-navy/55 leading-relaxed max-w-xl mb-10 font-light">
            TaxWise tracks your income, surfaces every deduction, and lets you ask an AI advisor
            exactly how any financial decision impacts your tax bill using your actual numbers.
          </p>

          <div className="flex flex-wrap gap-3 mb-16">
            <Link href="/register" className="btn btn-navy btn-lg">Start optimizing free →</Link>
            <Link href="/login"    className="btn btn-outline btn-lg">Sign in to your account</Link>
          </div>

          {/* Proof numbers */}
          <div className="inline-flex border border-navy/10 rounded-xl overflow-hidden bg-white shadow-card">
            {[
              { n: '$11,200', l: 'avg. deductions found' },
              { n: '4 min',   l: 'to first insight' },
              { n: '2025',    l: 'fully up to date' },
            ].map((s, i) => (
              <div key={s.l} className={`px-8 py-5 text-center ${i > 0 ? 'border-l border-navy/10' : ''}`}>
                <div className="font-serif text-2xl font-medium text-navy tracking-tight">{s.n}</div>
                <div className="text-xs text-navy/40 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-normal text-navy tracking-tight mb-3">
            Everything you need to pay less tax
          </h2>
          <p className="text-navy/50 text-base max-w-md mx-auto">No spreadsheets. No generic advice. Your numbers, optimized.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(f => (
            <div key={f.title} className="card p-7 hover:-translate-y-0.5 hover:shadow-card2 transition-all duration-200">
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center text-lg mb-4`}>{f.icon}</div>
              <h3 className="font-serif text-lg font-medium text-navy mb-2">{f.title}</h3>
              <p className="text-sm text-navy/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-navy py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-normal italic text-cream tracking-tight">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(s => (
              <div key={s.n} className="p-7 bg-white/5 border border-white/10 rounded-xl">
                <div className="font-serif text-4xl text-gold/50 leading-none mb-5">{s.n}</div>
                <h3 className="font-serif text-lg text-cream mb-3">{s.title}</h3>
                <p className="text-sm text-cream/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-serif text-3xl font-normal text-navy text-center mb-10">Real people, real savings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.name} className="card p-6">
              <div className="text-2xl text-gold mb-3 leading-none font-serif">&quot;</div>
              <p className="text-sm text-navy/70 leading-relaxed mb-4 italic">{t.quote}</p>
              <div className="text-sm font-medium text-navy">{t.name}</div>
              <div className="text-xs text-navy/40">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-cream-2 border-y border-navy/10 py-20 px-4 sm:px-6 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-serif text-4xl font-normal text-navy tracking-tight mb-4">Your tax return is waiting.</h2>
          <p className="text-navy/50 text-base mb-8 leading-relaxed">Free to use. No credit card. Your data is encrypted and secure.</p>
          <Link href="/register" className="btn btn-navy btn-lg">Create your free account →</Link>
          <p className="text-xs text-navy/30 mt-5">Not a licensed tax professional · For informational purposes · Consult a CPA for your specific situation</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-navy/10 py-8 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-navy rounded-md flex items-center justify-center">
            <span className="font-serif italic text-cream text-xs">T</span>
          </div>
          <span className="font-serif text-sm text-navy">TaxWise</span>
        </div>
        <p className="text-xs text-navy/30">© 2025 TaxWise · 2025 Tax Year · All rights reserved</p>
      </footer>
    </div>
  )
}
