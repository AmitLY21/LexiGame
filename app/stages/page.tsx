'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Stage {
  id: number
  nameHe: string
  descriptionHe: string | null
  progress: number
  status: 'locked' | 'in_progress' | 'completed'
  totalWords: number
  wordsWithRating: number
}

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stages')
      .then((res) => res.json())
      .then((data) => {
        setStages(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'locked':
        return 'נעול'
      case 'completed':
        return 'הושלם'
      default:
        return 'בתהליך'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked':
        return 'bg-gray-200 text-gray-600'
      case 'completed':
        return 'bg-success text-white'
      default:
        return 'bg-accent-teal text-white'
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">שלבים במילון</h1>

          {loading ? (
            <div className="text-center py-12">טוען...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-primary">{stage.nameHe}</h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                        stage.status
                      )}`}
                    >
                      {getStatusLabel(stage.status)}
                    </span>
                  </div>

                  {stage.descriptionHe && (
                    <p className="text-gray-600 mb-4">{stage.descriptionHe}</p>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">התקדמות</span>
                      <span className="font-semibold">{Math.round(stage.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent-teal h-2 rounded-full transition-all"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stage.wordsWithRating} / {stage.totalWords} מילים
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/stages/${stage.id}`}
                      className="flex-1 text-center bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      לשלב
                    </Link>
                    {stage.status !== 'locked' && (
                      <Link
                        href={`/trivia/setup?stage=${stage.id}`}
                        className="flex-1 text-center bg-accent-teal text-white py-2 rounded-lg hover:bg-teal-600 transition-colors"
                      >
                        שחק טריוויה
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

