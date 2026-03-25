import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'TaxWise — Keep more of what you earn',
    template: '%s — TaxWise',
  },
  description:
    'AI-powered tax optimization. Track income & expenses, get personalized IRA recommendations, and ask how any financial decision impacts your tax bill.',
  keywords: [
    'tax optimization', 'IRA calculator', 'tax deductions',
    'personal finance', 'Roth IRA', 'Traditional IRA', 'tax advisor', '2025 taxes',
  ],
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: 'TaxWise — Keep more of what you earn',
    description: 'AI-powered tax optimization for 2025',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaxWise — Keep more of what you earn',
    description: 'AI-powered tax optimization for 2025',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream text-navy antialiased">
        {children}
      </body>
    </html>
  )
}
