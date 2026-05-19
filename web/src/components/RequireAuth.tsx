import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { Card, Page } from './ui'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { authUser, loading } = useAuth()

  if (loading) {
    return (
      <Page>
        <Card>Loading…</Card>
      </Page>
    )
  }

  if (!authUser) {
    return (
      <Page>
        <Card>
          <p className="mb-4 text-[var(--sea-ink-soft)]">Please sign in to continue.</p>
          <Link to="/login" className="font-semibold text-[var(--lagoon-deep)]">
            Go to login
          </Link>
        </Card>
      </Page>
    )
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (profile?.role !== 'admin') {
    return (
      <Page>
        <Card>Admin access required.</Card>
      </Page>
    )
  }

  return <>{children}</>
}
