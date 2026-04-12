'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MapPin, Clock, Users, IndianRupee, Car, Phone, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
} from 'lucide-react'
import BookingModal from './booking-modal'

interface RideStop { name: string; time: string; order: number }
interface Driver { _id: string; name: string; phone: string }

interface Ride {
  _id: string
  driverId: Driver
  date: string
  departureTime: string
  direction: 'to_office' | 'from_office'
  stops: RideStop[]
  totalSeats: number
  bookedSeats: number
  availableSeats: number
  fare: number
  status: 'open' | 'full' | 'cancelled' | 'completed'
  isMyRide: boolean
  isBooked: boolean
  bookingId: string | null
}

interface Passenger {
  _id: string
  riderId: { name: string; phone: string }
  pickupStop: string
  dropStop: string
}

const TODAY = format(new Date(), 'yyyy-MM-dd')

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function RideList() {
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(TODAY)
  const [direction, setDirection] = useState('')
  const [stopFilter, setStopFilter] = useState('')
  const [expandedRide, setExpandedRide] = useState<string | null>(null)
  const [bookingRide, setBookingRide] = useState<Ride | null>(null)

  const fetchRides = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date })
      if (direction) params.set('direction', direction)
      if (stopFilter) params.set('stop', stopFilter)
      const res = await fetch(`/api/rides?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRides(data.rides)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load rides')
    } finally {
      setLoading(false)
    }
  }, [date, direction, stopFilter])

  useEffect(() => { fetchRides() }, [fetchRides])

  async function cancelBooking(bookingId: string) {
    if (!confirm('Cancel your booking on this ride?')) return
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel booking')
        return
      }
      toast.success('Booking cancelled')
      fetchRides()
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function cancelRide(rideId: string) {
    if (!confirm('Cancel this ride? All bookings will be affected.')) return
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success('Ride cancelled')
      fetchRides()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel ride')
    }
  }

  const myRides = rides.filter((r) => r.isMyRide)
  const otherRides = rides.filter((r) => !r.isMyRide)

  return (
    <>
      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Date row */}
        <div className="flex flex-wrap gap-2 items-center">
          {[0, 1, 2].map((offset) => {
            const d = format(addDays(new Date(), offset), 'yyyy-MM-dd')
            const label =
              offset === 0 ? 'Today'
              : offset === 1 ? 'Tomorrow'
              : format(addDays(new Date(), offset), 'EEE d')
            const active = date === d
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={`text-sm px-4 py-1.5 rounded-full font-medium border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            )
          })}
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 w-36 text-sm rounded-full"
          />
        </div>

        {/* Direction + stop filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { value: '', label: 'All', icon: null },
            { value: 'to_office', label: 'To office', icon: <ArrowRight className="size-3" /> },
            { value: 'from_office', label: 'From office', icon: <ArrowLeft className="size-3" /> },
          ].map((opt) => {
            const active = direction === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setDirection(opt.value)}
                className={`inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full font-medium border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            )
          })}

          <Select
            value={stopFilter || '__all__'}
            onValueChange={(v) => setStopFilter(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-40 rounded-full text-sm">
              <SelectValue placeholder="All stops" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All stops</SelectItem>
              <SelectItem value="Nanakheda">Nanakheda</SelectItem>
              <SelectItem value="Aurbindo">Aurbindo</SelectItem>
              <SelectItem value="Vijay Nagar">Vijay Nagar</SelectItem>
              <SelectItem value="Bapat Square">Bapat Square</SelectItem>
              <SelectItem value="Palasia">Palasia</SelectItem>
              <SelectItem value="Radison">Radison</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : rides.length === 0 ? (
        <div className="text-center py-20">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Car className="size-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-foreground">No rides found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different date or filter</p>
        </div>
      ) : (
        <div className="space-y-8">
          {myRides.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your rides</span>
                <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                  {myRides.length}
                </span>
              </div>
              <div className="space-y-3">
                {myRides.map((ride) => (
                  <RideCard
                    key={ride._id}
                    ride={ride}
                    expanded={expandedRide === ride._id}
                    onToggle={() => setExpandedRide(expandedRide === ride._id ? null : ride._id)}
                    onCancel={() => cancelRide(ride._id)}
                    onCancelBooking={() => ride.bookingId && cancelBooking(ride.bookingId)}
                    onBook={() => setBookingRide(ride)}
                  />
                ))}
              </div>
            </section>
          )}
          {otherRides.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Available rides</span>
                <span className="size-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-bold">
                  {otherRides.length}
                </span>
              </div>
              <div className="space-y-3">
                {otherRides.map((ride) => (
                  <RideCard
                    key={ride._id}
                    ride={ride}
                    expanded={expandedRide === ride._id}
                    onToggle={() => setExpandedRide(expandedRide === ride._id ? null : ride._id)}
                    onCancel={() => cancelRide(ride._id)}
                    onCancelBooking={() => ride.bookingId && cancelBooking(ride.bookingId)}
                    onBook={() => setBookingRide(ride)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {bookingRide && (
        <BookingModal
          ride={bookingRide}
          onClose={() => setBookingRide(null)}
          onBooked={() => { setBookingRide(null); fetchRides() }}
        />
      )}
    </>
  )
}

function RideCard({
  ride,
  expanded,
  onToggle,
  onCancel,
  onCancelBooking,
  onBook,
}: {
  ride: Ride
  expanded: boolean
  onToggle: () => void
  onCancel: () => void
  onCancelBooking: () => void
  onBook: () => void
}) {
  const isFull = ride.status === 'full'
  const dirLabel = ride.direction === 'to_office' ? 'To office' : 'From office'
  const dirColor = ride.direction === 'to_office' ? 'bg-primary' : 'bg-violet-500'
  const [passengers, setPassengers] = useState<Passenger[] | null>(null)
  const [passengersLoading, setPassengersLoading] = useState(false)

  useEffect(() => {
    if (!expanded || !ride.isMyRide || passengers !== null) return
    setPassengersLoading(true)
    fetch(`/api/rides/${ride._id}`)
      .then((r) => r.json())
      .then((data) => setPassengers(data.bookings ?? []))
      .catch(() => setPassengers([]))
      .finally(() => setPassengersLoading(false))
  }, [expanded, ride.isMyRide, ride._id, passengers])

  function buildWhatsAppLink(): string {
    const date = format(new Date(ride.date), 'd MMM')
    const dir = ride.direction === 'to_office' ? 'To office' : 'From office'
    const lines = [
      `Ride on ${date} (${dir}) @ ${ride.departureTime}`,
      `Passengers (${passengers?.length ?? 0}):`,
      ...(passengers ?? []).map(
        (p, i) => `${i + 1}. ${p.riderId.name} — ${p.riderId.phone} (${p.pickupStop} → ${p.dropStop})`
      ),
    ]
    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
  }

  const stops = [...ride.stops].sort((a, b) => a.order - b.order)

  return (
    <div
      className={`relative bg-card rounded-xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${
        isFull && !ride.isBooked ? 'opacity-60' : ''
      }`}
    >
      {/* Direction color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${dirColor}`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Route */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-foreground">
                {stops[0]?.name}
                <span className="mx-1.5 text-muted-foreground font-normal">→</span>
                {stops[stops.length - 1]?.name}
              </h3>
              <Badge
                variant={ride.direction === 'to_office' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {dirLabel}
              </Badge>
              {ride.isBooked && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">
                  Booked
                </Badge>
              )}
              {isFull && !ride.isBooked && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Full</Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {ride.departureTime}
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="size-3.5 shrink-0" />
                {ride.fare} per seat
              </span>
              {!ride.isMyRide && (
                <span className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {getInitials(ride.driverId.name)}
                  </div>
                  {ride.driverId.name}
                </span>
              )}
            </div>

            {/* Seat indicator */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex gap-1">
                {Array.from({ length: ride.totalSeats }).map((_, i) => (
                  <div
                    key={i}
                    className={`size-2 rounded-full transition-colors ${
                      i < ride.bookedSeats ? 'bg-muted-foreground/30' : 'bg-primary'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{ride.availableSeats}</span>
                {' '}seat{ride.availableSeats !== 1 ? 's' : ''} left
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {ride.isMyRide ? (
              <Button size="sm" variant="destructive" onClick={onCancel} className="text-xs">
                Cancel ride
              </Button>
            ) : ride.isBooked ? (
              <Button size="sm" variant="outline" onClick={onCancelBooking} className="text-xs text-destructive border-destructive/40 hover:bg-destructive/5 hover:text-destructive">
                Cancel booking
              </Button>
            ) : (
              <Button size="sm" disabled={isFull} onClick={onBook} className="text-xs">
                {isFull ? 'Full' : 'Book seat'}
              </Button>
            )}
            <button
              onClick={onToggle}
              className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="pl-4 pr-4 pb-4">
          <div className="border-t border-dashed pt-3 space-y-4">
            {/* Stop list */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Route stops</p>
              <div className="relative pl-3">
                {/* Vertical line */}
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-2">
                  {stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm relative">
                      <div className={`size-2.5 rounded-full border-2 shrink-0 ${
                        i === 0 || i === stops.length - 1
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground bg-card'
                      }`} />
                      <span className="flex-1 font-medium">{stop.name}</span>
                      <span className="text-muted-foreground tabular-nums">{stop.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Driver contact */}
            {!ride.isMyRide && (
              <div className="flex items-center gap-2 pt-1 text-sm">
                <a
                  href={`https://wa.me/${ride.driverId.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="size-3.5" />
                  <span>{ride.driverId.phone}</span>
                </a>
              </div>
            )}

            {/* Passenger list */}
            {ride.isMyRide && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Passengers ({passengers?.length ?? '…'})
                  </p>
                  {passengers !== null && passengers.length > 0 && (
                    <a
                      href={buildWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Message all
                    </a>
                  )}
                </div>
                {passengersLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : passengers?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No bookings yet.</p>
                ) : (
                  <div className="space-y-2">
                    {passengers?.map((p, i) => (
                      <div key={p._id} className="flex items-center gap-3 text-sm bg-muted/50 rounded-lg px-3 py-2">
                        <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {getInitials(p.riderId.name)}
                        </span>
                        <span className="flex-1 font-medium">{p.riderId.name}</span>
                        <span className="text-muted-foreground text-xs">{p.pickupStop} → {p.dropStop}</span>
                        <a
                          href={`https://wa.me/${p.riderId.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={`Message ${p.riderId.name}`}
                        >
                          <Phone className="size-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
