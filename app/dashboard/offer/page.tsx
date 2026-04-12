'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ArrowLeft, ArrowRight, MapPin } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Stop {
  name: string
  time: string
}

const TODAY = format(new Date(), 'yyyy-MM-dd')
const MAX_DATE = format(addDays(new Date(), 7), 'yyyy-MM-dd')

const OFFICE = 'Nanakheda'
const LOCATIONS = ['Aurbindo', 'Vijay Nagar', 'Bapat Square', 'Palasia', 'Radison']

function makeDefaultStops(direction: 'to_office' | 'from_office'): Stop[] {
  if (direction === 'to_office') {
    return [
      { name: OFFICE, time: '09:00' },
      { name: '', time: '09:30' },
    ]
  }
  return [
    { name: '', time: '09:00' },
    { name: OFFICE, time: '09:30' },
  ]
}

export default function OfferRidePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: TODAY,
    departureTime: '09:00',
    direction: 'to_office' as 'to_office' | 'from_office',
    totalSeats: 3,
    fare: 100,
  })
  const [stops, setStops] = useState<Stop[]>(makeDefaultStops('to_office'))

  function changeDirection(dir: 'to_office' | 'from_office') {
    setForm((f) => ({ ...f, direction: dir }))
    setStops(makeDefaultStops(dir))
  }

  function addStop() {
    setStops((prev) => {
      const newStop = { name: '', time: '' }
      if (form.direction === 'to_office') {
        // insert before last
        return [...prev.slice(0, -1), newStop, prev[prev.length - 1]]
      } else {
        // insert after first
        return [prev[0], newStop, ...prev.slice(1)]
      }
    })
  }

  function removeStop(index: number) {
    if (stops.length <= 2) {
      toast.error('At least 2 stops required')
      return
    }
    // Don't allow removing the fixed Nanakheda stops
    const isFixed =
      (form.direction === 'to_office' && index === 0) ||
      (form.direction === 'from_office' && index === stops.length - 1)
    if (isFixed) return
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStop(index: number, field: keyof Stop, value: string) {
    setStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, [field]: value } : stop))
    )
  }

  // Returns the set of location names already chosen in the variable stops
  function selectedLocations(excludeIndex: number): Set<string> {
    return new Set(
      stops
        .map((s, i) => (i !== excludeIndex ? s.name : ''))
        .filter((n) => LOCATIONS.includes(n))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.date < TODAY || form.date > MAX_DATE) {
      toast.error('Rides can only be offered within the next 7 days')
      return
    }

    const filledStops = stops.filter((s) => s.name.trim())
    if (filledStops.length < 2) {
      toast.error('Please fill in at least 2 stops')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          stops: filledStops,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create ride')
        return
      }
      toast.success('Ride published!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Button asChild size="icon" variant="ghost" className="rounded-lg">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer a ride</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Share your journey with colleagues.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {/* Section: Trip details */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Trip details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={TODAY}
                max={MAX_DATE}
                value={form.date}
                onChange={(e) => {
                  const val = e.target.value
                  if (val > MAX_DATE) {
                    toast.error('Rides can only be offered within the next 7 days')
                    return
                  }
                  setForm((f) => ({ ...f, date: val }))
                }}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureTime">Departure (IST)</Label>
              <Input
                id="departureTime"
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                required
                className="h-10"
              />
            </div>
          </div>

          {/* Direction toggle */}
          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="flex gap-2">
              {[
                { value: 'to_office', label: 'To office', icon: <ArrowRight className="size-3.5" /> },
                { value: 'from_office', label: 'From office', icon: <ArrowLeft className="size-3.5" /> },
              ].map((opt) => {
                const active = form.direction === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => changeDirection(opt.value as 'to_office' | 'from_office')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Section: Seats & fare */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-5">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Capacity & cost</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Available seats</Label>
              <Input
                id="totalSeats"
                type="number"
                min={1}
                max={6}
                value={form.totalSeats}
                onChange={(e) => setForm((f) => ({ ...f, totalSeats: parseInt(e.target.value) }))}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fare">Fare per seat (₹)</Label>
              <Input
                id="fare"
                type="number"
                min={0}
                value={form.fare}
                onChange={(e) => setForm((f) => ({ ...f, fare: parseInt(e.target.value) }))}
                required
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Section: Stops */}
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Route stops</h2>
            <Button type="button" size="sm" variant="ghost" onClick={addStop} className="gap-1.5 text-xs h-8">
              <Plus className="size-3.5" />
              Add stop
            </Button>
          </div>

          <div className="relative pl-5">
            {/* Vertical track */}
            {stops.length > 1 && (
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border" />
            )}
            <div className="space-y-3">
              {stops.map((stop, i) => {
                const isFixed =
                  (form.direction === 'to_office' && i === 0) ||
                  (form.direction === 'from_office' && i === stops.length - 1)
                const isFirst = i === 0
                const isLast = i === stops.length - 1
                const taken = selectedLocations(i)
                const canRemove = stops.length > 2 && !isFixed
                return (
                  <div key={i} className="flex gap-2 items-center relative">
                    {/* Stop dot */}
                    <div className={`absolute -left-5 size-2.5 rounded-full border-2 shrink-0 ${
                      isFirst || isLast
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground bg-card'
                    }`} />

                    {isFixed ? (
                      /* Fixed Nanakheda label */
                      <div className="flex-1 h-9 px-3 flex items-center rounded-md border bg-muted text-sm font-medium text-muted-foreground select-none">
                        {OFFICE}
                      </div>
                    ) : (
                      /* Location dropdown */
                      <Select
                        required
                        value={stop.name}
                        onValueChange={(val) => updateStop(i, 'name', val)}
                      >
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder={isFirst ? 'Starting point' : isLast ? 'Final destination' : 'Select stop'} />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc} value={loc} disabled={taken.has(loc)}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Input
                      type="time"
                      value={stop.time}
                      onChange={(e) => updateStop(i, 'time', e.target.value)}
                      className="w-28 h-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeStop(i)}
                      disabled={!canRemove}
                      className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <MapPin className="size-3.5 mt-0.5 shrink-0" />
            Add all stops along your route — riders will choose their boarding and alighting points.
          </p>
        </div>

        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
          {loading ? 'Publishing…' : 'Publish ride'}
        </Button>
      </form>
    </div>
  )
}
