import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import DashboardNav from './nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} />
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
