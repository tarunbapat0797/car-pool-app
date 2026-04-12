'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Car className="size-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Carpool</span>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your commute,<br />reimagined.
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Share rides with colleagues, cut costs, and make your daily commute something to look forward to.
          </p>
        </div>

        <div className="relative flex gap-10">
          <div>
            <div className="text-3xl font-bold">50%</div>
            <div className="text-indigo-300 text-sm mt-0.5">lower cost</div>
          </div>
          <div>
            <div className="text-3xl font-bold">3×</div>
            <div className="text-indigo-300 text-sm mt-0.5">faster booking</div>
          </div>
          <div>
            <div className="text-3xl font-bold">CO₂</div>
            <div className="text-indigo-300 text-sm mt-0.5">saved per trip</div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center">
              <Car className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Carpool</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium gap-2"
              disabled={loading}
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="size-4" /></>
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
