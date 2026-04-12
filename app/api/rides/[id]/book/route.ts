import type { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import Ride from '@/lib/models/ride'
import Booking from '@/lib/models/booking'
import { getCurrentUser } from '@/lib/auth'

/** POST /api/rides/[id]/book */
export async function POST(
  req: NextRequest,
  ctx: RouteContext<'/api/rides/[id]/book'>
) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await ctx.params
    const { pickupStop, dropStop } = await req.json()

    if (!pickupStop || !dropStop) {
      return Response.json({ error: 'Pickup and drop stops are required' }, { status: 400 })
    }

    await connectDB()

    const ride = await Ride.findById(id)
    if (!ride) return Response.json({ error: 'Ride not found' }, { status: 404 })
    if (ride.status !== 'open') {
      return Response.json({ error: 'This ride is no longer available' }, { status: 409 })
    }
    if (ride.driverId.toString() === user.userId) {
      return Response.json({ error: 'You cannot book your own ride' }, { status: 400 })
    }

    // Reject booking if departure time has already passed
    const [h, m] = (ride.departureTime as string).split(':').map(Number)
    const departureUTC = new Date(ride.date as Date)
    departureUTC.setUTCHours(h - 5, m - 30, 0, 0)
    if (departureUTC <= new Date()) {
      return Response.json({ error: 'This ride has already departed' }, { status: 409 })
    }

    // Check for existing booking
    const existing = await Booking.findOne({
      rideId: id,
      riderId: user.userId,
    })
    if (existing) {
      if (existing.status === 'confirmed') {
        return Response.json({ error: 'You have already booked this ride' }, { status: 409 })
      }
      // Reactivate cancelled booking
      existing.status = 'confirmed'
      existing.pickupStop = pickupStop
      existing.dropStop = dropStop
      await existing.save()

      ride.bookedSeats += 1
      await ride.save()

      return Response.json({ booking: existing }, { status: 200 })
    }

    const booking = await Booking.create({
      rideId: id,
      riderId: user.userId,
      pickupStop,
      dropStop,
    })

    ride.bookedSeats += 1
    await ride.save()

    return Response.json({ booking }, { status: 201 })
  } catch (err) {
    console.error('POST /api/rides/[id]/book error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
