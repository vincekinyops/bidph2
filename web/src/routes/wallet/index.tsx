import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { requireAuth } from '../../lib/route-guards'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { formatPhp, parseMoneyInput } from '../../lib/money'
import type { Wallet, WalletTransaction } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/wallet/')({
  beforeLoad: async ({ location }) => {
    await requireAuth({ redirectTo: location.pathname })
  },
  component: WalletContent,
})

function WalletContent() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [allocateAmount, setAllocateAmount] = useState('')
  const [releaseAmount, setReleaseAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .maybeSingle()
      if (error) throw error
      return data as Wallet
    },
  })

  const txQuery = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const wallet = walletQuery.data
      if (!wallet) return []
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as WalletTransaction[]
    },
    enabled: !!walletQuery.data,
  })

  async function rpc(name: string, amount: number) {
    setError(null)
    setMessage(null)
    const { error: err } = await supabase.rpc(name, { p_amount: amount })
    if (err) {
      setError(err.message)
      return
    }
    await qc.invalidateQueries({ queryKey: ['wallet'] })
    await qc.invalidateQueries({ queryKey: ['wallet-transactions'] })
    setMessage('Wallet updated.')
  }

  const wallet = walletQuery.data
  const kycApproved = profile?.kyc_status === 'approved'

  return (
    <Page>
      <h1 className="mb-6 text-3xl font-bold text-[var(--sea-ink)]">Wallet</h1>
      {!kycApproved && (
        <div className="mb-4">
        <Alert tone="info">
          Complete KYC approval before cash-in.{' '}
          <Link to="/account/kyc" className="underline">
            Go to KYC
          </Link>
        </Alert>
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-[var(--sea-ink-soft)]">Idle fund</p>
          <p className="text-3xl font-bold text-[var(--sea-ink)]">
            {wallet ? formatPhp(wallet.idle_balance) : '—'}
          </p>
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">Deposits & cash-out</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--sea-ink-soft)]">Bidding fund</p>
          <p className="text-3xl font-bold text-[var(--sea-ink)]">
            {wallet ? formatPhp(wallet.bidding_balance) : '—'}
          </p>
          <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">For placing bids</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold text-[var(--sea-ink)]">Transfer between funds</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              rpc('allocate_to_bidding', parseMoneyInput(allocateAmount))
            }}
            className="space-y-2"
          >
            <Input
              label="Idle → Bidding"
              value={allocateAmount}
              onChange={(e) => setAllocateAmount(e.target.value)}
              placeholder="500"
            />
            <Button type="submit" variant="secondary">
              Allocate
            </Button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              rpc('release_to_idle', parseMoneyInput(releaseAmount))
            }}
            className="space-y-2"
          >
            <Input
              label="Bidding → Idle"
              value={releaseAmount}
              onChange={(e) => setReleaseAmount(e.target.value)}
              placeholder="200"
            />
            <Button type="submit" variant="secondary">
              Release
            </Button>
          </form>
        </div>
        {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
        {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
      </Card>

      <Card className="mb-6 flex flex-wrap gap-3">
        <Link to="/wallet/cash-in">
          <Button disabled={!kycApproved}>Cash in (GCash)</Button>
        </Link>
        <Button
          variant="secondary"
          disabled={!kycApproved}
          onClick={async () => {
            const amount = parseMoneyInput('100')
            const { error: err } = await supabase.rpc('request_cash_out', { p_amount: amount })
            if (err) setError(err.message)
            else setMessage('Cash-out requested (pending payout).')
          }}
        >
          Request cash-out (min ₱100)
        </Button>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--sea-ink)]">Transaction history</h2>
        <ul className="space-y-2 text-sm">
          {txQuery.data?.map((t) => (
            <li key={t.id} className="flex justify-between border-b border-[var(--line)] py-2">
              <span>
                {t.type} · {t.status}
              </span>
              <span className="font-medium">{formatPhp(t.amount)}</span>
            </li>
          ))}
          {!txQuery.data?.length && <li className="text-[var(--sea-ink-soft)]">No transactions yet.</li>}
        </ul>
      </Card>
    </Page>
  )
}
