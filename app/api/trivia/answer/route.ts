import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, wordId, selectedIndex, correctIndex, timeTaken } = body

    const session = await prisma.triviaGameSession.findUnique({
      where: { id: sessionId },
      include: { rounds: true },
    })

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 })
    }

    const isCorrect = selectedIndex === correctIndex
    const currentRound = session.rounds.length + 1

    // Calculate score
    let scoreChange = 0
    if (isCorrect) {
      scoreChange = 10

      // Streak bonus (2+ consecutive correct)
      const recentRounds = session.rounds
        .slice(-1)
        .filter((r) => r.isCorrect)
      if (recentRounds.length >= 1) {
        scoreChange += 5 // Bonus for 2+ consecutive
      }
    } else {
      scoreChange = -5
    }

    const newScore = Math.max(0, session.score + scoreChange)
    const livesUsed = isCorrect
      ? session.livesUsed
      : session.livesUsed + 1

    // Create round
    await prisma.triviaRound.create({
      data: {
        gameSessionId: sessionId,
        wordId,
        isCorrect,
        timeTakenSeconds: timeTaken,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: correctIndex,
        roundNumber: currentRound,
      },
    })

    // Update session score and lives
    await prisma.triviaGameSession.update({
      where: { id: sessionId },
      data: {
        score: newScore,
        livesUsed,
      },
    })

    // Update word progress
    const existingProgress = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    })

    if (existingProgress) {
      let newRating = existingProgress.starRating
      let correctStreak = existingProgress.correctStreakForWord

      if (isCorrect) {
        correctStreak += 1
        if (existingProgress.starRating <= 2) {
          newRating = Math.min(5, existingProgress.starRating + 1)
        } else if (correctStreak >= 2) {
          newRating = Math.min(5, existingProgress.starRating + 1)
          correctStreak = 0 // Reset streak after upgrade
        }
      } else {
        correctStreak = 0
        if (existingProgress.starRating >= 3) {
          newRating = Math.max(1, existingProgress.starRating - 1)
        }
      }

      await prisma.userWordProgress.update({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        data: {
          starRating: newRating,
          correctCount: isCorrect
            ? existingProgress.correctCount + 1
            : existingProgress.correctCount,
          incorrectCount: isCorrect
            ? existingProgress.incorrectCount
            : existingProgress.incorrectCount + 1,
          lastAnswerResult: isCorrect ? 'correct' : 'incorrect',
          correctStreakForWord: correctStreak,
          lastSeenAt: new Date(),
        },
      })
    } else {
      // Create new progress
      await prisma.userWordProgress.create({
        data: {
          userId,
          wordId,
          starRating: isCorrect ? 3 : 2,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          lastAnswerResult: isCorrect ? 'correct' : 'incorrect',
          correctStreakForWord: isCorrect ? 1 : 0,
          lastSeenAt: new Date(),
        },
      })
    }

    // Check if game should end (lives exhausted or 15 rounds)
    const gameEnded =
      (session.livesConfigured !== 999 && livesUsed >= session.livesConfigured) ||
      currentRound >= 15

    if (gameEnded) {
      // Calculate accuracy
      const allRounds = await prisma.triviaRound.findMany({
        where: { gameSessionId: sessionId },
      })
      const correctCount = allRounds.filter((r) => r.isCorrect).length
      const accuracy = (correctCount / allRounds.length) * 100

      await prisma.triviaGameSession.update({
        where: { id: sessionId },
        data: {
          endedAt: new Date(),
          accuracy,
        },
      })

      // Update daily activity
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.userDailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          isActive: true,
          triviaGamesCount: {
            increment: 1,
          },
        },
        create: {
          userId,
          date: today,
          isActive: true,
          triviaGamesCount: 1,
        },
      })
    }

    return NextResponse.json({
      isCorrect,
      scoreChange,
      newScore,
      livesRemaining:
        session.livesConfigured === 999
          ? 999
          : session.livesConfigured - livesUsed,
      gameEnded,
    })
  } catch (error) {
    console.error('Error processing answer:', error)
    return NextResponse.json(
      { error: 'שגיאה בעיבוד תשובה' },
      { status: 500 }
    )
  }
}

