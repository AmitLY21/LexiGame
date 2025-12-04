import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, updateUserLastLogin } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'נא להזין סיסמה'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const user = await getUserByEmail(validated.email)
    if (!user) {
      return NextResponse.json(
        { error: 'כתובת אימייל או סיסמה שגויים' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(validated.password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'כתובת אימייל או סיסמה שגויים' },
        { status: 401 }
      )
    }

    await updateUserLastLogin(user.id)

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      },
      { status: 200 }
    )

    // Set session cookie
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
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    )
  }
}

