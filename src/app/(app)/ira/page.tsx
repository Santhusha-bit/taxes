import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IRAClient from '@/components/ira/IRAClient'

export default async function IRAPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  return <IRAClient profile={profile} />
}

export const metadata = { title: 'IRA Analysis' }
