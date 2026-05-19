import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Card, Page } from '../../components/ui'
import { formatPhp } from '../../lib/money'
import { supabase } from '../../lib/supabase'
import type { Auction } from '../../lib/database.types'

export const Route = createFileRoute('/auctions/')({
  component: AuctionsPage,
})

function AuctionsPage() {
  const qc = useQueryClient()

  const { data: auctions, isLoading } = useQuery({
    queryKey: ['auctions', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('status', 'active')
        .order('end_time', { ascending: true })
      if (error) throw error
      return data as Auction[]
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('home-auctions')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions' },
        () => qc.invalidateQueries({ queryKey: ['auctions', 'active'] }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])

  return (
    <Page>
      <section className="island-shell mb-8 rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="island-kicker mb-2">Philippine auctions</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Active auctions
        </h1>
        <p className="max-w-2xl text-[var(--sea-ink-soft)]">
          Browse live listings, allocate funds to your bidding balance, and place bids in real
          time.
        </p>
      </section>

      {isLoading && <Card>Loading auctions…</Card>}
      {!isLoading && (!auctions || auctions.length === 0) && (
        <Card>No active auctions yet. Check back soon or list an item.</Card>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {auctions?.map((a) => (
          <li key={a.id}>
            <Link
              to="/auctions/$id"
              params={{ id: a.id }}
              className="island-shell block rounded-2xl p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50"
            >
              <h3 className="mb-1 font-semibold text-[var(--sea-ink)]">{a.title}</h3>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Current: {formatPhp(a.current_price)} · Ends{' '}
                {new Date(a.end_time).toLocaleString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
