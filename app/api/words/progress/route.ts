import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const body = await request.json()
    const { wordId, starRating, notes } = body

    if (!wordId) {
      return NextResponse.json({ error: 'wordId נדרש' }, { status: 400 })
    }

    // Get or create user progress
    const existing = await prisma.userWordProgress.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    })

    const updateData: any = {
      lastSeenAt: new Date(),
    }

    if (starRating !== undefined) {
      updateData.starRating = Math.max(1, Math.min(5, starRating))
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (existing) {
      await prisma.userWordProgress.update({
        where: {
          userId_wordId: {
            userId,
            wordId,
          },
        },
        data: updateData,
      })
    } else {
      await prisma.userWordProgress.create({
        data: {
          userId,
          wordId,
          starRating: starRating || 1,
          notes: notes || '',
          ...updateData,
        },
      })
    }

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
        wordsInteractedCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: today,
        isActive: true,
        wordsInteractedCount: 1,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating word progress:', error)
    return NextResponse.json(
      { error: 'שגיאה בעדכון התקדמות' },
      { status: 500 }
    )
  }
}

