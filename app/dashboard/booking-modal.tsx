'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { X, MapPin, Check } from 'lucide-react'

interface RideStop {
  name: string
  time: string
  order: number
}

interface Ride {
  _id: string
  direction: 'to_office' | 'from_office'
  stops: RideStop[]
}

export default function BookingModal({
  ride,
  onClose,
  onBooked,
}: {
  ride: Ride
  onClose: () => void
  onBooked: () => void
}) {
  const stops = [...ride.stops].sort((a, b) => a.order - b.order)
  const isToOffice = ride.direction === 'to_office'

  // to_office  → pickup is always first stop (Nanakheda), drop is any of the rest
  // from_office → pickup is any of the non-last stops, drop is always last stop (Nanakheda)
  const pickupOptions = isToOffice ? [stops[0]] : stops.slice(0, -1)
  const dropOptions   = isToOffice ? stops.slice(1) : [stops[stops.length - 1]]

  const [pickupStop, setPickupStop] = useState(isToOffice ? (stops[0]?.name ?? '') : '')
  const [dropStop, setDropStop] = useState(isToOffice ? '' : (stops[stops.length - 1]?.name ?? ''))
  const [loading, setLoading] = useState(false)

  async function handleBook() {
    if (!pickupStop || !dropStop) {
      toast.error('Select both pickup and drop stops')
      return
    }
    if (pickupStop === dropStop) {
      toast.error('Pickup and drop stops must be different')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/rides/${ride._id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupStop, dropStop }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Booking failed')
        return
      }
      toast.success('Ride booked successfully!')
      onBooked()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-semibold text-foreground">Book your seat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select your pickup and drop stops</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Pickup */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pickup stop</span>
            </div>
            {isToOffice ? (
              /* Fixed: Nanakheda is the only pickup for to_office */
              <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-primary bg-primary/5 shadow-sm text-sm">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  <span className="font-semibold text-foreground">{stops[0]?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{stops[0]?.time}</span>
                  <Check className="size-3.5 text-primary" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pickupOptions.map((stop) => {
                  const selected = pickupStop === stop.name
                  return (
                    <button
                      key={stop.name}
                      type="button"
                      onClick={() => setPickupStop(stop.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`size-3.5 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={selected ? 'font-semibold text-foreground' : 'text-foreground'}>{stop.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{stop.time}</span>
                        {selected && <Check className="size-3.5 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Drop */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-2 rounded-full bg-violet-500" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Drop stop</span>
            </div>
            {!isToOffice ? (
              /* Fixed: Nanakheda is the only drop for from_office */
              <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-violet-400 bg-violet-50 shadow-sm text-sm">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-3.5 shrink-0 text-violet-500" />
                  <span className="font-semibold text-foreground">{stops[stops.length - 1]?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{stops[stops.length - 1]?.time}</span>
                  <Check className="size-3.5 text-violet-500" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dropOptions.map((stop) => {
                  const selected = dropStop === stop.name
                  return (
                    <button
                      key={stop.name}
                      type="button"
                      onClick={() => setDropStop(stop.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        selected
                          ? 'border-violet-400 bg-violet-50 shadow-sm'
                          : 'border-border hover:border-violet-300 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className={`size-3.5 shrink-0 ${selected ? 'text-violet-500' : 'text-muted-foreground'}`} />
                        <span className={selected ? 'font-semibold text-foreground' : 'text-foreground'}>{stop.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{stop.time}</span>
                        {selected && <Check className="size-3.5 text-violet-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleBook} disabled={loading} className="flex-1">
            {loading ? 'Booking…' : 'Confirm booking'}
          </Button>
        </div>
      </div>
    </div>
  )
}
