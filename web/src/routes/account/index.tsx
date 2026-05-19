import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { AccountNav } from '../../components/AccountNav'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import type { Auction, Bid, WatchlistItem } from '../../lib/database.types'
import { formatPhp } from '../../lib/money'
import { supabase } from '../../lib/supabase'
import { formatUserRef } from '../../lib/user'

export const Route = createFileRoute('/account/')({
  component: AccountPage,
})

function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  )
}

interface WatchlistRow extends WatchlistItem {
  auction: Auction
}

interface ActiveBidRow {
  auction_id: string
  auction_title: string
  auction_status: string
  auction_end_time: string
  my_high_bid: number
  current_price: number
}

function AccountContent() {
  const { profile } = useAuth()
  const qc = useQueryClient()

  const watchlistQuery = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*, auction:auctions(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as WatchlistRow[]).filter((row) => row.auction)
    },
    enabled: !!profile,
  })

  const activeBidsQuery = useQuery({
    queryKey: ['my-active-bids', profile?.id],
    queryFn: async (): Promise<ActiveBidRow[]> => {
      if (!profile) return []
      const { data: bids, error } = await supabase
        .from('bids')
        .select('auction_id, amount, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!bids?.length) return []

      const highByAuction = new Map<string, number>()
      for (const bid of bids) {
        const current = highByAuction.get(bid.auction_id) ?? 0
        if (Number(bid.amount) > current) {
          highByAuction.set(bid.auction_id, Number(bid.amount))
        }
      }

      const auctionIds = [...highByAuction.keys()]
      const { data: auctions, error: auctionErr } = await supabase
        .from('auctions')
        .select('id, title, status, end_time, current_price')
        .in('id', auctionIds)
        .eq('status', 'active')
      if (auctionErr) throw auctionErr

      return (auctions ?? []).map((a) => ({
        auction_id: a.id,
        auction_title: a.title,
        auction_status: a.status,
        auction_end_time: a.end_time,
        my_high_bid: highByAuction.get(a.id) ?? 0,
        current_price: Number(a.current_price),
      }))
    },
    enabled: !!profile,
  })

  const auctionIds = useMemo(
    () => watchlistQuery.data?.map((w) => w.auction_id) ?? [],
    [watchlistQuery.data],
  )

  useEffect(() => {
    if (!auctionIds.length) return

    const channel = supabase
      .channel('account-watchlist')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions' },
        (payload) => {
          const id = (payload.new as { id?: string }).id
          if (id && auctionIds.includes(id)) {
            qc.invalidateQueries({ queryKey: ['watchlist'] })
            qc.invalidateQueries({ queryKey: ['my-active-bids'] })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        (payload) => {
          const auctionId = (payload.new as Bid).auction_id
          if (auctionIds.includes(auctionId)) {
            qc.invalidateQueries({ queryKey: ['watchlist'] })
            qc.invalidateQueries({ queryKey: ['my-active-bids'] })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionIds, qc])

  async function removeFromWatchlist(auctionId: string) {
    if (!profile) return
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', profile.id)
      .eq('auction_id', auctionId)
    if (error) return
    await qc.invalidateQueries({ queryKey: ['watchlist'] })
  }

  return (
    <Page>
      <AccountNav />

      <Card className="mb-6">
        <p className="island-kicker mb-1">Your account</p>
        <h1 className="mb-2 text-2xl font-bold text-[var(--sea-ink)]">
          {profile?.reference_number ? formatUserRef(profile.reference_number) : 'Account'}
        </h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
          {' · '}
          KYC: <strong>{profile?.kyc_status}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/wallet" className="text-[var(--lagoon-deep)] no-underline">
            Wallet →
          </Link>
          <Link to="/account/profile" className="text-[var(--lagoon-deep)] no-underline">
            Edit profile →
          </Link>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-1 text-lg font-semibold text-[var(--sea-ink)]">Items to bid</h2>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Auctions you saved. Prices update in real time.
        </p>
        {watchlistQuery.isLoading && <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>}
        {!watchlistQuery.isLoading && !watchlistQuery.data?.length && (
          <Alert tone="info">
            No items yet. Browse{' '}
            <Link to="/" className="text-[var(--lagoon-deep)]">
              active auctions
            </Link>{' '}
            and add items to your bid list.
          </Alert>
        )}
        <ul className="space-y-3">
          {watchlistQuery.data?.map((item) => (
            <li
              key={item.id}
              className="list-row flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <Link
                  to="/auctions/$id"
                  params={{ id: item.auction_id }}
                  className="font-medium text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
                >
                  {item.auction.title}
                </Link>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Current: {formatPhp(item.auction.current_price)} · Ends{' '}
                  {new Date(item.auction.end_time).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/auctions/$id"
                  params={{ id: item.auction_id }}
                  className="no-underline"
                >
                  <Button variant="secondary">Bid</Button>
                </Link>
                <Button variant="secondary" onClick={() => removeFromWatchlist(item.auction_id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-semibold text-[var(--sea-ink)]">Your active bids</h2>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Auctions where you currently have a bid placed.
        </p>
        {activeBidsQuery.isLoading && <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>}
        {!activeBidsQuery.isLoading && !activeBidsQuery.data?.length && (
          <p className="text-sm text-[var(--sea-ink-soft)]">No active bids right now.</p>
        )}
        <ul className="space-y-3">
          {activeBidsQuery.data?.map((row) => {
            const winning = row.my_high_bid >= row.current_price
            return (
              <li
                key={row.auction_id}
                className="list-row flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <Link
                    to="/auctions/$id"
                    params={{ id: row.auction_id }}
                    className="font-medium text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
                  >
                    {row.auction_title}
                  </Link>
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    Your bid: {formatPhp(row.my_high_bid)} · Current: {formatPhp(row.current_price)}
                    {' · '}
                    {winning ? (
                      <span className="font-medium text-emerald-700">Leading</span>
                    ) : (
                      <span className="font-medium text-amber-700">Outbid</span>
                    )}
                  </p>
                </div>
                <Link to="/auctions/$id" params={{ id: row.auction_id }} className="no-underline">
                  <Button variant="secondary">View</Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>
    </Page>
  )
}
