import type { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import Ride from '@/lib/models/ride'
import Booking from '@/lib/models/booking'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/rides/[id]'>
) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params

    await connectDB()

    const ride = await Ride.findById(id).populate('driverId', 'name phone').lean()
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 })

    const bookings = await Booking.find({ rideId: id, status: 'confirmed' })
      .populate('riderId', 'name phone')
      .lean()

    return Response.json({ ride, bookings })
  } catch (err) {
    console.error('GET /api/rides/[id] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** PATCH /api/rides/[id] — cancel your own ride */
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<'/api/rides/[id]'>
) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const { status } = await req.json()

    if (status !== 'cancelled') {
      return Response.json({ error: 'Only cancellation is supported' }, { status: 400 })
    }

    await connectDB()

    const ride = await Ride.findById(id)
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 })
    if (ride.driverId.toString() !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    ride.status = 'cancelled'
    await ride.save()

    return Response.json({ ride })
  } catch (err) {
    console.error('PATCH /api/rides/[id] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
