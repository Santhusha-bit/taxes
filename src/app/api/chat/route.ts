import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { calcTaxSummary, getIRARec, DEDUCTIBLE_CATEGORIES, formatCurrency, formatPct } from '@/lib/tax'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Fetch user context
    const [{ data: profile }, { data: txns }, { data: history }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(40),
    ])

    const transactions = txns ?? []
    const s   = calcTaxSummary(profile, transactions)
    const ira = getIRARec(profile)

    const deductibleTxns = transactions.filter(t => t.type === 'expense' && DEDUCTIBLE_CATEGORIES.has(t.category))
    const incomeTxns     = transactions.filter(t => t.type === 'income')

    const systemPrompt = `You are TaxWise AI, an expert US tax advisor embedded in a personal finance app. You have the user's complete, real financial data and specialize in calculating the EXACT dollar impact of financial decisions.

════ USER PROFILE ════
Name: ${profile?.name || 'User'} | Age: ${profile?.age || '?'} | State: ${profile?.state || '?'}
Filing status: ${(profile?.filing_status || 'single').replace('_', ' ')}
Employer retirement plan: ${profile?.employer_plan ? 'Yes' : 'No'}

════ INCOME ════
Annual W-2/salary: ${formatCurrency(profile?.annual_income || 0)}
Additional income logged: ${formatCurrency(s.txIncome)} (${incomeTxns.length} transactions)
Gross total: ${formatCurrency(s.gross)}

════ RETIREMENT CONTRIBUTIONS ════
401(k): ${formatCurrency(profile?.k401 || 0)} | HSA: ${formatCurrency(profile?.hsa || 0)} | IRA: ${formatCurrency(profile?.ira_contrib || 0)}
Above-line deductions total: ${formatCurrency(s.aboveLine)}

════ 2025 TAX ESTIMATES ════
AGI: ${formatCurrency(s.agi)} | Taxable income: ${formatCurrency(s.taxable)}
Federal tax: ${formatCurrency(s.federalTax)}
Effective rate: ${formatPct(s.effectiveRate)} | Marginal rate: ${formatPct(s.marginalRate)}
Deduction: ${s.useItemized ? 'Itemized ' + formatCurrency(s.itemized) : 'Standard ' + formatCurrency(s.stdDed)} (${s.useItemized ? 'itemizing wins' : 'standard wins'})

════ IRA RECOMMENDATION ════
${ira.type} IRA | Limit: ${formatCurrency(ira.limit)} | Roth eligible: ${ira.rothEligible ? 'Yes' : 'No'}
Reason: ${ira.reasons[0]}

════ LOGGED TRANSACTIONS (${transactions.length} total) ════
Deductible expenses: ${deductibleTxns.map(t => t.description + ' $' + t.amount + ' (' + t.category + ')').slice(0, 10).join(', ') || 'none'}
Income sources: ${incomeTxns.map(t => t.category + ' $' + t.amount).slice(0, 8).join(', ') || 'none'}

════ YOUR INSTRUCTIONS ════
When user asks "what if I do X" or "how does X affect my taxes":
1. State the user's CURRENT numbers (from above)
2. Calculate the AFTER numbers with the proposed change
3. Show the EXACT dollar difference on: taxable income, federal tax, effective rate
4. Give a specific recommendation with dollar amounts
5. Use bullet points, be concise (under 300 words)
6. End with one actionable next step

Always use 2025 tax rules. Reference the One Big Beautiful Bill Act where relevant (SALT cap $40,000, standard deductions as above).
End every response with a reminder to consult a licensed CPA for their specific situation.`

    // Build message history for context
    const messages: Anthropic.MessageParam[] = [
      ...(history ?? []).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const reply = response.content.find(c => c.type === 'text')?.text ?? 'Sorry, I could not generate a response.'

    // Save both messages to DB
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user',      content: message },
      { user_id: user.id, role: 'assistant', content: reply   },
    ])

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
