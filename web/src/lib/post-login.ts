import type { User } from './database.types'
import { env } from './env'
import { isAdmin, isDevAdminEmail } from './permissions'
import { supabase } from './supabase'

/** Promote dev admin email in local builds (matches AuthProvider). */
export async function ensureDevAdminClaim(
  userId: string,
  email: string | undefined,
  profile: User | null,
): Promise<User | null> {
  if (
    !env.isDev ||
    !env.devAdminEmail ||
    !profile ||
    profile.role === 'admin' ||
    !isDevAdminEmail(email ?? profile.email)
  ) {
    return profile
  }

  await supabase.rpc('claim_dev_admin', { p_expected_email: env.devAdminEmail })
  const { data } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  return (data as User | null) ?? profile
}

/** Where to send the user after sign-in (or when visiting /login while signed in). */
export async function resolvePostLoginPath(redirect?: string): Promise<string> {
  if (redirect?.startsWith('/')) return redirect

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return '/'

  const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
  const profile = await ensureDevAdminClaim(user.id, user.email, (data as User | null) ?? null)

  if (profile && isAdmin(profile, user.email)) return '/admin'
  if (profile) return '/account'
  return '/'
}
