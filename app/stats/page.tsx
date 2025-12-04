'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StatsData {
  summary: {
    totalWords: number
    knownWords: number
    weakWords: number
    completedStages: number
    currentStreak: number
  }
  stageProgress: Array<{
    stageId: number
    stageName: string
    progress: number
  }>
  triviaHistory: Array<{
    date: string
    score: number
    accuracy: number
  }>
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">טוען...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!stats) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">שגיאה בטעינת נתונים</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">סטטיסטיקה</h1>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm text-gray-600 mb-2">מילים חזקות</h3>
              <div className="text-3xl font-bold text-success">
                {stats.summary.knownWords}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm text-gray-600 mb-2">מילים חלשות</h3>
              <div className="text-3xl font-bold text-error">
                {stats.summary.weakWords}
              </div>
              <Link
                href="/library?filter=weak"
                className="text-sm text-accent-teal hover:underline mt-2 inline-block"
              >
                צפה במילים חלשות →
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm text-gray-600 mb-2">שלבים שהושלמו</h3>
              <div className="text-3xl font-bold text-primary">
                {stats.summary.completedStages}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm text-gray-600 mb-2">רצף יומי</h3>
              <div className="text-3xl font-bold text-accent-orange">
                {stats.summary.currentStreak}
              </div>
            </div>
          </div>

          {/* Stage Progress Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-primary mb-6">
              התקדמות בשלבים
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.stageProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stageName" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="progress"
                  fill="#14b8a6"
                  onClick={(data) => {
                    if (data.stageId) {
                      window.location.href = `/stages/${data.stageId}`
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trivia Performance Chart */}
          {stats.triviaHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-primary mb-6">
                ביצועים במשחקי טריוויה
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.triviaHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1e3a8a"
                    name="ניקוד"
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#14b8a6"
                    name="דיוק (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

