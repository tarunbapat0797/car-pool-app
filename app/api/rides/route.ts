import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import Ride from '@/lib/models/ride'
import Booking from '@/lib/models/booking'
import { getCurrentUser } from '@/lib/auth'

/** GET /api/rides?date=YYYY-MM-DD&direction=to_office|from_office&stop=Bandra */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const direction = searchParams.get('direction')
    const stop = searchParams.get('stop')?.trim()

    const filter: Record<string, unknown> = {
      status: { $in: ['open', 'full'] },
    }

    if (dateParam) {
      const start = new Date(dateParam)
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date(dateParam)
      end.setUTCHours(23, 59, 59, 999)
      filter.date = { $gte: start, $lte: end }
    }

    if (direction) {
      filter.direction = direction
    }

    if (stop) {
      filter['stops.name'] = { $regex: stop, $options: 'i' }
    }

    const rides = await Ride.find(filter)
      .populate('driverId', 'name phone')
      .sort({ date: 1, departureTime: 1 })
      .lean()

    // Attach the current user's booking status to each ride
    const rideIds = rides.map((r) => r._id)
    const myBookings = await Booking.find({
      rideId: { $in: rideIds },
      riderId: user.userId,
      status: 'confirmed',
    }).lean()

    const bookedRideIds = new Set(myBookings.map((b) => b.rideId.toString()))
    const bookingIdByRideId = new Map(myBookings.map((b) => [b.rideId.toString(), b._id.toString()]))

    const now = new Date()

    // Helper: reconstruct UTC departure datetime from date (UTC midnight) + IST time string
    function departureUTC(rideDate: Date, departureTime: string): Date {
      const [h, m] = departureTime.split(':').map(Number)
      const d = new Date(rideDate)
      d.setUTCHours(h - 5, m - 30, 0, 0)
      return d
    }

    const ridesWithBooking = rides
      .map((ride) => ({
        ...ride,
        isMyRide: (ride.driverId as { _id: { toString(): string } })._id.toString() === user.userId,
        isBooked: bookedRideIds.has(ride._id.toString()),
        bookingId: bookingIdByRideId.get(ride._id.toString()) ?? null,
        availableSeats: ride.totalSeats - ride.bookedSeats,
      }))
      // Hide departed rides from riders; drivers can still see their own
      .filter((ride) => {
        if (ride.isMyRide) return true
        return departureUTC(ride.date as Date, ride.departureTime as string) > now
      })

    return Response.json({ rides: ridesWithBooking })
  } catch (err) {
    console.error('GET /api/rides error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/rides — create a ride */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, departureTime, direction, stops, totalSeats, fare } = await req.json()

    if (!date || !departureTime || !direction || !stops || !totalSeats || fare == null) {
      return Response.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (!Array.isArray(stops) || stops.length < 2) {
      return Response.json({ error: 'At least 2 stops are required' }, { status: 400 })
    }

    await connectDB()

    const rideDate = new Date(date)
    rideDate.setUTCHours(0, 0, 0, 0)

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setUTCDate(today.getUTCDate() + 7)
    if (rideDate < today || rideDate > maxDate) {
      return Response.json(
        { error: 'Rides can only be offered within the next 7 days' },
        { status: 400 }
      )
    }

    // If today, also check the departure time hasn't already passed
    if (rideDate.getTime() === today.getTime()) {
      const [h, m] = (departureTime as string).split(':').map(Number)
      const departureUTC = new Date(rideDate)
      departureUTC.setUTCHours(h - 5, m - 30, 0, 0)
      if (departureUTC <= new Date()) {
        return Response.json(
          { error: 'Departure time has already passed' },
          { status: 400 }
        )
      }
    }

    // Prevent duplicate ride by same driver on same date+direction
    const duplicate = await Ride.findOne({
      driverId: user.userId,
      date: rideDate,
      direction,
      status: { $in: ['open', 'full'] },
    })
    if (duplicate) {
      return Response.json(
        { error: 'You already have an active ride for this date and direction' },
        { status: 409 }
      )
    }

    // Prevent offering a ride when you already have a confirmed booking on the same date+direction
    const conflictingBooking = await Booking.findOne({
      riderId: user.userId,
      status: 'confirmed',
      rideId: {
        $in: await Ride.find({ date: rideDate, direction, status: { $in: ['open', 'full'] } }).distinct('_id'),
      },
    })
    if (conflictingBooking) {
      return Response.json(
        { error: "You already have a booked seat for this date and direction — cancel it first before offering a ride" },
        { status: 409 }
      )
    }

    const ride = await Ride.create({
      driverId: user.userId,
      date: rideDate,
      departureTime,
      direction,
      stops: stops.map((s: { name: string; time: string }, i: number) => ({
        name: s.name,
        time: s.time,
        order: i,
      })),
      totalSeats,
      fare,
    })

    return Response.json({ ride }, { status: 201 })
  } catch (err) {
    console.error('POST /api/rides error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
