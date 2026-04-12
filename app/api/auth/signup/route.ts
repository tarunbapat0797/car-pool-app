import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/user'
import { signToken, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json()

    if (!name || !email || !phone || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return Response.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
    })

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone ?? '',
      role: user.role,
    })

    await setAuthCookie(token)

    return Response.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 })
  } catch (err) {
    console.error('Signup error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
