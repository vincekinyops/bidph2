import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Alert, Button, Card, Input, Page } from '../components/ui'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate({ to: '/account' })
  }

  return (
    <Page className="max-w-md">
      <Card>
        <h1 className="mb-2 text-2xl font-bold text-[var(--sea-ink)]">Create account</h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Closed-loop wallet: deposits are for bidding on this platform only. Complete KYC before
          cash-in.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Already have an account? <Link to="/login" className="text-[var(--lagoon-deep)]">Sign in</Link>
        </p>
      </Card>
    </Page>
  )
}
