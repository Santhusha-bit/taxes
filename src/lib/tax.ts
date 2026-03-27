// ── 2025 Tax Brackets ────────────────────────────────────────
export type FilingStatus = 'single' | 'married_jointly' | 'head'

const BRACKETS: Record<FilingStatus, [number, number][]> = {
  single:          [[11925,.10],[48475,.12],[103350,.22],[197300,.24],[250525,.32],[626350,.35],[Infinity,.37]],
  married_jointly: [[23850,.10],[96950,.12],[206700,.22],[394600,.24],[501050,.32],[751600,.35],[Infinity,.37]],
  head:            [[17000,.10],[64850,.12],[103350,.22],[197300,.24],[250500,.32],[626350,.35],[Infinity,.37]],
}

export const STD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15750,
  married_jointly: 31500,
  head: 23625,
}

export const ROTH_LIMITS: Record<FilingStatus, [number, number]> = {
  single:          [150000, 165000],
  married_jointly: [236000, 246000],
  head:            [150000, 165000],
}

export const TRAD_IRA_PHASE: Record<FilingStatus, number> = {
  single:          79000,
  married_jointly: 126000,
  head:            79000,
}

export const DEDUCTIBLE_CATEGORIES = new Set([
  'Mortgage Interest',
  'Property Tax',
  'State / Local Tax',
  'Charitable Donation',
  'Medical & Dental',
  'HSA Contribution',
  'IRA Contribution',
  'Student Loan Interest',
])

export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  date: string | null
  description: string
  amount: number
  category: string
  note: string | null
  created_at: string
}

export interface Profile {
  id?: string
  name: string
  age: number | null
  filing_status: FilingStatus
  state: string
  annual_income: number
  employer_plan: boolean
  k401: number
  hsa: number
  ira_contrib: number
  roth_contrib: number
}

export interface TaxSummary {
  gross: number
  txIncome: number
  aboveLine: number
  agi: number
  itemized: number
  stdDed: number
  useItemized: boolean
  deduction: number
  taxable: number
  federalTax: number
  effectiveRate: number
  marginalRate: number
  status: FilingStatus
}

export function calcFederalTax(taxableIncome: number, status: FilingStatus): number {
  const brackets = BRACKETS[status] ?? BRACKETS.single
  let tax = 0
  let prev = 0
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break
    tax += (Math.min(taxableIncome, limit) - prev) * rate
    prev = limit
  }
  return Math.max(0, tax)
}

export function getMarginalRate(taxableIncome: number, status: FilingStatus): number {
  const brackets = BRACKETS[status] ?? BRACKETS.single
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= limit) return rate * 100
  }
  return 37
}

export function calcTaxSummary(profile: Profile, transactions: Transaction[]): TaxSummary {
  const status = profile.filing_status ?? 'single'
  const baseIncome = profile.annual_income ?? 0
  const txIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const gross = baseIncome + txIncome
  const aboveLine = (profile.k401 ?? 0) + (profile.hsa ?? 0) + (profile.ira_contrib ?? 0)
  const agi = Math.max(0, gross - aboveLine)
  const itemized = transactions
    .filter(t => t.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(t.category))
    .reduce((s, t) => s + t.amount, 0)
  const stdDed = STD_DEDUCTION[status] ?? 15750
  const useItemized = itemized > stdDed
  const deduction = useItemized ? itemized : stdDed
  const taxable = Math.max(0, agi - deduction)
  const federalTax = calcFederalTax(taxable, status)
  const effectiveRate = gross > 0 ? (federalTax / gross) * 100 : 0
  const marginalRate = getMarginalRate(taxable, status)
  return { gross, txIncome, aboveLine, agi, itemized, stdDed, useItemized, deduction, taxable, federalTax, effectiveRate, marginalRate, status }
}

export interface IRARec {
  type: 'Roth' | 'Traditional' | 'Split'
  reasons: string[]
  warnings: string[]
  limit: number
  rothEligible: boolean
}

export function getIRARec(profile: Profile): IRARec {
  const income = profile.annual_income ?? 0
  const age = profile.age ?? 30
  const status = profile.filing_status ?? 'single'
  const hasPlan = profile.employer_plan
  const [lo, hi] = ROTH_LIMITS[status] ?? ROTH_LIMITS.single
  const tradPhase = hasPlan ? (TRAD_IRA_PHASE[status] ?? 79000) : Infinity
  const limit = age >= 50 ? 8000 : 7000
  const rothEligible = income < hi

  let type: IRARec['type'] = 'Roth'
  const reasons: string[] = []
  const warnings: string[] = []

  if (income >= hi) {
    type = 'Traditional'
    reasons.push('Your income exceeds the Roth IRA direct contribution limit')
    warnings.push('Consider the Backdoor Roth IRA strategy; consult a CPA')
  } else if (income >= lo) {
    type = 'Traditional'
    reasons.push('Your income is in the Roth phase-out range ($' + lo.toLocaleString() + '–$' + hi.toLocaleString() + ')')
    warnings.push('A partial Roth contribution may still be allowed')
  } else if (income > tradPhase) {
    type = 'Roth'
    reasons.push('Traditional IRA deduction is phased out at your income with an employer plan')
    reasons.push('Roth grows tax-free without losing deductibility')
  } else if (age < 40) {
    type = 'Roth'
    reasons.push(`At ${age}, you have ${65 - age}+ years of tax-free compounding ahead`)
    reasons.push("You're likely in a lower bracket now than at retirement")
  } else if (age >= 55 && income > 120000) {
    type = 'Traditional'
    reasons.push('Peak earning years; deduction provides maximum immediate value')
    reasons.push('Expected lower tax rate in retirement makes deferral efficient')
  } else if (income < 50000) {
    type = 'Roth'
    reasons.push('Low bracket now; locking in today\'s rate is advantageous')
    reasons.push('Tax-free income in retirement adds flexibility')
  } else {
    type = 'Split'
    reasons.push('Middle-income range; diversifying hedges future tax rate uncertainty')
    reasons.push('Maintains flexibility regardless of future tax law changes')
  }

  return { type, reasons, warnings, limit, rothEligible }
}

export function projectIRA(
  contrib: number,
  years: number,
  returnRate: number,
  retirementRate: number
): { roth: number; traditional: number } {
  const fv = contrib * ((Math.pow(1 + returnRate, years) - 1) / returnRate) * (1 + returnRate)
  return {
    roth: fv,
    traditional: fv * (1 - retirementRate / 100),
  }
}

// ── Formatters ───────────────────────────────────────────────
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0)

export const formatPct = (n: number) => `${(n ?? 0).toFixed(1)}%`

// ── Category lists ───────────────────────────────────────────
export const INCOME_CATEGORIES = [
  'W-2 Wages', 'Self-Employment', 'Freelance / Consulting',
  'Rental Income', 'Dividends', 'Capital Gains',
  'Interest', 'Business Income', 'Other Income',
]

export const EXPENSE_CATEGORIES = [
  'Mortgage Interest', 'Property Tax', 'State / Local Tax',
  'Charitable Donation', 'Medical & Dental', 'HSA Contribution',
  'IRA Contribution', 'Student Loan Interest',
  'Rent', 'Groceries', 'Transportation', 'Utilities',
  'Insurance', 'Entertainment', 'Subscriptions',
  'Business Expense', 'Other',
]

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]
