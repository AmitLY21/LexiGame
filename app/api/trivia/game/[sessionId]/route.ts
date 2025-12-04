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
          include: { word: true },
          orderBy: { roundNumber: 'asc' },
        },
      },
    })

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 })
    }

    // Get all words from stages/difficulty settings
    let where: any = {}

    if (session.settingsStages) {
      const stages = JSON.parse(session.settingsStages)
      if (stages.length > 0) {
        where.stageId = { in: stages }
      }
    } else if (session.settingsDifficultyLevels) {
      const difficulties = JSON.parse(session.settingsDifficultyLevels)
      if (difficulties.length > 0) {
        where.difficultyLevel = { in: difficulties }
      }
    }

    const allWords = await prisma.word.findMany({
      where,
      include: {
        userProgress: {
          where: { userId },
        },
      },
    })

    // Filter by star rating
    const starFilter = session.settingsStarFilters
      ? JSON.parse(session.settingsStarFilters)
      : { weak: true, medium: true, strong: false }

    let eligibleWords = allWords.filter((word) => {
      const rating = word.userProgress[0]?.starRating || 1
      if (starFilter.weak && rating <= 2) return true
      if (starFilter.medium && rating === 3) return true
      if (starFilter.strong && rating >= 4) return true
      return false
    })

    // Get words for current round (round number = rounds.length + 1)
    const currentRound = session.rounds.length + 1

    if (currentRound > 15) {
      // Game completed
      return NextResponse.json({
        session,
        currentRound: 15,
        gameCompleted: true,
      })
    }

    // Select a word that hasn't been used yet
    const usedWordIds = session.rounds.map((r) => r.wordId)
    const availableWords = eligibleWords.filter(
      (w) => !usedWordIds.includes(w.id)
    )

    if (availableWords.length === 0) {
      return NextResponse.json({
        session,
        currentRound: 15,
        gameCompleted: true,
      })
    }

    // Randomly select a word
    const selectedWord =
      availableWords[Math.floor(Math.random() * availableWords.length)]

    // Get 3 other random words as distractors
    const otherWords = eligibleWords
      .filter((w) => w.id !== selectedWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Create options (1 correct + 3 distractors)
    const options = [
      selectedWord.heTranslationDefault,
      ...otherWords.map((w) => w.heTranslationDefault),
    ].sort(() => Math.random() - 0.5)

    const correctIndex = options.indexOf(selectedWord.heTranslationDefault)

    return NextResponse.json({
      session,
      currentRound,
      word: {
        id: selectedWord.id,
        enWord: selectedWord.enWord,
        exampleSentenceEn: selectedWord.exampleSentenceEn,
      },
      options,
      correctIndex,
      gameCompleted: false,
    })
  } catch (error) {
    console.error('Error fetching game round:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת משחק' },
      { status: 500 }
    )
  }
}

