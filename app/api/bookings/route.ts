import { connectDB } from '@/lib/db'
import Booking from '@/lib/models/booking'
import { getCurrentUser } from '@/lib/auth'

/** GET /api/bookings — current user's confirmed bookings, newest ride first */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const bookings = await Booking.find({ riderId: user.userId })
      .populate({
        path: 'rideId',
        select: 'date departureTime direction stops fare status driverId',
        populate: { path: 'driverId', select: 'name phone' },
      })
      .sort({ bookedAt: -1 })
      .lean()

    return Response.json({ bookings })
  } catch (err) {
    console.error('GET /api/bookings error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
