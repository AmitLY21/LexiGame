'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SummaryData {
  score: number
  accuracy: number
  roundsPlayed: number
  livesRemaining: number
  longestStreak: number
  incorrectWords: Array<{
    id: string
    enWord: string
    heTranslation: string
    stageId: number
  }>
  improvedWords: Array<{
    id: string
    enWord: string
    heTranslation: string
    stageId: number
  }>
}

export default function TriviaSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trivia/summary/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg">טוען...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!summary) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg">שגיאה בטעינת סיכום</div>
        </div>
      </ProtectedRoute>
    )
  }

  const getStatusMessage = () => {
    if (summary.accuracy >= 90) return 'מצוין! ביצועים מעולים!'
    if (summary.accuracy >= 70) return 'כל הכבוד! ביצועים טובים!'
    if (summary.accuracy >= 50) return 'לא רע, המשך להתאמן!'
    return 'המשך להתאמן ותשתפר!'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold text-primary mb-8 text-center">
            סיכום משחק
          </h1>

          {/* Score Card */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="text-6xl font-bold text-primary mb-4">
              {summary.score}
            </div>
            <div className="text-2xl text-gray-700 mb-2">הניקוד שלך</div>
            <div className="text-lg text-gray-600">{getStatusMessage()}</div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-accent-teal mb-2">
                {Math.round(summary.accuracy)}%
              </div>
              <div className="text-sm text-gray-600">דיוק</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-accent-orange mb-2">
                {summary.longestStreak}
              </div>
              <div className="text-sm text-gray-600">רצף נכון מקסימלי</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {summary.roundsPlayed}
              </div>
              <div className="text-sm text-gray-600">שאלות</div>
            </div>
          </div>

          {/* Incorrect Words */}
          {summary.incorrectWords.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-4">
                מילים שטעית בהן
              </h2>
              <div className="space-y-3">
                {summary.incorrectWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <span className="font-semibold english-text">
                        {word.enWord}
                      </span>
                      <span className="mx-2">-</span>
                      <span>{word.heTranslation}</span>
                    </div>
                    <Link
                      href={`/stages/${word.stageId}`}
                      className="text-accent-teal hover:underline text-sm"
                    >
                      לשלב
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improved Words */}
          {summary.improvedWords.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-4">
                מילים שהתחזקת בהן (עלו לך כוכבים)
              </h2>
              <div className="space-y-3">
                {summary.improvedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                  >
                    <div>
                      <span className="font-semibold english-text">
                        {word.enWord}
                      </span>
                      <span className="mx-2">-</span>
                      <span>{word.heTranslation}</span>
                    </div>
                    <Link
                      href={`/stages/${word.stageId}`}
                      className="text-accent-teal hover:underline text-sm"
                    >
                      לשלב
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/trivia/setup"
              className="flex-1 text-center bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              שחק שוב
            </Link>
            <Link
              href="/library"
              className="flex-1 text-center bg-accent-teal text-white py-4 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
            >
              גלה מילים חלשות בספרייה
            </Link>
            <Link
              href="/stages"
              className="flex-1 text-center bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              חזור לשלבים
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

