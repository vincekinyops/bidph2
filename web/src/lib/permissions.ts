import type { KycStatus, User, UserRole } from './database.types'
import { env } from './env'

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

/** True when `VITE_DEV_ADMIN_EMAIL` matches (dev builds only). */
export function isDevAdminEmail(email: string | null | undefined): boolean {
  if (!env.isDev || !env.devAdminEmail) return false
  const normalized = normalizeEmail(email)
  return normalized !== null && normalized === env.devAdminEmail
}

export type Permission =
  | 'bid'
  | 'cash_in'
  | 'cash_out'
  | 'sell'
  | 'admin_panel'
  | 'review_kyc'

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  bidder: [],
  seller: ['sell'],
  admin: ['sell', 'admin_panel', 'review_kyc'],
}

export function hasRole(profile: User | null | undefined, role: UserRole): boolean {
  if (role === 'admin' && isDevAdminEmail(profile?.email)) return true
  return profile?.role === role
}

export function isAdmin(
  profile: User | null | undefined,
  email?: string | null,
): boolean {
  return hasRole(profile, 'admin') || isDevAdminEmail(email ?? profile?.email)
}

export function isKycApproved(profile: User | null | undefined): boolean {
  return profile?.kyc_status === 'approved'
}

export function can(
  profile: User | null | undefined,
  permission: Permission,
  email?: string | null,
): boolean {
  if (!profile) return false

  if (permission === 'bid' || permission === 'cash_in' || permission === 'cash_out') {
    return isKycApproved(profile) || isDevAdminEmail(email ?? profile.email)
  }

  if (permission === 'review_kyc' || permission === 'admin_panel') {
    return isAdmin(profile, email)
  }

  if (permission === 'sell') {
    return (
      profile.role === 'seller' ||
      profile.role === 'admin' ||
      isDevAdminEmail(email ?? profile.email)
    )
  }

  return ROLE_PERMISSIONS[profile.role]?.includes(permission) ?? false
}

export function kycGateMessage(status: KycStatus | undefined): string {
  switch (status) {
    case 'pending':
      return 'Your identity verification is pending admin review. You can bid once approved.'
    case 'rejected':
      return 'Your identity verification was rejected. Please resubmit documents to bid.'
    case 'approved':
      return ''
    default:
      return 'Complete identity verification before you can place bids.'
  }
}
