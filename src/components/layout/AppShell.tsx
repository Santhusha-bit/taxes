'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Overview',     icon: '⊟' },
  { href: '/tracker',   label: 'Transactions', icon: '⇅' },
  { href: '/ira',       label: 'IRA Analysis', icon: '◑' },
  { href: '/advisor',   label: 'Tax Advisor',  icon: '✦' },
  { href: '/profile',   label: 'My Profile',   icon: '◎' },
]

interface Props {
  user: { email?: string }
  initialProfile: { name?: string } | null
  children: React.ReactNode
}

export default function AppShell({ user, initialProfile, children }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = initialProfile?.name || user.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* ── Sidebar ── */}
      <aside className="w-56 min-w-56 bg-white border-r border-navy/10 flex flex-col py-4 px-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-navy/10">
          <div className="w-7 h-7 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-serif italic text-cream text-sm leading-none">T</span>
          </div>
          <div>
            <div className="font-serif text-[15px] font-medium text-navy leading-none">TaxWise</div>
            <div className="text-[10px] text-navy/30 mt-0.5">2025 tax year</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-link ${pathname === n.href || pathname.startsWith(n.href + '/') ? 'active' : ''}`}
            >
              <span className="text-sm w-5 leading-none">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* User + signout */}
        <div className="border-t border-navy/10 pt-3 mt-2">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium text-navy">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-navy truncate">{displayName}</div>
              <div className="text-[10px] text-navy/40 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-ghost w-full text-center text-xs py-1.5 rounded-lg text-navy/50 hover:text-navy hover:bg-cream-2"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-cream">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
