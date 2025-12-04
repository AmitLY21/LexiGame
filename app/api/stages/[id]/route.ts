import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const stageId = parseInt(params.id)

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        words: {
          include: {
            userProgress: {
              where: { userId },
            },
          },
          orderBy: { enWord: 'asc' },
        },
      },
    })

    if (!stage) {
      return NextResponse.json({ error: 'שלב לא נמצא' }, { status: 404 })
    }

    // Format response
    const formattedStage = {
      id: stage.id,
      nameHe: stage.nameHe,
      descriptionHe: stage.descriptionHe,
      words: stage.words.map((word) => ({
        id: word.id,
        enWord: word.enWord,
        heTranslationDefault: word.heTranslationDefault,
        exampleSentenceEn: word.exampleSentenceEn,
        difficultyLevel: word.difficultyLevel,
        userProgress: word.userProgress[0]
          ? {
              starRating: word.userProgress[0].starRating,
              notes: word.userProgress[0].notes,
            }
          : undefined,
      })),
    }

    return NextResponse.json(formattedStage)
  } catch (error) {
    console.error('Error fetching stage:', error)
    return NextResponse.json(
      { error: 'שגיאה בטעינת שלב' },
      { status: 500 }
    )
  }
}

