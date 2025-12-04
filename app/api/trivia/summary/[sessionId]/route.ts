import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const session = await prisma.triviaGameSession.findUnique({
      where: { id: params.sessionId },
      include: {
        rounds: {
          include: { word: { include: { stage: true } } },
          orderBy: { roundNumber: 'asc' },
        },
      },
    })

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 })
    }

    // Calculate longest streak
    let longestStreak = 0
    let currentStreak = 0
    for (const round of session.rounds) {
      if (round.isCorrect) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    // Get incorrect words
    const incorrectRounds = session.rounds.filter((r) => !r.isCorrect)
    const incorrectWords = incorrectRounds.map((r) => ({
      id: r.word.id,
      enWord: r.word.enWord,
      heTranslation: r.word.heTranslationDefault,
      stageId: r.word.stageId,
    }))

    // Get words that improved (check if star rating increased)
    const improvedWords: Array<{
      id: string
      enWord: string
      heTranslation: string
      stageId: number
    }> = []

    for (const round of session.rounds) {
      if (round.isCorrect) {
        const progress = await prisma.userWordProgress.findUnique({
          where: {
            userId_wordId: {
              userId,
              wordId: round.wordId,
            },
          },
        })

        // If word had rating <= 2 and now has higher, it improved
        // This is a simplified check - in reality we'd track before/after
        if (progress && progress.starRating >= 3) {
          improvedWords.push({
            id: round.word.id,
            enWord: round.word.enWord,
            heTranslation: round.word.heTranslationDefault,
            stageId: round.word.stageId,
          })
        }
      }
    }

    return NextResponse.json({
      score: session.score,
      accuracy: session.accuracy || 0,
      roundsPlayed: session.rounds.length,
      livesRemaining:
        session.livesConfigured === 999
          ? 999
          : session.livesConfigured - session.livesUsed,
      longestStreak,
      incorrectWords,
      improvedWords: improvedWords.slice(0, 10), // Limit to 10
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת סיכום' },
      { status: 500 }
    )
  }
}

