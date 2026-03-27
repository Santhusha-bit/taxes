'use client'
import { useState, useMemo } from 'react'
import { calcTaxSummary, getIRARec, formatCurrency as fmt, formatPct as pct, US_STATES, type Profile } from '@/lib/tax'

interface Props { profile: Profile | null; userEmail: string }

const FILING_OPTIONS = [
  { value: 'single',          label: 'Single' },
  { value: 'married_jointly', label: 'Married filing jointly' },
  { value: 'head',            label: 'Head of household' },
]

export default function ProfileClient({ profile: initial, userEmail }: Props) {
  const [profile, setProfile] = useState<Profile>(initial ?? {
    name: '', age: null, filing_status: 'single', state: 'CA',
    annual_income: 0, employer_plan: false, k401: 0, hsa: 0, ira_contrib: 0, roth_contrib: 0,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [err,    setErr]    = useState('')

  const s   = useMemo(() => calcTaxSummary(profile, []), [profile])
  const ira = useMemo(() => getIRARec(profile), [profile])

  const set = (k: keyof Profile, v: unknown) => setProfile(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) { const d = await res.json(); setErr(d.error || 'Save failed'); return }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch { setErr('Network error - please try again') }
    finally { setSaving(false) }
  }

  const Field = ({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) => (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {help && <p className="text-[11px] text-navy/35 mt-1">{help}</p>}
    </div>
  )

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h1 className="font-serif text-2xl font-medium text-navy">My Tax Profile</h1>
        <p className="text-sm text-navy/50 mt-0.5">All estimates update live as you edit; save when ready</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left - form */}
        <div className="flex flex-col gap-4">
          {/* Personal */}
          <div className="card p-5">
            <div className="font-serif text-base font-medium text-navy mb-4">Personal information</div>
            <div className="flex flex-col gap-3.5">
              <Field label="Full name">
                <input value={profile.name} onChange={e=>set('name',e.target.value)} placeholder="Alex Johnson" />
              </Field>
              <Field label="Age" help="Used for IRA contribution limits and retirement projections">
                <input type="number" value={profile.age ?? ''} onChange={e=>set('age',e.target.value?parseInt(e.target.value):null)} placeholder="35" min={18} max={100} />
              </Field>
              <Field label="Filing status">
                <select value={profile.filing_status} onChange={e=>set('filing_status',e.target.value)}>
                  {FILING_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="State of residence">
                <select value={profile.state} onChange={e=>set('state',e.target.value)}>
                  {US_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Email address">
                <input value={userEmail} disabled className="opacity-50 cursor-not-allowed" />
              </Field>
            </div>
          </div>

          {/* Income */}
          <div className="card p-5">
            <div className="font-serif text-base font-medium text-navy mb-4">Income</div>
            <div className="flex flex-col gap-3.5">
              <Field label="Annual W-2 / salary ($)" help="Your gross salary before any deductions or withholding">
                <input type="number" value={profile.annual_income || ''} onChange={e=>set('annual_income',parseFloat(e.target.value)||0)} placeholder="0" min={0} step={1000} />
              </Field>
              <Field label="Employer retirement plan?">
                <label className="flex items-center gap-2.5 cursor-pointer mt-0.5">
                  <input type="checkbox" checked={profile.employer_plan} onChange={e=>set('employer_plan',e.target.checked)} />
                  <span className="text-sm text-navy">Covered by 401(k), 403(b), or similar plan</span>
                </label>
              </Field>
            </div>
          </div>

          {/* Retirement */}
          <div className="card p-5">
            <div className="font-serif text-base font-medium text-navy mb-4">Retirement contributions</div>
            <div className="flex flex-col gap-3.5">
              <Field label="401(k) / 403(b) contributions ($)" help="2025 limit: $23,500 · $31,000 if age 50+">
                <input type="number" value={profile.k401||''} onChange={e=>set('k401',parseFloat(e.target.value)||0)} placeholder="0" min={0} step={100} />
              </Field>
              <Field label="HSA contributions ($)" help="2025 limit: $4,300 single · $8,550 family">
                <input type="number" value={profile.hsa||''} onChange={e=>set('hsa',parseFloat(e.target.value)||0)} placeholder="0" min={0} step={100} />
              </Field>
              <Field label="Traditional IRA contributions ($)" help="2025 limit: $7,000 · $8,000 if age 50+">
                <input type="number" value={profile.ira_contrib||''} onChange={e=>set('ira_contrib',parseFloat(e.target.value)||0)} placeholder="0" min={0} step={100} />
              </Field>
              <Field label="Roth IRA contributions ($)">
                <input type="number" value={profile.roth_contrib||''} onChange={e=>set('roth_contrib',parseFloat(e.target.value)||0)} placeholder="0" min={0} step={100} />
              </Field>
            </div>
          </div>

          {err && <div className="bg-ruby-bg border border-ruby/20 rounded-lg px-4 py-3 text-sm text-ruby">{err}</div>}

          <button className="btn btn-navy py-3 text-[15px]" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Profile saved!' : 'Save profile'}
          </button>
        </div>

        {/* Right - live snapshot (sticky) */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          {/* Tax snapshot */}
          <div className="card-navy p-5">
            <div className="text-[11px] font-medium text-cream/50 uppercase tracking-wider mb-4">Live tax snapshot</div>
            <div className="space-y-0">
              {[
                { label: 'Gross income',          val: fmt(s.gross),                 color: 'text-cream/90' },
                { label: 'Above-line deductions', val: `−${fmt(s.aboveLine)}`,       color: 'text-green-300' },
                { label: 'AGI',                   val: fmt(s.agi),                   color: 'text-cream/90' },
                { label: s.useItemized?'Itemized':'Standard', val: `−${fmt(s.deduction)}`, color: 'text-green-300' },
                { label: 'Taxable income',        val: fmt(s.taxable),               color: 'text-yellow-200' },
                { label: 'Federal tax',           val: fmt(s.federalTax),            color: 'text-red-300' },
                { label: 'Effective rate',        val: pct(s.effectiveRate),         color: 'text-red-300' },
                { label: 'Marginal bracket',      val: pct(s.marginalRate),          color: 'text-yellow-200' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/8">
                  <span className="text-xs text-cream/50">{row.label}</span>
                  <span className={`font-serif text-sm font-medium ${row.color}`}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* IRA recommendation */}
          <div className={`card p-4 border-l-4 ${ira.type==='Roth'?'border-l-emerald':ira.type==='Traditional'?'border-l-sky':'border-l-gold'}`}>
            <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-1.5">IRA recommendation</div>
            <div className={`font-serif italic text-xl mb-2 ${ira.type==='Roth'?'text-emerald':ira.type==='Traditional'?'text-sky':'text-gold'}`}>
              {ira.type === 'Split' ? 'Roth + Traditional' : `${ira.type} IRA`}
            </div>
            {ira.reasons.slice(0,2).map((r,i) => (
              <div key={i} className="text-xs text-navy/50 leading-relaxed">• {r}</div>
            ))}
          </div>

          {/* Contribution limit */}
          <div className="bg-gold-bg border border-gold/20 rounded-xl p-4">
            <div className="text-xs font-medium text-gold mb-1">2025 IRA contribution limit</div>
            <div className="font-serif text-2xl text-navy">{fmt(ira.limit)}</div>
            <div className="text-xs text-navy/40 mt-1">
              {(profile.age ?? 0) >= 50 ? 'Includes $1,000 catch-up contribution (age 50+)' : 'Increases to $8,000 at age 50'}
            </div>
          </div>

          <p className="text-[11px] text-navy/25 leading-relaxed">
            Estimates use 2025 federal brackets and rules (One Big Beautiful Bill Act). State taxes not included.
            Not a substitute for professional tax advice; consult a licensed CPA.
          </p>
        </div>
      </div>
    </div>
  )
}
