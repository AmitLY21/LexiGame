'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Word {
  id: string
  enWord: string
  heTranslationDefault: string
  exampleSentenceEn: string | null
  difficultyLevel: number
  userProgress?: {
    starRating: number
    notes: string | null
  }
}

interface Stage {
  id: number
  nameHe: string
  descriptionHe: string | null
  words: Word[]
}

export default function StageDetailPage() {
  const params = useParams()
  const stageId = params.id as string
  const [stage, setStage] = useState<Stage | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'weak' | 'medium' | 'strong'>('all')
  const [sortBy, setSortBy] = useState<'rating' | 'word'>('rating')
  const [currentPage, setCurrentPage] = useState(1)
  const wordsPerPage = 50

  useEffect(() => {
    fetch(`/api/stages/${stageId}`)
      .then((res) => res.json())
      .then((data) => {
        setStage(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [stageId])

  const updateStarRating = async (wordId: string, rating: number) => {
    try {
      await fetch('/api/words/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, starRating: rating }),
      })

      // Update local state
      if (stage) {
        setStage({
          ...stage,
          words: stage.words.map((word) =>
            word.id === wordId
              ? {
                  ...word,
                  userProgress: {
                    starRating: rating,
                    notes: word.userProgress?.notes || null,
                  },
                }
              : word
          ),
        })
      }
    } catch (error) {
      console.error('Error updating star rating:', error)
    }
  }

  const updateNotes = async (wordId: string, notes: string) => {
    try {
      await fetch('/api/words/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, notes }),
      })

      // Update local state
      if (stage) {
        setStage({
          ...stage,
          words: stage.words.map((word) =>
            word.id === wordId
              ? {
                  ...word,
                  userProgress: {
                    starRating: word.userProgress?.starRating || 1,
                    notes,
                  },
                }
              : word
          ),
        })
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

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

  if (!stage) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">שלב לא נמצא</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Filter and sort words
  let filteredWords = stage.words.filter((word) => {
    const rating = word.userProgress?.starRating || 1
    switch (filter) {
      case 'weak':
        return rating <= 2
      case 'medium':
        return rating === 3
      case 'strong':
        return rating >= 4
      default:
        return true
    }
  })

  filteredWords.sort((a, b) => {
    if (sortBy === 'rating') {
      const ratingA = a.userProgress?.starRating || 1
      const ratingB = b.userProgress?.starRating || 1
      return ratingA - ratingB
    } else {
      return a.enWord.localeCompare(b.enWord)
    }
  })

  // Pagination
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage)
  const startIndex = (currentPage - 1) * wordsPerPage
  const paginatedWords = filteredWords.slice(startIndex, startIndex + wordsPerPage)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/stages"
              className="text-accent-teal hover:underline mb-2 inline-block"
            >
              ← חזרה לשלבים
            </Link>
            <h1 className="text-3xl font-bold text-primary">{stage.nameHe}</h1>
            {stage.descriptionHe && (
              <p className="text-gray-600 mt-2">{stage.descriptionHe}</p>
            )}
          </div>

          {/* Filters and Sort */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סינון לפי כוכבים:
                </label>
                <div className="flex gap-2">
                  {(['all', 'weak', 'medium', 'strong'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f)
                        setCurrentPage(1)
                      }}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        filter === f
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {f === 'all'
                        ? 'הכל'
                        : f === 'weak'
                        ? 'חלש (1-2)'
                        : f === 'medium'
                        ? 'בינוני (3)'
                        : 'חזק (4-5)'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מיון:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'rating' | 'word')
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="rating">לפי כוכבים (חלש ראשון)</option>
                  <option value="word">לפי מילה (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Words Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      כוכבים
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      מילה באנגלית
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      תרגום לעברית
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      דוגמה
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      הערות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWords.map((word, idx) => (
                    <tr
                      key={word.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const currentRating = word.userProgress?.starRating || 1
                            return (
                              <button
                                key={star}
                                onClick={() => updateStarRating(word.id, star)}
                                className="text-2xl focus:outline-none"
                                aria-label={`כוכב ${star}`}
                              >
                                {star <= currentRating ? '⭐' : '☆'}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold english-text">
                        {word.enWord}
                      </td>
                      <td className="px-4 py-3">{word.heTranslationDefault}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 english-text">
                        {word.exampleSentenceEn || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={word.userProgress?.notes || ''}
                          onChange={(e) => updateNotes(word.id, e.target.value)}
                          onBlur={(e) => updateNotes(word.id, e.target.value)}
                          placeholder="הוסף הערה..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הקודם
                </button>
                <span className="text-sm text-gray-600">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

