import { createClient } from '@supabase/supabase-js'
import { env } from './env'

async function createSupabaseOptions() {
  const options: NonNullable<Parameters<typeof createClient>[2]> = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }

  if (import.meta.env.SSR) {
    const { default: ws } = await import('ws')
    options.realtime = { transport: ws as NonNullable<NonNullable<Parameters<typeof createClient>[2]>['realtime']>['transport'] }
  }

  return options
}

const options = await createSupabaseOptions()

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, options)
