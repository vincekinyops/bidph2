import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { can, isAdmin, kycGateMessage } from '../lib/permissions'
import type { Permission } from '../lib/permissions'
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
  const { profile, authUser, loading } = useAuth()

  if (loading) return null
  if (!isAdmin(profile, authUser?.email)) {
    return (
      <Page>
        <Card>Admin access required.</Card>
      </Page>
    )
  }

  return <>{children}</>
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: ReactNode
}) {
  const { profile, loading, authUser } = useAuth()
  const email = authUser?.email

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

  if (!can(profile, permission, email)) {
    const message =
      permission === 'bid' || permission === 'cash_in' || permission === 'cash_out'
        ? kycGateMessage(profile?.kyc_status)
        : 'You do not have permission for this action.'

    return (
      <Page>
        <Card>
          <p className="mb-4 text-[var(--sea-ink-soft)]">{message}</p>
          {(permission === 'bid' ||
            permission === 'cash_in' ||
            permission === 'cash_out') && (
            <Link to="/account/kyc" className="font-semibold text-[var(--lagoon-deep)]">
              Complete verification
            </Link>
          )}
        </Card>
      </Page>
    )
  }

  return <>{children}</>
}

/** Inline gate for bidding UI on public auction pages */
export function RequireKycToBid({ children }: { children: ReactNode }) {
  const { profile, loading, authUser } = useAuth()
  const email = authUser?.email

  if (loading) return <Card>Loading…</Card>

  if (!authUser) {
    return (
      <Card>
        <p className="mb-4 text-[var(--sea-ink-soft)]">Sign in to place a bid.</p>
        <Link to="/login" className="font-semibold text-[var(--lagoon-deep)]">
          Go to login
        </Link>
      </Card>
    )
  }

  if (!can(profile, 'bid', email)) {
    return (
      <Card>
        <p className="mb-2 font-semibold">Verification required</p>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          {kycGateMessage(profile?.kyc_status)}
        </p>
        <Link
          to="/account/kyc"
          className="inline-block rounded-full bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          {profile?.kyc_status === 'pending' ? 'View KYC status' : 'Start verification'}
        </Link>
      </Card>
    )
  }

  return <>{children}</>
}
