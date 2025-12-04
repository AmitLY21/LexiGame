import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'לא מאומת' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName } = body

    await prisma.user.update({
      where: { id: userId },
      data: { displayName: displayName || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'שגיאה בעדכון חשבון' },
      { status: 500 }
    )
  }
}

