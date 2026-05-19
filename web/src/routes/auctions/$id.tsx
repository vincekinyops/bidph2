import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { formatPhp, parseMoneyInput } from '../../lib/money'
import type { Auction, Bid } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/auctions/$id')({
  component: AuctionDetailPage,
})

function AuctionDetailPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const { authUser } = useAuth()
  const [bidAmount, setBidAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAllocate, setShowAllocate] = useState(false)
  const [allocateAmount, setAllocateAmount] = useState('')

  const auctionQuery = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('auctions').select('*').eq('id', id).single()
      if (error) throw error
      return data as Auction
    },
  })

  const bidsQuery = useQuery({
    queryKey: ['bids', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as Bid[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`auction-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ['auction', id] }),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ['bids', id] }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, qc])

  const auction = auctionQuery.data
  const minBid = auction
    ? Number(auction.current_price) + Number(auction.min_increment)
    : 0

  async function placeBid() {
    if (!authUser) return
    setError(null)
    const amount = parseMoneyInput(bidAmount)
    const { error: err } = await supabase.rpc('place_bid_v2', {
      p_auction_id: id,
      p_amount: amount,
    })
    if (err) {
      if (err.message.includes('Insufficient bidding funds')) {
        setShowAllocate(true)
      }
      setError(err.message)
      return
    }
    setBidAmount('')
    await qc.invalidateQueries({ queryKey: ['auction', id] })
    await qc.invalidateQueries({ queryKey: ['bids', id] })
    await qc.invalidateQueries({ queryKey: ['wallet'] })
  }

  async function allocateAndRetry() {
    const { error: err } = await supabase.rpc('allocate_to_bidding', {
      p_amount: parseMoneyInput(allocateAmount),
    })
    if (err) {
      setError(err.message)
      return
    }
    setShowAllocate(false)
    await placeBid()
  }

  if (auctionQuery.isLoading) {
    return (
      <Page>
        <Card>Loading…</Card>
      </Page>
    )
  }

  if (!auction) {
    return (
      <Page>
        <Card>Auction not found.</Card>
      </Page>
    )
  }

  return (
    <Page>
      <Card className="mb-6">
        <p className="island-kicker mb-1">{auction.status}</p>
        <h1 className="mb-2 text-3xl font-bold text-[var(--sea-ink)]">{auction.title}</h1>
        {auction.description && (
          <p className="mb-4 text-[var(--sea-ink-soft)]">{auction.description}</p>
        )}
        <p className="text-lg font-semibold">
          Current price: {formatPhp(auction.current_price)}
        </p>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Min next bid: {formatPhp(minBid)} · Ends {new Date(auction.end_time).toLocaleString()}
        </p>
      </Card>

      {auction.status === 'active' && (
        <RequireAuth>
          <Card className="mb-6">
            <h2 className="mb-4 font-semibold">Place a bid</h2>
            <Input
              label={`Your bid (min ${formatPhp(minBid)})`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <Button className="mt-4" onClick={placeBid}>
              Bid now
            </Button>
            {error && (
              <div className="mt-4">
                <Alert tone="error">{error}</Alert>
              </div>
            )}
            {showAllocate && (
              <div className="mt-4 rounded-xl border border-[var(--lagoon)]/30 bg-[rgba(79,184,178,0.08)] p-4">
                <p className="mb-2 text-sm">
                  Insufficient Bidding funds. Move from Idle fund?
                </p>
                <Input value={allocateAmount} onChange={(e) => setAllocateAmount(e.target.value)} />
                <Button className="mt-2" variant="secondary" onClick={allocateAndRetry}>
                  Allocate & bid
                </Button>
              </div>
            )}
          </Card>
        </RequireAuth>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">Recent bids</h2>
        <ul className="space-y-2 text-sm">
          {bidsQuery.data?.map((b) => (
            <li key={b.id} className="flex justify-between">
              <span>{new Date(b.created_at).toLocaleString()}</span>
              <span className="font-medium">{formatPhp(b.amount)}</span>
            </li>
          ))}
          {!bidsQuery.data?.length && (
            <li className="text-[var(--sea-ink-soft)]">No bids yet.</li>
          )}
        </ul>
      </Card>
    </Page>
  )
}
