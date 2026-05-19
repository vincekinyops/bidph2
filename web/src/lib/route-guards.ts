import type { User } from './database.types'
import { can, isAdmin, isKycApproved } from './permissions'
import { routerRedirect } from './router-redirect'
import { supabase } from './supabase'

export type AuthContext = {
  userId: string
  profile: User
}

async function loadAuthContext(): Promise<AuthContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile) return null

  return { userId: user.id, profile: profile as User }
}

export async function requireAuth(opts?: { redirectTo?: string }): Promise<AuthContext> {
  const ctx = await loadAuthContext()
  if (!ctx) {
    routerRedirect({
      to: '/login',
      search: opts?.redirectTo ? { redirect: opts.redirectTo } : undefined,
    })
  }
  return ctx
}

export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!isAdmin(ctx.profile, user?.email)) {
    routerRedirect({ to: '/' })
  }
  return ctx
}

export async function requireKycApproved(opts?: { redirectTo?: string }): Promise<AuthContext> {
  const ctx = await requireAuth(opts)
  if (!isKycApproved(ctx.profile)) {
    routerRedirect({ to: '/account/kyc' })
  }
  return ctx
}

export async function requirePermission(
  permission: Parameters<typeof can>[1],
  opts?: { redirectTo?: string },
): Promise<AuthContext> {
  const ctx = await requireAuth(opts)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!can(ctx.profile, permission, user?.email)) {
    if (permission === 'bid' || permission === 'cash_in' || permission === 'cash_out') {
      routerRedirect({ to: '/account/kyc' })
    }
    routerRedirect({ to: '/' })
  }
  return ctx
}
