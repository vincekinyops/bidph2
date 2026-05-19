import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Alert, Button, Card, Input, Page } from '../components/ui'
import { resolvePostLoginPath } from '../lib/post-login'
import { routerRedirect } from '../lib/router-redirect'
import { supabase } from '../lib/supabase'

type LoginSearch = {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const path = await resolvePostLoginPath(search.redirect)
    routerRedirect({ to: path })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setLoading(false)
      setError(err.message)
      return
    }
    const path = await resolvePostLoginPath(redirect)
    window.location.assign(path)
  }

  return (
    <Page className="max-w-md">
      <Card>
        <h1 className="mb-6 text-2xl font-bold text-[var(--sea-ink)]">Sign in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          No account? <Link to="/register" className="text-[var(--lagoon-deep)]">Register</Link>
        </p>
      </Card>
    </Page>
  )
}
