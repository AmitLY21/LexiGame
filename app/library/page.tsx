'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'

interface Word {
  id: string
  enWord: string
  heTranslationDefault: string
  exampleSentenceEn: string | null
  difficultyLevel: number
  stageId: number
  stageName: string
  userProgress?: {
    starRating: number
    notes: string | null
  }
}

export default function LibraryPage() {
  const [words, setWords] = useState<Word[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStages, setSelectedStages] = useState<number[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<number[]>([])
  const [selectedStarFilter, setSelectedStarFilter] = useState<'all' | 'weak' | 'medium' | 'strong'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [availableStages, setAvailableStages] = useState<{ id: number; nameHe: string }[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const wordsPerPage = 50

  useEffect(() => {
    fetch('/api/library')
      .then((res) => res.json())
      .then((data) => {
        setWords(data.words)
        setAvailableStages(data.stages)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    let filtered = [...words]

    // Filter by stages
    if (selectedStages.length > 0) {
      filtered = filtered.filter((word) => selectedStages.includes(word.stageId))
    }

    // Filter by difficulty
    if (selectedDifficulty.length > 0) {
      filtered = filtered.filter((word) => selectedDifficulty.includes(word.difficultyLevel))
    }

    // Filter by star rating
    if (selectedStarFilter !== 'all') {
      filtered = filtered.filter((word) => {
        const rating = word.userProgress?.starRating || 1
        switch (selectedStarFilter) {
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
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (word) =>
          word.enWord.toLowerCase().includes(query) ||
          word.heTranslationDefault.includes(query)
      )
    }

    setFilteredWords(filtered)
    setCurrentPage(1)
  }, [words, selectedStages, selectedDifficulty, selectedStarFilter, searchQuery])

  const updateStarRating = async (wordId: string, rating: number) => {
    try {
      await fetch('/api/words/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, starRating: rating }),
      })

      setWords((prev) =>
        prev.map((word) =>
          word.id === wordId
            ? {
                ...word,
                userProgress: {
                  starRating: rating,
                  notes: word.userProgress?.notes || null,
                },
              }
            : word
        )
      )
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

      setWords((prev) =>
        prev.map((word) =>
          word.id === wordId
            ? {
                ...word,
                userProgress: {
                  starRating: word.userProgress?.starRating || 1,
                  notes,
                },
              }
            : word
        )
      )
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const totalPages = Math.ceil(filteredWords.length / wordsPerPage)
  const startIndex = (currentPage - 1) * wordsPerPage
  const paginatedWords = filteredWords.slice(startIndex, startIndex + wordsPerPage)

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-primary mb-8">ספריית מילים</h1>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שלבים:
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableStages.map((stage) => (
                    <label key={stage.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStages([...selectedStages, stage.id])
                          } else {
                            setSelectedStages(selectedStages.filter((id) => id !== stage.id))
                          }
                        }}
                        className="ml-2"
                      />
                      <span className="text-sm">{stage.nameHe}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  רמת קושי:
                </label>
                <div className="space-y-2">
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
                      <span className="text-sm">
                        {level === 1 ? 'קל' : level === 2 ? 'בינוני' : 'קשה'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Star Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כוכבים:
                </label>
                <div className="space-y-2">
                  {(['all', 'weak', 'medium', 'strong'] as const).map((filter) => (
                    <label key={filter} className="flex items-center">
                      <input
                        type="radio"
                        name="starFilter"
                        checked={selectedStarFilter === filter}
                        onChange={() => setSelectedStarFilter(filter)}
                        className="ml-2"
                      />
                      <span className="text-sm">
                        {filter === 'all'
                          ? 'הכל'
                          : filter === 'weak'
                          ? 'חלש (1-2)'
                          : filter === 'medium'
                          ? 'בינוני (3)'
                          : 'חזק (4-5)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חיפוש:
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש מילה..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStages([])
                setSelectedDifficulty([])
                setSelectedStarFilter('all')
                setSearchQuery('')
              }}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              נקה מסננים
            </button>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-gray-600">
            נמצאו {filteredWords.length} מילים
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
                      שלב
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/stages/${word.stageId}`}
                          className="text-accent-teal hover:underline"
                        >
                          {word.stageName}
                        </Link>
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
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  הקודם
                </button>
                <span className="text-sm text-gray-600">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
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

