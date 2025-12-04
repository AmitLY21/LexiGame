import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const body = await request.json()
    const {
      wordSource,
      selectedStages,
      selectedDifficulty,
      starFilter,
      lives,
      feedbackLanguage,
    } = body

    // Get eligible words
    let where: any = {}

    if (wordSource === 'stages' && selectedStages?.length > 0) {
      where.stageId = { in: selectedStages }
    } else if (wordSource === 'difficulty' && selectedDifficulty?.length > 0) {
      where.difficultyLevel = { in: selectedDifficulty }
    }

    const words = await prisma.word.findMany({
      where,
      include: {
        userProgress: {
          where: { userId },
        },
      },
    })

    // Filter by star rating
    let eligibleWords = words.filter((word) => {
      const rating = word.userProgress[0]?.starRating || 1
      if (starFilter.weak && rating <= 2) return true
      if (starFilter.medium && rating === 3) return true
      if (starFilter.strong && rating >= 4) return true
      return false
    })

    if (eligibleWords.length < 15) {
      return NextResponse.json(
        { error: 'לא מספיק מילים זמינות. נא לבחור הגדרות אחרות.' },
        { status: 400 }
      )
    }

    // Shuffle and select 15 words
    const shuffled = eligibleWords.sort(() => Math.random() - 0.5)
    const selectedWords = shuffled.slice(0, 15)

    // Create game session
    const session = await prisma.triviaGameSession.create({
      data: {
        userId,
        livesConfigured: lives === 999 ? 999 : lives,
        settingsStages: JSON.stringify(selectedStages || []),
        settingsDifficultyLevels: JSON.stringify(selectedDifficulty || []),
        settingsStarFilters: JSON.stringify(starFilter),
        feedbackLanguage: feedbackLanguage || 'he',
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating trivia session:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת משחק' },
      { status: 500 }
    )
  }
}

