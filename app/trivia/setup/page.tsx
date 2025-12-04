'use client'

import { useEffect, useState, Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter, useSearchParams } from 'next/navigation'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface Stage {
  id: number
  nameHe: string
}

export default function TriviaSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [stages, setStages] = useState<Stage[]>([])
  const [wordSource, setWordSource] = useState<'stages' | 'difficulty'>('stages')
  const [selectedStages, setSelectedStages] = useState<number[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<number[]>([])
  const [starFilter, setStarFilter] = useState({
    weak: true,
    medium: true,
    strong: false,
  })
  const [lives, setLives] = useState(3)
  const [feedbackLanguage, setFeedbackLanguage] = useState<'he' | 'en'>('he')
  const [estimatedWords, setEstimatedWords] = useState(0)

  useEffect(() => {
    const stageParam = searchParams.get('stage')
    if (stageParam) {
      setSelectedStages([parseInt(stageParam)])
    }

    fetch('/api/stages')
      .then((res) => res.json())
      .then((data) => {
        setStages(data)
      })
  }, [searchParams])

  useEffect(() => {
    // Estimate word pool size
    fetch('/api/trivia/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wordSource,
        selectedStages,
        selectedDifficulty,
        starFilter,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setEstimatedWords(data.count)
      })
  }, [wordSource, selectedStages, selectedDifficulty, starFilter])

  const handleStart = async () => {
    // Validate at least one star filter is selected
    if (!starFilter.weak && !starFilter.medium && !starFilter.strong) {
      alert('נא לבחור לפחות סינון אחד של כוכבים')
      return
    }

    if (wordSource === 'stages' && selectedStages.length === 0) {
      alert('נא לבחור לפחות שלב אחד')
      return
    }

    if (wordSource === 'difficulty' && selectedDifficulty.length === 0) {
      alert('נא לבחור לפחות רמת קושי אחת')
      return
    }

    // Create game session
    const res = await fetch('/api/trivia/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wordSource,
        selectedStages,
        selectedDifficulty,
        starFilter,
        lives,
        feedbackLanguage,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      router.push(`/trivia/game/${data.sessionId}`)
    } else {
      alert(data.error || 'שגיאה ביצירת משחק')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-bold text-primary mb-8">הגדרות משחק טריוויה</h1>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Word Source */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                מקור מילים / רמת קושי:
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wordSource"
                    value="stages"
                    checked={wordSource === 'stages'}
                    onChange={() => {
                      setWordSource('stages')
                      setSelectedDifficulty([])
                    }}
                    className="ml-2"
                  />
                  <span>לפי שלבים</span>
                </label>
                {wordSource === 'stages' && (
                  <div className="mr-8 space-y-2 max-h-60 overflow-y-auto">
                    {stages.map((stage) => (
                      <label key={stage.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedStages.includes(stage.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStages([...selectedStages, stage.id])
                            } else {
                              setSelectedStages(
                                selectedStages.filter((id) => id !== stage.id)
                              )
                            }
                          }}
                          className="ml-2"
                        />
                        <span>{stage.nameHe}</span>
                      </label>
                    ))}
                  </div>
                )}

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="wordSource"
                    value="difficulty"
                    checked={wordSource === 'difficulty'}
                    onChange={() => {
                      setWordSource('difficulty')
                      setSelectedStages([])
                    }}
                    className="ml-2"
                  />
                  <span>לפי רמת קושי</span>
                </label>
                {wordSource === 'difficulty' && (
                  <div className="mr-8 space-y-2">
                    {[1, 2, 3].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDifficulty.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDifficulty([...selectedDifficulty, level])
                            } else {
                              setSelectedDifficulty(
                                selectedDifficulty.filter((id) => id !== level)
                              )
                            }
                          }}
                          className="ml-2"
                        />
                        <span>{level === 1 ? 'קל' : level === 2 ? 'בינוני' : 'קשה'}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Star Rating Filter */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                סינון לפי כוכבים:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={starFilter.weak}
                    onChange={(e) =>
                      setStarFilter({ ...starFilter, weak: e.target.checked })
                    }
                    className="ml-2"
                  />
                  <span>התמקד במילים חלשות (1–2 כוכבים)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={starFilter.medium}
                    onChange={(e) =>
                      setStarFilter({ ...starFilter, medium: e.target.checked })
                    }
                    className="ml-2"
                  />
                  <span>מילים בינוניות (3 כוכבים)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={starFilter.strong}
                    onChange={(e) =>
                      setStarFilter({ ...starFilter, strong: e.target.checked })
                    }
                    className="ml-2"
                  />
                  <span>מילים חזקות (4–5 כוכבים)</span>
                </label>
              </div>
            </div>

            {/* Lives */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                מספר חיים:
              </label>
              <div className="flex gap-4">
                {[1, 3, 999].map((lifeCount) => (
                  <label key={lifeCount} className="flex items-center">
                    <input
                      type="radio"
                      name="lives"
                      checked={lives === lifeCount}
                      onChange={() => setLives(lifeCount)}
                      className="ml-2"
                    />
                    <span>{lifeCount === 999 ? 'ללא הגבלה' : `${lifeCount} חיים`}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Feedback Language */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                שפת משוב:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="feedbackLanguage"
                    value="he"
                    checked={feedbackLanguage === 'he'}
                    onChange={() => setFeedbackLanguage('he')}
                    className="ml-2"
                  />
                  <span>הסברים בעברית</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="feedbackLanguage"
                    value="en"
                    checked={feedbackLanguage === 'en'}
                    onChange={() => setFeedbackLanguage('en')}
                    className="ml-2"
                  />
                  <span>הסברים באנגלית פשוטה</span>
                </label>
              </div>
            </div>

            {/* Scoring Rules */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">חוקי ניקוד:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>תשובה נכונה = +10 נקודות</li>
                <li>טעות = -5 נקודות ואיבוד חיים (אם רלוונטי)</li>
                <li>בונוס רצף: +5 לכל תשובה שנייה רצופה נכונה ומעלה</li>
              </ul>
            </div>

            {/* Estimated Words */}
            <div className="text-center text-gray-600">
              כ ~{estimatedWords} מילים אפשריות
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors"
            >
              התחל משחק
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

