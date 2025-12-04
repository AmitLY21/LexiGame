import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    // Get summary stats
    const userProgress = await prisma.userWordProgress.findMany({
      where: { userId },
    })

    const knownWords = userProgress.filter((p) => p.starRating >= 4).length
    const weakWords = userProgress.filter((p) => p.starRating <= 2).length

    // Get stages progress
    const stages = await prisma.stage.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        words: {
          include: {
            userProgress: {
              where: { userId },
            },
          },
        },
      },
    })

    const stageProgress = stages.map((stage) => {
      const wordsWithRating = stage.words.filter((word) => {
        const progress = word.userProgress[0]
        return progress && progress.starRating >= 3
      }).length
      const progress = stage.words.length > 0
        ? (wordsWithRating / stage.words.length) * 100
        : 0

      return {
        stageId: stage.id,
        stageName: stage.nameHe,
        progress: Math.round(progress),
      }
    })

    const completedStages = stageProgress.filter((s) => s.progress >= 60).length

    // Get daily streak
    const dailyActivities = await prisma.userDailyActivity.findMany({
      where: { userId, isActive: true },
      orderBy: { date: 'desc' },
    })

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < dailyActivities.length; i++) {
      const activityDate = new Date(dailyActivities[i].date)
      activityDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor(
        (today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === i) {
        currentStreak++
      } else {
        break
      }
    }

    // Get trivia history (last 10 games)
    const triviaSessions = await prisma.triviaGameSession.findMany({
      where: {
        userId,
        endedAt: { not: null },
      },
      orderBy: { endedAt: 'desc' },
      take: 10,
    })

    const triviaHistory = triviaSessions
      .reverse()
      .map((session) => ({
        date: formatDate(session.endedAt!),
        score: session.score,
        accuracy: session.accuracy || 0,
      }))

    return NextResponse.json({
      summary: {
        totalWords: userProgress.length,
        knownWords,
        weakWords,
        completedStages,
        currentStreak,
      },
      stageProgress,
      triviaHistory,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת סטטיסטיקה' },
      { status: 500 }
    )
  }
}

