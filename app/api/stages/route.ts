import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

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

    const result = stages.map((stage, index) => {
      const wordsWithRating = stage.words.filter((word) => {
        const progress = word.userProgress[0]
        return progress && progress.starRating >= 3
      }).length

      const progress = stage.words.length > 0
        ? (wordsWithRating / stage.words.length) * 100
        : 0

      let status: 'locked' | 'in_progress' | 'completed' = 'locked'

      if (index === 0) {
        // Stage 1 is always unlocked
        status = progress >= 60 ? 'completed' : 'in_progress'
      } else {
        // Check if previous stage is completed
        const prevStage = stages[index - 1]
        const prevWordsWithRating = prevStage.words.filter((word) => {
          const progress = word.userProgress[0]
          return progress && progress.starRating >= 3
        }).length
        const prevProgress = prevStage.words.length > 0
          ? (prevWordsWithRating / prevStage.words.length) * 100
          : 0

        if (prevProgress >= 60) {
          status = progress >= 60 ? 'completed' : 'in_progress'
        }
      }

      return {
        id: stage.id,
        nameHe: stage.nameHe,
        descriptionHe: stage.descriptionHe,
        progress,
        status,
        totalWords: stage.words.length,
        wordsWithRating,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת שלבים' },
      { status: 500 }
    )
  }
}

