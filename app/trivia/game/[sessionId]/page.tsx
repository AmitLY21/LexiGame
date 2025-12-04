'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useParams, useRouter } from 'next/navigation'

interface GameState {
  currentRound: number
  word: { id: string; enWord: string; exampleSentenceEn: string | null }
  options: string[]
  correctIndex: number
  score: number
  livesRemaining: number
  gameCompleted: boolean
}

export default function TriviaGamePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadRound()
  }, [sessionId])

  useEffect(() => {
    if (!gameState || gameState.gameCompleted || selectedIndex !== null) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, selectedIndex])

  const loadRound = async () => {
    try {
      const res = await fetch(`/api/trivia/game/${sessionId}`)
      const data = await res.json()

      if (data.gameCompleted) {
        router.push(`/trivia/summary/${sessionId}`)
        return
      }

      setGameState({
        currentRound: data.currentRound,
        word: data.word,
        options: data.options,
        correctIndex: data.correctIndex,
        score: data.session.score,
        livesRemaining:
          data.session.livesConfigured === 999
            ? 999
            : data.session.livesConfigured - data.session.livesUsed,
        gameCompleted: false,
      })
      setSelectedIndex(null)
      setTimeLeft(15)
      setFeedback(null)
      setLoading(false)
    } catch (error) {
      console.error('Error loading round:', error)
      setLoading(false)
    }
  }

  const handleTimeout = async () => {
    if (selectedIndex !== null || !gameState) return

    setSelectedIndex(-1) // -1 means timeout
    setSubmitting(true)

    const startTime = Date.now()
    const timeTaken = 15 - timeLeft

    const res = await fetch('/api/trivia/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        wordId: gameState.word.id,
        selectedIndex: -1,
        correctIndex: gameState.correctIndex,
        timeTaken,
      }),
    })

    const result = await res.json()
    setFeedback(
      result.isCorrect
        ? 'נכון! מעולה!'
        : `נגמר הזמן. התשובה הנכונה: ${gameState.options[gameState.correctIndex]}`
    )

    setTimeout(() => {
      if (result.gameEnded) {
        router.push(`/trivia/summary/${sessionId}`)
      } else {
        loadRound()
      }
    }, 2000)
  }

  const handleAnswer = async (index: number) => {
    if (selectedIndex !== null || !gameState) return

    setSelectedIndex(index)
    setSubmitting(true)

    const timeTaken = 15 - timeLeft
    const isCorrect = index === gameState.correctIndex

    const res = await fetch('/api/trivia/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        wordId: gameState.word.id,
        selectedIndex: index,
        correctIndex: gameState.correctIndex,
        timeTaken,
      }),
    })

    const result = await res.json()

    setGameState({
      ...gameState,
      score: result.newScore,
      livesRemaining: result.livesRemaining,
    })

    setFeedback(
      isCorrect
        ? `נכון! +${result.scoreChange} נקודות`
        : `טעות. התשובה הנכונה: ${gameState.options[gameState.correctIndex]}`
    )

    setTimeout(() => {
      if (result.gameEnded) {
        router.push(`/trivia/summary/${sessionId}`)
      } else {
        loadRound()
      }
    }, 2000)
  }

  if (loading || !gameState) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg">טוען משחק...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Top Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">
                שאלה {gameState.currentRound} / 15
              </div>
              <div className="text-lg font-semibold text-primary">
                ניקוד: {gameState.score}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {gameState.livesRemaining !== 999 &&
                  Array.from({ length: gameState.livesRemaining }).map((_, i) => (
                    <span key={i} className="text-2xl">
                      ❤️
                    </span>
                  ))}
              </div>
              <div
                className={`text-2xl font-bold ${
                  timeLeft <= 5 ? 'text-accent-orange' : 'text-primary'
                }`}
              >
                {timeLeft}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 english-text">
              {gameState.word.enWord}
            </h2>
            {gameState.word.exampleSentenceEn && (
              <p className="text-gray-600 mb-6 english-text text-sm">
                {gameState.word.exampleSentenceEn}
              </p>
            )}
            <p className="text-lg text-gray-700 mb-8">בחר את התרגום הנכון</p>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {gameState.options.map((option, index) => {
                let buttonClass =
                  'w-full p-6 rounded-lg text-lg font-semibold transition-all border-2 '
                let isDisabled = selectedIndex !== null

                if (selectedIndex !== null) {
                  if (index === gameState.correctIndex) {
                    buttonClass += 'bg-success text-white border-success'
                  } else if (index === selectedIndex && index !== gameState.correctIndex) {
                    buttonClass += 'bg-error text-white border-error'
                  } else {
                    buttonClass += 'bg-gray-200 text-gray-600 border-gray-300'
                  }
                } else {
                  buttonClass +=
                    'bg-white text-primary border-primary hover:bg-primary hover:text-white cursor-pointer'
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={isDisabled}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`p-4 rounded-lg ${
                  selectedIndex === gameState.correctIndex
                    ? 'bg-success text-white'
                    : 'bg-error text-white'
                }`}
              >
                {feedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

