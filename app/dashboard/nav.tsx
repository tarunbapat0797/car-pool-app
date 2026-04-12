'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Car, Plus, LogOut, BookOpen, User } from 'lucide-react'
import type { JWTPayload } from '@/lib/auth'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Rides', exact: true },
  { href: '/dashboard/bookings', label: 'My Bookings', exact: false },
]

export default function DashboardNav({ user }: { user: JWTPayload }) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border/60 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
              <Car className="size-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">Carpool</span>
          </Link>

          <nav className="hidden sm:flex items-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm px-3 py-2 rounded-md font-semibold transition-colors ${
                  isActive(link.href, link.exact)
                    ? 'text-violet-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {isActive(link.href, link.exact) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/dashboard/offer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Offer a ride</span>
          </Link>

          {/* Mobile nav icons */}
          <Button asChild size="icon" variant="ghost" className="sm:hidden" title="My bookings">
            <Link href="/dashboard/bookings">
              <BookOpen className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="icon"
            variant="ghost"
            title={user.name}
            className={isActive('/dashboard/profile', false) ? 'bg-accent text-accent-foreground' : ''}
          >
            <Link href="/dashboard/profile">
              <User className="size-4" />
            </Link>
          </Button>

          <Button size="icon" variant="ghost" onClick={handleLogout} title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
