'use client'
import { useState, useMemo } from 'react'
import { getIRARec, calcTaxSummary, projectIRA, formatCurrency as fmt, formatPct as pct, ROTH_LIMITS, type Profile } from '@/lib/tax'

interface Props { profile: Profile | null }

export default function IRAClient({ profile }: Props) {
  const p   = profile ?? {} as Profile
  const ira = useMemo(() => getIRARec(p), [p])
  const s   = useMemo(() => calcTaxSummary(p, []), [p])
  const age = p.age ?? 35
  const years = Math.max(1, 65 - age)
  const income = p.annual_income ?? 75000
  const retRate = Math.max(10, s.marginalRate - 8)
  const proj = useMemo(() => projectIRA(ira.limit, years, 0.07, retRate), [ira.limit, years, retRate])
  const [altInc, setAltInc] = useState(income)
  const altP   = useMemo(() => ({ ...p, annual_income: altInc }), [p, altInc])
  const altS   = useMemo(() => calcTaxSummary(altP, []), [altP])
  const altIra = useMemo(() => getIRARec(altP), [altP])
  const status = p.filing_status ?? 'single'
  const [lo, hi] = ROTH_LIMITS[status] ?? ROTH_LIMITS.single

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h1 className="font-serif text-2xl font-medium text-navy">Roth vs. Traditional IRA</h1>
        <p className="text-sm text-navy/50 mt-0.5">Personalized analysis based on your income, age, and filing status</p>
      </div>

      {/* Recommendation banner */}
      <div className={`card p-6 border-l-4 ${ira.type==='Roth'?'border-l-emerald':ira.type==='Traditional'?'border-l-sky':'border-l-gold'}`}>
        <div className="flex gap-6 flex-wrap items-start">
          <div className="flex-1 min-w-52">
            <div className="text-[11px] font-medium text-navy/40 uppercase tracking-wider mb-2">Our recommendation for you</div>
            <div className={`font-serif italic text-3xl mb-3 ${ira.type==='Roth'?'text-emerald':ira.type==='Traditional'?'text-sky':'text-gold'}`}>
              {ira.type === 'Split' ? 'Roth + Traditional' : `${ira.type} IRA`}
            </div>
            <ul className="space-y-1.5 mb-3">
              {ira.reasons.map((r, i) => <li key={i} className="text-sm text-navy/55 leading-relaxed">• {r}</li>)}
            </ul>
            {ira.warnings.map((w, i) => (
              <div key={i} className="bg-gold-bg border border-gold/25 rounded-lg px-3 py-2 text-xs text-gold mt-2">⚠ {w}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 min-w-48">
            {[
              { label: 'Your age',           val: `${age} yrs`,        sub: `${years} yrs to retirement` },
              { label: 'Marginal rate now',  val: pct(s.marginalRate), sub: 'on last dollar earned' },
              { label: 'Est. retirement',    val: pct(retRate),        sub: 'estimated at retirement' },
              { label: 'Annual limit',       val: fmt(ira.limit),      sub: age>=50?'catch-up included':'increases at 50' },
            ].map(m => (
              <div key={m.label} className="bg-cream-2 rounded-lg p-3">
                <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1">{m.label}</div>
                <div className="font-serif text-base text-navy">{m.val}</div>
                <div className="text-[10px] text-navy/35">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            name: 'Roth IRA', type: 'Roth' as const,
            rec: ira.type==='Roth'||ira.type==='Split',
            eligible: income < hi,
            eligibleText: income >= hi ? '✗ Over income limit' : income >= lo ? '⚠ In phase-out range' : '✓ Eligible',
            eligibleColor: income >= hi ? 'text-ruby' : income >= lo ? 'text-gold' : 'text-emerald',
            fv: fmt(Math.round(proj.roth)),
            fvLabel: 'Tax-free retirement value (est.)',
            color: 'emerald', badgeClass: 'badge-emerald', borderClass: 'border-t-emerald',
            pros: ['Withdrawals 100% tax-free in retirement','No required minimum distributions','Contributions withdrawable anytime','Best if taxes rise in future'],
            cons: ['No tax deduction today','Income limit applies','5-year rule for earnings'],
          },
          {
            name: 'Traditional IRA', type: 'Traditional' as const,
            rec: ira.type==='Traditional'||ira.type==='Split',
            eligible: true,
            eligibleText: '✓ Always eligible to contribute',
            eligibleColor: 'text-emerald',
            fv: fmt(Math.round(proj.traditional)),
            fvLabel: 'After-tax retirement value (est.)',
            color: 'sky', badgeClass: 'badge-sky', borderClass: 'border-t-sky',
            pros: ['Tax deduction lowers this year\'s bill','No income limit to contribute','Same tax-deferred growth as Roth','Best if taxes fall in retirement'],
            cons: ['Withdrawals taxed as ordinary income','RMDs required at age 73','10% penalty before age 59½'],
          },
        ].map(opt => (
          <div key={opt.name} className={`card p-5 border-t-[3px] ${opt.rec?opt.borderClass:'border-t-transparent'}`}>
            {opt.rec && <div className="mb-3"><span className={`badge ${opt.badgeClass}`}>Recommended for you</span></div>}
            <div className="font-serif text-lg font-medium text-navy mb-1">{opt.name}</div>
            <div className={`text-xs mb-4 ${opt.eligibleColor}`}>{opt.eligibleText}</div>
            <div className={`rounded-lg p-4 mb-4 ${opt.color==='emerald'?'bg-emerald-bg':'bg-sky-bg'}`}>
              <div className="text-[11px] text-navy/40 mb-1.5">{opt.fvLabel} at 65 · 7% return</div>
              <div className={`font-serif text-3xl font-normal ${opt.color==='emerald'?'text-emerald':'text-sky'}`}>{opt.fv}</div>
            </div>
            <div className="text-xs font-medium text-navy mb-2">Benefits</div>
            <ul className="space-y-1 mb-4">
              {opt.pros.map(p=><li key={p} className="text-xs text-navy/55 leading-relaxed">• {p}</li>)}
            </ul>
            <div className="text-xs font-medium text-navy mb-2">Considerations</div>
            <ul className="space-y-1">
              {opt.cons.map(c=><li key={c} className="text-xs text-navy/55 leading-relaxed">• {c}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Income sensitivity slider */}
      <div className="card p-5">
        <div className="font-serif text-base font-medium text-navy mb-1">How does my recommendation change with income?</div>
        <p className="text-xs text-navy/40 mb-5">Drag to explore different income levels</p>
        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-navy/40 w-8">$0</span>
          <input type="range" min={0} max={500000} step={1000} value={altInc} onChange={e=>setAltInc(+e.target.value)} className="flex-1" />
          <span className="text-xs text-navy/40 w-16 text-right">$500k</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-cream-2 rounded-lg p-3">
            <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1">At income</div>
            <div className="font-serif text-xl text-navy">{fmt(altInc)}</div>
          </div>
          <div className="bg-cream-2 rounded-lg p-3">
            <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1">Marginal rate</div>
            <div className="font-serif text-xl text-navy">{pct(altS.marginalRate)}</div>
          </div>
          <div className={`rounded-lg p-3 border-l-4 ${altIra.type==='Roth'?'bg-emerald-bg border-l-emerald':altIra.type==='Traditional'?'bg-sky-bg border-l-sky':'bg-gold-bg border-l-gold'}`}>
            <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1">Best IRA</div>
            <div className={`font-serif italic text-xl ${altIra.type==='Roth'?'text-emerald':altIra.type==='Traditional'?'text-sky':'text-gold'}`}>
              {altIra.type === 'Split' ? 'Split strategy' : `${altIra.type} IRA`}
            </div>
            <div className="text-[10px] text-navy/40 mt-1 leading-relaxed">{altIra.reasons[0]}</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-navy/30 leading-relaxed">
        Projection assumes {fmt(ira.limit)}/year contributions, 7% average annual return, {years} years to retirement,
        and a {pct(retRate)} estimated tax rate in retirement. For illustrative purposes only.
        Consult a licensed CPA for personalized advice specific to your situation.
      </p>
    </div>
  )
}
