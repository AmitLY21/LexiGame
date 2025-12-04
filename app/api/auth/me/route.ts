import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    })

    if (!user) {
      const response = NextResponse.json({ user: null })
      response.cookies.delete('userId')
      return response
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

