import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrackerClient from '@/components/tracker/TrackerClient'

export default async function TrackerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return <TrackerClient profile={profile} transactions={transactions ?? []} />
}

export const metadata = { title: 'Transactions' }
