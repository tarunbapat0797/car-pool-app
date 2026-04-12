import { Suspense } from 'react'
import RideList from './ride-list'

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Rides</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse available rides or offer your own.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading rides…</div>}>
        <RideList />
      </Suspense>
    </div>
  )
}
