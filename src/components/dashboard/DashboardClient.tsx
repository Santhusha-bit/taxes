'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { calcTaxSummary, getIRARec, formatCurrency as fmt, formatPct as pct, DEDUCTIBLE_CATEGORIES, type Profile, type Transaction } from '@/lib/tax'

interface Props {
  profile: Profile | null
  transactions: Transaction[]
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="text-[11px] font-medium text-navy/50 uppercase tracking-wider mb-2">{label}</div>
      <div className="font-serif text-[1.6rem] font-medium text-navy leading-none mb-1.5">{value}</div>
      {sub && <div className="text-[11px] text-navy/35">{sub}</div>}
    </div>
  )
}

export default function DashboardClient({ profile, transactions }: Props) {
  const p = profile ?? {} as Profile
  const s   = useMemo(() => calcTaxSummary(p, transactions), [p, transactions])
  const ira = useMemo(() => getIRARec(p), [p])

  const recent     = [...transactions].slice(0, 6)
  const deductible = transactions.filter(t => t.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(t.category))
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium text-navy">
            {p.name ? `Hello, ${p.name.split(' ')[0]}.` : 'Your tax overview'}
          </h1>
          <p className="text-sm text-navy/50 mt-0.5">
            {(p.filing_status || 'single').replace('_', ' ')} filer · {p.state || '—'} · Tax Year 2025
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tracker" className="btn btn-outline btn-sm">+ Log transaction</Link>
          <Link href="/advisor" className="btn btn-navy btn-sm">✦ Ask advisor</Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Gross income"      value={fmt(s.gross)}      sub={`W-2 + ${transactions.filter(t=>t.type==='income').length} logged`} accent="emerald" />
        <StatCard label="Adjusted gross"    value={fmt(s.agi)}        sub={`${fmt(s.aboveLine)} in above-line deductions`}                     accent="gold" />
        <StatCard label="Est. federal tax"  value={fmt(s.federalTax)} sub={`${pct(s.effectiveRate)} effective · ${pct(s.marginalRate)} marginal`} accent="ruby" />
        <StatCard label="Tax from deducts." value={fmt(deductible * s.marginalRate / 100)} sub="estimated savings from logged deductions" accent="sky" />
      </div>

      {/* Deduction + IRA row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deduction strategy */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="font-serif text-base font-medium text-navy">Deduction strategy</div>
            <span className={`badge badge-${s.useItemized ? 'emerald' : 'sky'}`}>
              {s.useItemized ? 'Itemizing' : 'Standard'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`rounded-lg p-3 ${s.useItemized ? 'bg-cream-2' : 'bg-emerald-bg border border-emerald/15'}`}>
              <div className="text-[11px] text-navy/40 mb-1.5">Standard deduction</div>
              <div className={`font-serif text-xl ${s.useItemized ? 'text-navy/40' : 'text-emerald'}`}>{fmt(s.stdDed)}</div>
            </div>
            <div className={`rounded-lg p-3 ${s.useItemized ? 'bg-emerald-bg border border-emerald/15' : 'bg-cream-2'}`}>
              <div className="text-[11px] text-navy/40 mb-1.5">Your itemized</div>
              <div className={`font-serif text-xl ${s.useItemized ? 'text-emerald' : 'text-navy/40'}`}>{fmt(s.itemized)}</div>
            </div>
          </div>
          <p className="text-xs text-navy/50 leading-relaxed">
            {s.useItemized
              ? `Itemizing saves you ${fmt(s.itemized - s.stdDed)} more than the standard deduction.`
              : `You need ${fmt(s.stdDed - s.itemized)} more in deductible expenses to beat the standard deduction.`}
          </p>
        </div>

        {/* IRA recommendation */}
        <div className={`card p-5 border-t-[3px] ${ira.type==='Roth'?'border-t-emerald':ira.type==='Traditional'?'border-t-sky':'border-t-gold'}`}>
          <div className="flex justify-between items-start mb-3">
            <div className="font-serif text-base font-medium text-navy">IRA recommendation</div>
            <span className={`badge badge-${ira.type==='Roth'?'emerald':ira.type==='Traditional'?'sky':'gold'}`}>
              {ira.type === 'Split' ? 'Split' : ira.type}
            </span>
          </div>
          <div className={`font-serif italic text-2xl mb-3 ${ira.type==='Roth'?'text-emerald':ira.type==='Traditional'?'text-sky':'text-gold'}`}>
            {ira.type === 'Split' ? 'Roth + Traditional' : `${ira.type} IRA`}
          </div>
          <ul className="space-y-1 mb-3">
            {ira.reasons.map((r, i) => (
              <li key={i} className="text-xs text-navy/55 leading-relaxed">• {r}</li>
            ))}
          </ul>
          {ira.warnings[0] && (
            <div className="bg-gold-bg border border-gold/25 rounded-lg px-3 py-2 text-xs text-gold mb-3">⚠ {ira.warnings[0]}</div>
          )}
          <Link href="/ira" className="text-xs text-navy font-medium underline underline-offset-2">Full IRA analysis →</Link>
        </div>
      </div>

      {/* Tax waterfall */}
      <div className="card p-5">
        <div className="font-serif text-base font-medium text-navy mb-5">2025 federal tax breakdown</div>
        <div className="flex gap-6 flex-wrap">
          <div className="flex-[2] min-w-52 space-y-3">
            {[
              { label: 'Gross income',              val: s.gross,      pctOf: s.gross, neg: false, color: 'bg-sky' },
              { label: 'Above-line deductions',     val: s.aboveLine,  pctOf: s.gross, neg: true,  color: 'bg-emerald' },
              { label: 'Adjusted gross income',     val: s.agi,        pctOf: s.gross, neg: false, color: 'bg-navy' },
              { label: `${s.useItemized?'Itemized':'Standard'} deduction`, val: s.deduction, pctOf: s.gross, neg: true, color: 'bg-emerald' },
              { label: 'Taxable income',            val: s.taxable,    pctOf: s.gross, neg: false, color: 'bg-gold' },
              { label: 'Federal tax owed',          val: s.federalTax, pctOf: s.gross, neg: false, color: 'bg-ruby' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="text-xs text-navy/45 w-48 flex-shrink-0">{row.label}</div>
                <div className="flex-1 h-1.5 bg-cream-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all duration-700`}
                    style={{ width: `${Math.min(100, s.gross > 0 ? (row.val / s.gross) * 100 : 0)}%` }}
                  />
                </div>
                <div className={`font-serif text-sm font-medium w-24 text-right ${row.neg ? 'text-emerald' : 'text-navy'}`}>
                  {row.neg ? `−${fmt(row.val)}` : fmt(row.val)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-40 space-y-2.5">
            {[
              { label: 'Effective rate',   val: pct(s.effectiveRate), color: 'text-ruby' },
              { label: 'Marginal bracket', val: pct(s.marginalRate),  color: 'text-gold' },
              { label: 'Taxable income',   val: fmt(s.taxable),       color: 'text-navy' },
            ].map(m => (
              <div key={m.label} className="bg-cream-2 rounded-lg p-3">
                <div className="text-[10px] font-medium text-navy/40 uppercase tracking-wider mb-1">{m.label}</div>
                <div className={`font-serif text-xl ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-navy/10">
          <div className="font-serif text-base font-medium text-navy">Recent transactions</div>
          <Link href="/tracker" className="text-xs text-navy font-medium underline underline-offset-2">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-3">📋</div>
            <div className="font-serif text-base text-navy mb-1">No transactions yet</div>
            <p className="text-sm text-navy/40 mb-4">Log income and expenses to see your tax impact</p>
            <Link href="/tracker" className="btn btn-navy btn-sm">Add your first transaction</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th>
                  <th className="text-right">Amount</th><th>Tax status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(tx => {
                  const isDeductible = tx.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(tx.category)
                  return (
                    <tr key={tx.id}>
                      <td className="text-navy/40 whitespace-nowrap text-xs">{tx.date || '—'}</td>
                      <td className="font-medium">{tx.description}</td>
                      <td className="text-navy/50 text-xs">{tx.category}</td>
                      <td className={`text-right font-serif font-medium ${tx.type==='income'?'text-emerald':'text-ruby'}`}>
                        {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                      </td>
                      <td>
                        {isDeductible
                          ? <span className="badge badge-emerald">Deductible</span>
                          : <span className="badge badge-faint">{tx.type === 'income' ? 'Income' : 'Expense'}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
