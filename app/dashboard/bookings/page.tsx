'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, Car, Phone, IndianRupee, ArrowRight } from 'lucide-react'

interface RideStop { name: string; time: string; order: number }
interface Driver { name: string; phone: string }
interface Ride {
  _id: string
  date: string
  departureTime: string
  direction: 'to_office' | 'from_office'
  stops: RideStop[]
  fare: number
  status: string
  driverId: Driver
}
interface Booking {
  _id: string
  rideId: Ride
  pickupStop: string
  dropStop: string
  status: 'confirmed' | 'cancelled' | 'no_show'
  paymentStatus: 'pending' | 'paid'
  bookedAt: string
}

const CANCELLATION_CUTOFF_HOURS = 6

function departureUTC(ride: Ride): Date {
  const d = new Date(ride.date)
  const [h, m] = ride.departureTime.split(':').map(Number)
  d.setUTCHours(h - 5, m - 30, 0, 0)
  return d
}

function canCancel(ride: Ride): boolean {
  const cutoff = new Date(departureUTC(ride).getTime() - CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000)
  return new Date() <= cutoff
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookings(data.bookings)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleCancel(bookingId: string) {
    if (!confirm('Cancel this booking?')) return
    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && departureUTC(b.rideId) > now
  )
  const past = bookings.filter(
    (b) => b.status !== 'confirmed' || departureUTC(b.rideId) <= now
  )

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild size="icon" variant="ghost" className="rounded-lg">
          <Link href="/dashboard"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Rides you&apos;ve reserved a seat on.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Car className="size-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground mt-1">Find a ride and book your first seat.</p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/dashboard">Browse rides</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Upcoming</span>
                <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                  {upcoming.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    cancelling={cancellingId === b._id}
                    onCancel={() => handleCancel(b._id)}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Past</span>
              </div>
              <div className="space-y-3">
                {past.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    cancelling={false}
                    onCancel={() => {}}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({
  booking,
  cancelling,
  onCancel,
}: {
  booking: Booking
  cancelling: boolean
  onCancel: () => void
}) {
  const ride = booking.rideId
  const departed = departureUTC(ride) <= new Date()
  const isCancelledOrPast =
    booking.status === 'cancelled' || ride.status === 'cancelled' || departed
  const isUpcoming = booking.status === 'confirmed' && !departed
  const cancellable = isUpcoming && canCancel(ride) && ride.status !== 'cancelled'
  const dirColor = ride.direction === 'to_office' ? 'bg-primary' : 'bg-violet-500'

  const stops = [...ride.stops].sort((a, b) => a.order - b.order)

  return (
    <div className={`relative bg-card rounded-xl border shadow-sm overflow-hidden ${isCancelledOrPast ? 'opacity-60' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${dirColor}`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Route title */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">
                {stops[0]?.name}
                <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                {stops[stops.length - 1]?.name}
              </h3>
              <Badge variant={ride.direction === 'to_office' ? 'default' : 'secondary'} className="text-xs">
                {ride.direction === 'to_office' ? 'To office' : 'From office'}
              </Badge>
              {booking.status === 'cancelled' && (
                <Badge variant="outline" className="text-destructive border-destructive/40 text-xs">Cancelled</Badge>
              )}
              {ride.status === 'cancelled' && booking.status !== 'cancelled' && (
                <Badge variant="outline" className="text-destructive border-destructive/40 text-xs">Ride cancelled</Badge>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" />
                {format(parseISO(ride.date), 'd MMM yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {ride.departureTime}
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="size-3.5 shrink-0" />
                {ride.fare}
              </span>
            </div>
          </div>

          {cancellable && (
            <Button
              size="sm"
              variant="destructive"
              disabled={cancelling}
              onClick={onCancel}
              className="text-xs"
            >
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </Button>
          )}
        </div>

        {/* Trip detail strip */}
        <div className="mt-3 pt-3 border-t border-dashed space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{booking.pickupStop}</span>
            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
            <span className="font-medium">{booking.dropStop}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <div className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
              {getInitials(ride.driverId.name)}
            </div>
            <span>{ride.driverId.name}</span>
            <span className="text-border">·</span>
            <a
              href={`https://wa.me/${ride.driverId.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Phone className="size-3.5 shrink-0" />
              <span>{ride.driverId.phone}</span>
            </a>
          </div>

          {!cancellable && isUpcoming && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-1">
              Cancellation window closed — cutoff is {CANCELLATION_CUTOFF_HOURS}h before departure.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
