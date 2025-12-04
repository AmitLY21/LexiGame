import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
  displayName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validated.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'כתובת אימייל זו כבר רשומה במערכת' },
        { status: 400 }
      )
    }

    const user = await createUser(
      validated.email,
      validated.password,
      validated.displayName
    )

    // Create session (simplified - in production use proper session management)
    const response = NextResponse.json(
      { success: true, user: { id: user.id, email: user.email, displayName: user.displayName } },
      { status: 201 }
    )

    // Set a simple session cookie (in production, use secure session management)
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'שגיאה ביצירת חשבון' },
      { status: 500 }
    )
  }
}

