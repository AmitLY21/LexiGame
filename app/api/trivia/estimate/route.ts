import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const body = await request.json()
    const { wordSource, selectedStages, selectedDifficulty, starFilter } = body

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
    const filtered = words.filter((word) => {
      const rating = word.userProgress[0]?.starRating || 1
      if (starFilter.weak && rating <= 2) return true
      if (starFilter.medium && rating === 3) return true
      if (starFilter.strong && rating >= 4) return true
      return false
    })

    return NextResponse.json({ count: filtered.length })
  } catch (error) {
    console.error('Error estimating words:', error)
    return NextResponse.json({ count: 0 })
  }
}

