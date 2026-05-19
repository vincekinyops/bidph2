import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { formatPhp } from '../../lib/money'
import type { Auction, BidWithBidder, UserPublicProfile } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { formatUserRef } from '../../lib/user'

function useCountdown(endTime: string | undefined) {
  const [remaining, setRemaining] = useState('—:—:—')

  useEffect(() => {
    if (!endTime) return

    const endsAt = endTime

    function tick() {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('00:00:00')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setRemaining(
        [h, m, s].map((n) => String(n).padStart(2, '0')).join(':'),
      )
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endTime])

  return remaining
}

async function fetchTrendingAuction(): Promise<Auction | null> {
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('status', 'active')

  if (error) throw error
  if (!auctions?.length) return null

  const ids = auctions.map((a) => a.id)
  const { data: bids, error: bidsError } = await supabase
    .from('bids')
    .select('auction_id')
    .in('auction_id', ids)

  if (bidsError) throw bidsError

  const bidCounts = new Map<string, number>()
  for (const bid of bids ?? []) {
    bidCounts.set(bid.auction_id, (bidCounts.get(bid.auction_id) ?? 0) + 1)
  }

  return [...auctions].sort((a, b) => {
    const countDiff = (bidCounts.get(b.id) ?? 0) - (bidCounts.get(a.id) ?? 0)
    if (countDiff !== 0) return countDiff
    return Number(b.current_price) - Number(a.current_price)
  })[0] ?? null
}

async function fetchAuctionBids(auctionId: string): Promise<BidWithBidder[]> {
  const { data: bids, error } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) throw error
  if (!bids?.length) return []

  const userIds = [...new Set(bids.map((b) => b.user_id))]
  const { data: profiles, error: profileErr } = await supabase
    .from('user_public_profiles')
    .select('id, reference_number')
    .in('id', userIds)

  if (profileErr) throw profileErr

  const refByUser = new Map(
    (profiles as UserPublicProfile[]).map((p) => [p.id, p.reference_number]),
  )

  return bids.map((b) => ({
    ...b,
    reference_number: refByUser.get(b.user_id) ?? '????????',
  })) as BidWithBidder[]
}

export default function LandingTrendingHero() {
  const qc = useQueryClient()

  const trendingQuery = useQuery({
    queryKey: ['landing', 'trending-auction'],
    queryFn: fetchTrendingAuction,
    refetchInterval: 30_000,
  })

  const auction = trendingQuery.data
  const countdown = useCountdown(auction?.end_time)

  const bidsQuery = useQuery({
    queryKey: ['landing', 'trending-bids', auction?.id],
    queryFn: () => fetchAuctionBids(auction!.id),
    enabled: !!auction?.id,
  })

  useEffect(() => {
    const channel = supabase
      .channel('landing-trending-refresh')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids' },
        () => qc.invalidateQueries({ queryKey: ['landing', 'trending-auction'] }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions' },
        () => qc.invalidateQueries({ queryKey: ['landing', 'trending-auction'] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  useEffect(() => {
    if (!auction?.id) return

    const channel = supabase
      .channel(`landing-trending-${auction.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auction.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ['landing', 'trending-auction'] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auction.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ['landing', 'trending-bids', auction.id] }),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auction?.id, qc])

  const bids = bidsQuery.data ?? []
  const bidCount = useMemo(() => bids.length, [bids.length])

  if (trendingQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40">
        <p className="text-sm text-slate-500">Loading live auctions…</p>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-amber-700">
          #1 Trending
        </p>
        <h3 className="mb-2 text-xl font-bold text-slate-900">No live auctions yet</h3>
        <p className="mb-6 text-sm text-slate-600">
          Be the first to list an item or check back when bidding opens.
        </p>
        <Link
          to="/auctions"
          className="landing-btn-dark inline-block rounded-xl px-5 py-3 text-sm font-semibold no-underline"
        >
          View auctions
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              #1 Trending
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 aspect-[16/10] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
              {auction.title}
            </div>
          </div>

          <h3 className="mb-3 line-clamp-2 text-xl font-bold text-slate-900">{auction.title}</h3>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current bid
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatPhp(auction.current_price)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Time left
              </p>
              <p className="font-mono text-lg font-bold text-red-600">{countdown}</p>
            </div>
          </div>

          <Link
            to="/auctions/$id"
            params={{ id: auction.id }}
            className="landing-btn-dark block w-full rounded-xl py-3 text-center text-sm font-semibold no-underline transition hover:scale-[1.01]"
          >
            View &amp; bid now
          </Link>
        </div>
      </article>

      <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-900">Live bids</h4>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Real-time
          </span>
        </div>

        <ul className="max-h-[340px] flex-1 divide-y divide-slate-100 overflow-y-auto">
          {bidsQuery.isLoading && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Loading bids…</li>
          )}
          {!bidsQuery.isLoading && bids.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">
              No bids yet — be the first.
            </li>
          )}
          {bids.map((bid, index) => (
            <li
              key={bid.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition ${
                index === 0 ? 'bg-amber-50/80' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-slate-500">
                  {formatUserRef(bid.reference_number)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(bid.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-slate-900">
                {formatPhp(bid.amount)}
              </span>
            </li>
          ))}
        </ul>

        {bidCount > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-500">
            Showing latest {bidCount} bid{bidCount === 1 ? '' : 's'}
          </div>
        )}
      </aside>
    </div>
  )
}
