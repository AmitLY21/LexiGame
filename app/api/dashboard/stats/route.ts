import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    // Get user's word progress
    const userProgress = await prisma.userWordProgress.findMany({
      where: { userId },
      include: { word: true },
    })

    const knownWords = userProgress.filter((p) => p.starRating >= 4).length
    const weakWords = userProgress.filter((p) => p.starRating <= 2).length
    const totalWords = userProgress.length

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

    const completedStages = stages.filter((stage) => {
      const wordsWithRating = stage.words.filter((word) => {
        const progress = word.userProgress[0]
        return progress && progress.starRating >= 3
      })
      return wordsWithRating.length >= stage.words.length * 0.6
    }).length

    // Get last accessed stage
    const lastStageProgress = await prisma.userWordProgress.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      include: { word: { include: { stage: true } } },
    })

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

    return NextResponse.json({
      totalWords,
      knownWords,
      weakWords,
      completedStages,
      currentStreak,
      lastStage: lastStageProgress?.word.stage
        ? {
            id: lastStageProgress.word.stage.id,
            nameHe: lastStageProgress.word.stage.nameHe,
          }
        : undefined,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת נתונים' },
      { status: 500 }
    )
  }
}

