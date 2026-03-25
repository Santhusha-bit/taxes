import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdvisorClient from '@/components/advisor/AdvisorClient'

export default async function AdvisorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: transactions }, { data: history }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('chat_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(100),
  ])

  return (
    <AdvisorClient
      profile={profile}
      transactions={transactions ?? []}
      initialHistory={history ?? []}
    />
  )
}

export const metadata = { title: 'Tax Advisor — TaxWise' }
