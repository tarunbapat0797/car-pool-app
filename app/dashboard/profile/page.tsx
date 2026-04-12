'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User } from 'lucide-react'

interface UserProfile {
  name: string
  email: string
  phone: string
  role: string
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user)
          setForm({ name: data.user.name, phone: data.user.phone ?? '' })
        }
      })
      .catch(() => toast.error('Failed to load profile'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Update failed')
        return
      }
      setProfile(data.user)
      toast.success('Profile updated')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button asChild size="icon" variant="ghost" className="rounded-lg">
          <Link href="/dashboard"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Update your name and phone number.</p>
        </div>
      </div>

      {profile === null ? (
        <div className="max-w-sm space-y-3">
          <div className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
          <div className="h-32 rounded-2xl bg-muted/60 animate-pulse" />
        </div>
      ) : (
        <div className="max-w-sm space-y-4">
          {/* Avatar card */}
          <div className="bg-card rounded-2xl border shadow-sm p-5 flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0">
              {form.name ? getInitials(form.name) : <User className="size-7" />}
            </div>
            <div>
              <p className="font-semibold text-foreground leading-tight">{profile.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{profile.email}</p>
              {profile.role && (
                <span className="inline-block mt-1.5 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                  {profile.role}
                </span>
              )}
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border shadow-sm p-5 space-y-5">
            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Edit details</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-10"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
