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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = initialProfile?.name || user.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = (
    <>
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
            onClick={() => setMobileNavOpen(false)}
            className={`nav-link ${isActive(n.href) ? 'active' : ''}`}
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
    </>
  )

  return (
    <div className="flex min-h-dvh overflow-hidden bg-cream">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 min-w-60 bg-white border-r border-navy/10 flex-col py-4 px-3">
        {SidebarContent}
      </aside>

      {/* ── Mobile sidebar drawer ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-navy/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-navy/10 flex flex-col py-4 px-3 shadow-card2 animate-slide-in">
            <div className="flex items-center justify-between px-2 pb-4 mb-2 border-b border-navy/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-serif italic text-cream text-sm leading-none">T</span>
                </div>
                <div>
                  <div className="font-serif text-[15px] font-medium text-navy leading-none">TaxWise</div>
                  <div className="text-[10px] text-navy/30 mt-0.5">2025 tax year</div>
                </div>
              </div>
              <button
                aria-label="Close"
                className="btn-ghost px-2 py-2 text-navy/60 hover:text-navy"
                onClick={() => setMobileNavOpen(false)}
              >
                ✕
              </button>
            </div>
            {/* Nav + user area */}
            <div className="flex flex-col flex-1">
              <nav className="flex flex-col gap-0.5 flex-1">
                {NAV.map(n => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`nav-link ${isActive(n.href) ? 'active' : ''}`}
                  >
                    <span className="text-sm w-5 leading-none">{n.icon}</span>
                    <span>{n.label}</span>
                  </Link>
                ))}
              </nav>
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
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-cream">
        <div className="md:hidden sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-navy/10">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <button
              className="btn-ghost px-3 py-2 rounded-lg text-navy/70 hover:text-navy hover:bg-cream-2"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-navy rounded-lg flex items-center justify-center">
                <span className="font-serif italic text-cream text-sm leading-none">T</span>
              </div>
              <span className="font-serif text-[15px] text-navy">TaxWise</span>
            </div>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
