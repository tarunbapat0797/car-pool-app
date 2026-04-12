import type { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import Booking from '@/lib/models/booking'
import Ride, { IRide } from '@/lib/models/ride'
import { getCurrentUser } from '@/lib/auth'

const CANCELLATION_CUTOFF_HOURS = 6

/** POST /api/bookings/[id]/cancel */
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<'/api/bookings/[id]/cancel'>
) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params

    await connectDB()

    const booking = await Booking.findById(id)
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.riderId.toString() !== user.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (booking.status !== 'confirmed') {
      return Response.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    const ride = await Ride.findById(booking.rideId) as IRide | null
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 })

    // Enforce cancellation cutoff — convert IST departure to UTC for comparison
    const rideDateTime = new Date(ride.date)
    const [hours, minutes] = ride.departureTime.split(':').map(Number)
    rideDateTime.setUTCHours(hours - 5, minutes - 30, 0, 0)
    const cutoffTime = new Date(rideDateTime.getTime() - CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000)

    if (new Date() > cutoffTime) {
      return Response.json(
        { error: `Cancellations are not allowed within ${CANCELLATION_CUTOFF_HOURS} hours of departure` },
        { status: 400 }
      )
    }

    booking.status = 'cancelled'
    await booking.save()

    ride.bookedSeats = Math.max(0, ride.bookedSeats - 1)
    await ride.save()

    return Response.json({ booking })
  } catch (err) {
    console.error('POST /api/bookings/[id]/cancel error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
