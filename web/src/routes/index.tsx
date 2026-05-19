import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, Page } from '../components/ui'
import { formatPhp } from '../lib/money'
import { supabase } from '../lib/supabase'
import type { Auction } from '../lib/database.types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
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

  return (
    <Page>
      <section className="island-shell mb-8 rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="island-kicker mb-2">Philippine auctions</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Bid with control
        </h1>
        <p className="max-w-2xl text-[var(--sea-ink-soft)]">
          Deposit via GCash, allocate funds to your Bidding balance, and bid only what you
          have set aside. Closed-loop wallet — funds stay on the platform until cash-out.
        </p>
      </section>

      <h2 className="mb-4 text-xl font-semibold text-[var(--sea-ink)]">Active auctions</h2>
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
              className="island-shell block rounded-2xl p-5 no-underline transition hover:-translate-y-0.5"
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
