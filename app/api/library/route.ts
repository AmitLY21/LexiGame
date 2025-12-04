import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const words = await prisma.word.findMany({
      include: {
        stage: true,
        userProgress: {
          where: { userId },
        },
      },
      orderBy: { enWord: 'asc' },
    })

    const stages = await prisma.stage.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    const formattedWords = words.map((word) => ({
      id: word.id,
      enWord: word.enWord,
      heTranslationDefault: word.heTranslationDefault,
      exampleSentenceEn: word.exampleSentenceEn,
      difficultyLevel: word.difficultyLevel,
      stageId: word.stageId,
      stageName: word.stage.nameHe,
      userProgress: word.userProgress[0]
        ? {
            starRating: word.userProgress[0].starRating,
            notes: word.userProgress[0].notes,
          }
        : undefined,
    }))

    return NextResponse.json({
      words: formattedWords,
      stages: stages.map((s) => ({ id: s.id, nameHe: s.nameHe })),
    })
  } catch (error) {
    console.error('Error fetching library:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת ספרייה' },
      { status: 500 }
    )
  }
}

