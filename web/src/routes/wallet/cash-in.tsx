import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { requireKycApproved } from '../../lib/route-guards'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { parseMoneyInput } from '../../lib/money'
import { env } from '../../lib/env'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/wallet/cash-in')({
  beforeLoad: async ({ location }) => {
    await requireKycApproved({ redirectTo: location.pathname })
  },
  component: CashInForm,
})

function CashInForm() {
  const { profile } = useAuth()
  const [amount, setAmount] = useState('500')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (profile?.kyc_status !== 'approved') {
    return (
      <Page className="max-w-lg">
        <Card>
          <Alert tone="info">KYC must be approved before cash-in.</Alert>
        </Card>
      </Page>
    )
  }

  async function devCashIn() {
    setError(null)
    const { error: err } = await supabase.rpc('dev_simulate_cash_in', {
      p_amount: parseMoneyInput(amount),
    })
    if (err) {
      setError(err.message)
      return
    }
    setSuccess(true)
  }

  return (
    <Page className="max-w-lg">
      <Card>
        <h1 className="mb-4 text-2xl font-bold text-[var(--sea-ink)]">Cash in via GCash</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Production uses PayMongo Checkout. For local development, use the simulate button after
          Supabase is running.
        </p>
        <Input label="Amount (PHP)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {env.isDev && (
          <Button className="mt-4" onClick={devCashIn}>
            Simulate cash-in (local dev)
          </Button>
        )}
        {!env.isDev && (
          <div className="mt-4"><Alert tone="info">
            Configure PayMongo and POST to /api/webhooks/paymongo after checkout.
          </Alert></div>
        )}
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Alert tone="success">Cash-in credited to Idle fund.</Alert>
          </div>
        )}
      </Card>
    </Page>
  )
}
