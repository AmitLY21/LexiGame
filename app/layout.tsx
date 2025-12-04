import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-provider'

export const metadata: Metadata = {
  title: 'LexiPlay - למדו אוצר מילים באנגלית',
  description: 'למדו אוצר מילים באנגלית בצורה משחקית',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

