'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'
import { useState } from 'react'

export default function Navbar() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  if (!user) {
    return (
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              LexiPlay
            </Link>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-primary hover:underline"
              >
                התחברות
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                הרשמה
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            LexiPlay
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">
              לוח מחוונים
            </Link>
            <Link href="/stages" className="text-gray-700 hover:text-primary">
              שלבים
            </Link>
            <Link href="/library" className="text-gray-700 hover:text-primary">
              ספריית מילים
            </Link>
            <Link href="/trivia/setup" className="text-gray-700 hover:text-primary">
              טריוויה
            </Link>
            <Link href="/stats" className="text-gray-700 hover:text-primary">
              סטטיסטיקה
            </Link>
            <Link href="/account" className="text-gray-700 hover:text-primary">
              הגדרות
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:underline"
              >
                התנתק
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="תפריט"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 pb-4">
            <Link
              href="/dashboard"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              לוח מחוונים
            </Link>
            <Link
              href="/stages"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              שלבים
            </Link>
            <Link
              href="/library"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              ספריית מילים
            </Link>
            <Link
              href="/trivia/setup"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              טריוויה
            </Link>
            <Link
              href="/stats"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              סטטיסטיקה
            </Link>
            <Link
              href="/account"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              הגדרות
            </Link>
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">
                {user.displayName || user.email}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                התנתק
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

