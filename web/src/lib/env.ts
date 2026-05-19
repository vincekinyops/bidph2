function normalizeEmail(value: string | undefined): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

function readPublishableKey(): string {
  const publishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  const legacyAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return (
    publishable ??
    legacyAnon ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
}

/** Local dev only — never set in production builds. */
const devAdminEmail = import.meta.env.DEV
  ? normalizeEmail(import.meta.env.VITE_DEV_ADMIN_EMAIL)
  : null

export const env = {
  supabaseUrl:
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'http://127.0.0.1:54321',
  /** Publishable key (`sb_publishable_...`) or legacy anon JWT. */
  supabasePublishableKey: readPublishableKey(),
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001',
  isDev: import.meta.env.DEV,
  /** Set `VITE_DEV_ADMIN_EMAIL` in `web/.env.local` (dev builds only). */
  devAdminEmail,
}
