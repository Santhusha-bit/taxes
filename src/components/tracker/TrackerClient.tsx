'use client'
import { useState } from 'react'
import {
  calcTaxSummary,
  formatCurrency as fmt,
  formatPct as pct,
  DEDUCTIBLE_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type Profile,
  type Transaction,
} from '@/lib/tax'

interface Props {
  profile: Profile | null
  transactions: Transaction[]
}

type TxType = 'income' | 'expense'
interface FormState {
  type: TxType
  date: string
  description: string
  amount: string
  category: string
  note: string
}

const BLANK: FormState = {
  type: 'income',
  date: '',
  description: '',
  amount: '',
  category: 'W-2 Wages',
  note: '',
}

export default function TrackerClient({ profile, transactions: initial }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initial)
  const [form, setForm]       = useState<FormState>({ ...BLANK })
  const [filter, setFilter]   = useState<'all' | TxType>('all')
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formErr, setFormErr]  = useState('')

  const p = profile ?? ({} as Profile)
  const s = calcTaxSummary(p, transactions)

  const totalInc   = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
  const totalExp   = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
  const deductible = transactions
    .filter(t => t.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(t.category))
    .reduce((acc, t) => acc + t.amount, 0)
  const taxSaved = deductible * (s.marginalRate / 100)

  const addTransaction = async () => {
    setFormErr('')
    if (!form.description.trim()) { setFormErr('Description is required'); return }
    const amt = parseFloat(form.amount)
    if (!form.amount || amt <= 0) { setFormErr('Enter a valid amount greater than 0'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: amt }),
      })
      const tx = await res.json()
      if (!res.ok) { setFormErr(tx.error || 'Failed to add transaction'); return }
      setTransactions(prev => [tx, ...prev])
      setForm(f => ({ ...BLANK, type: f.type }))
      setShowForm(false)
    } catch { setFormErr('Network error — please try again') }
    finally { setAdding(false) }
  }

  const deleteTransaction = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      setTransactions(prev => prev.filter(t => t.id !== id))
    } finally { setDeleting(null) }
  }

  const setTxType = (type: TxType) => {
    setForm(f => ({
      ...f,
      type,
      category: type === 'income' ? 'W-2 Wages' : 'Mortgage Interest',
    }))
  }

  const visible = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t =>
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    )

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const previewSaving =
    form.type === 'expense' &&
    DEDUCTIBLE_CATEGORIES.has(form.category) &&
    parseFloat(form.amount) > 0
      ? parseFloat(form.amount) * (s.marginalRate / 100)
      : 0

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium text-navy">Income &amp; Expense Tracker</h1>
          <p className="text-sm text-navy/50 mt-0.5">Every deductible expense logged reduces your federal tax bill</p>
        </div>
        <button
          className="btn btn-navy btn-sm"
          onClick={() => { setShowForm(v => !v); setFormErr('') }}
        >
          {showForm ? '× Cancel' : '+ Add transaction'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card accent-emerald">
          <div className="text-[11px] font-medium text-navy/50 uppercase tracking-wider mb-2">Total income</div>
          <div className="font-serif text-2xl text-navy">{fmt(totalInc)}</div>
          <div className="text-[11px] text-navy/35 mt-1">{transactions.filter(t => t.type === 'income').length} transactions</div>
        </div>
        <div className="stat-card accent-ruby">
          <div className="text-[11px] font-medium text-navy/50 uppercase tracking-wider mb-2">Total expenses</div>
          <div className="font-serif text-2xl text-navy">{fmt(totalExp)}</div>
          <div className="text-[11px] text-navy/35 mt-1">{transactions.filter(t => t.type === 'expense').length} transactions</div>
        </div>
        <div className="stat-card accent-sky">
          <div className="text-[11px] font-medium text-navy/50 uppercase tracking-wider mb-2">Deductible expenses</div>
          <div className="font-serif text-2xl text-navy">{fmt(deductible)}</div>
          <div className="text-[11px] text-navy/35 mt-1">qualifying for Schedule A</div>
        </div>
        <div className="stat-card accent-gold">
          <div className="text-[11px] font-medium text-navy/50 uppercase tracking-wider mb-2">Est. tax saved</div>
          <div className="font-serif text-2xl text-navy">{fmt(taxSaved)}</div>
          <div className="text-[11px] text-navy/35 mt-1">at {pct(s.marginalRate)} marginal rate</div>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 animate-fade-up">
          <div className="font-serif text-base font-medium text-navy mb-4">New transaction</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="field-label">Type</label>
              <select value={form.type} onChange={e => setTxType(e.target.value as TxType)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="field-label">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="field-label">Amount ($)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div className="col-span-2">
              <label className="field-label">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={form.type === 'income' ? 'e.g. Monthly salary' : 'e.g. Mortgage payment'}
              />
            </div>
            <div className="col-span-2">
              <label className="field-label">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="field-label">Note (optional)</label>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Any additional details…" />
            </div>
          </div>

          {form.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(form.category) && (
            <div className="bg-emerald-bg border border-emerald/20 rounded-lg px-4 py-2.5 text-xs text-emerald mb-3 flex items-start gap-2">
              <span className="font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>
                <strong>{form.category}</strong> is tax-deductible and will count toward your Schedule A itemized deductions.
                {previewSaving > 0 && <> This will save you approximately <strong>{fmt(previewSaving)}</strong> in federal tax at your {pct(s.marginalRate)} marginal rate.</>}
              </span>
            </div>
          )}

          {formErr && (
            <div className="bg-ruby-bg border border-ruby/20 rounded-lg px-4 py-2.5 text-xs text-ruby mb-3">{formErr}</div>
          )}

          <div className="flex gap-2">
            <button className="btn btn-navy" onClick={addTransaction} disabled={adding}>
              {adding ? 'Adding…' : 'Add transaction'}
            </button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setFormErr('') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1 bg-cream-2 rounded-lg p-1">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-white shadow-card text-navy' : 'text-navy/50 hover:text-navy'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && ` (${transactions.filter(t => t.type === f).length})`}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" className="flex-1 min-w-32 max-w-xs" />
        <span className="text-xs text-navy/40 ml-auto">{visible.length} transaction{visible.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <div className="text-sm text-navy/40">{transactions.length === 0 ? 'No transactions yet — add one above' : 'No transactions match your filter'}</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Category</th>
                <th>Type</th><th className="text-right">Amount</th><th>Tax impact</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(tx => {
                const isDed = tx.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(tx.category)
                return (
                  <tr key={tx.id} className={deleting === tx.id ? 'opacity-40' : ''}>
                    <td className="text-navy/40 text-xs whitespace-nowrap">{tx.date || '—'}</td>
                    <td className="font-medium">{tx.description}</td>
                    <td className="text-navy/50 text-xs">{tx.category}</td>
                    <td><span className={`badge badge-${tx.type === 'income' ? 'emerald' : 'faint'}`}>{tx.type === 'income' ? 'Income' : 'Expense'}</span></td>
                    <td className={`text-right font-serif font-medium ${tx.type === 'income' ? 'text-emerald' : 'text-ruby'}`}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                    </td>
                    <td>
                      {isDed
                        ? <span className="badge badge-emerald text-[10px]">Saves {fmt(tx.amount * (s.marginalRate / 100))}</span>
                        : <span className="text-xs text-navy/25">—</span>}
                    </td>
                    <td>
                      <button className="btn btn-danger" onClick={() => deleteTransaction(tx.id)} disabled={deleting === tx.id}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {visible.length > 0 && (
        <div className="flex justify-between text-xs text-navy/40 px-1">
          <span>{visible.filter(t => t.type === 'income').length} income · {visible.filter(t => t.type === 'expense').length} expenses</span>
          <span>Net: <span className={`font-medium ${totalInc - totalExp >= 0 ? 'text-emerald' : 'text-ruby'}`}>{totalInc - totalExp >= 0 ? '+' : ''}{fmt(totalInc - totalExp)}</span></span>
        </div>
      )}
    </div>
  )
}
