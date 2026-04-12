import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/user'
import { getCurrentUser, signToken, setAuthCookie } from '@/lib/auth'

/** PATCH /api/users/me — update name and/or phone */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, phone } = await req.json()

    if (!name?.trim() && !phone?.trim()) {
      return Response.json({ error: 'Provide at least one field to update' }, { status: 400 })
    }

    await connectDB()

    const update: Record<string, string> = {}
    if (name?.trim()) update.name = name.trim()
    if (phone?.trim()) update.phone = phone.trim()

    const updated = await User.findByIdAndUpdate(
      user.userId,
      { $set: update },
      { new: true, select: 'name email phone role' }
    )
    if (!updated) return Response.json({ error: 'User not found' }, { status: 404 })

    // Re-issue JWT with updated name so nav reflects change immediately
    const newToken = signToken({
      userId: updated._id.toString(),
      email: updated.email,
      name: updated.name,
      role: updated.role,
    })
    await setAuthCookie(newToken)

    return Response.json({ user: updated })
  } catch (err) {
    console.error('PATCH /api/users/me error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
