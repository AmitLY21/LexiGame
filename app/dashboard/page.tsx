'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-provider'

interface DashboardStats {
  totalWords: number
  knownWords: number
  weakWords: number
  completedStages: number
  currentStreak: number
  lastStage?: { id: number; nameHe: string }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">
            שלום, {user?.displayName || user?.email}
          </h1>

          {loading ? (
            <div className="text-center py-12">טוען...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary mb-4">
                  המשך מאיפה שהפסקת
                </h2>
                {stats?.lastStage ? (
                  <Link
                    href={`/stages/${stats.lastStage.id}`}
                    className="block text-accent-teal hover:underline mb-2"
                  >
                    {stats.lastStage.nameHe}
                  </Link>
                ) : (
                  <Link
                    href="/stages/1"
                    className="block text-accent-teal hover:underline mb-2"
                  >
                    התחל בשלב 1
                  </Link>
                )}
                <Link
                  href="/trivia/setup"
                  className="block text-accent-teal hover:underline"
                >
                  משחק טריוויה מהיר
                </Link>
              </div>

              {/* Overall Progress */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary mb-4">
                  התקדמות כללית
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">מילים חזקות</span>
                      <span className="text-sm font-semibold">
                        {stats?.knownWords || 0}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">מילים חלשות</span>
                      <span className="text-sm font-semibold">
                        {stats?.weakWords || 0}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">שלבים שהושלמו</span>
                      <span className="text-sm font-semibold">
                        {stats?.completedStages || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-primary mb-4">
                  רצף יומי
                </h2>
                <div className="text-3xl font-bold text-accent-orange mb-2">
                  {stats?.currentStreak || 0} ימים
                </div>
                <p className="text-sm text-gray-600">
                  המשך ללמוד כדי לשמור על הרצף!
                </p>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/stages"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-primary mb-2">שלבים במילון</h3>
              <p className="text-gray-600">
                עיין בכל השלבים והתקדם בלימוד אוצר המילים
              </p>
            </Link>

            <Link
              href="/stats"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-primary mb-2">סטטיסטיקה מפורטת</h3>
              <p className="text-gray-600">
                צפה בהתקדמות שלך, גרפים וניתוחים מפורטים
              </p>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

