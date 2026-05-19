import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { requireAuth } from '../../lib/route-guards'
import { Button, Card, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { formatPhp } from '../../lib/money'
import type { Auction } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/sell/')({
  beforeLoad: async ({ location }) => {
    await requireAuth({ redirectTo: location.pathname })
  },
  component: SellContent,
})

function SellContent() {
  const { profile } = useAuth()

  const { data: auctions } = useQuery({
    queryKey: ['my-auctions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('seller_id', profile!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Auction[]
    },
    enabled: !!profile,
  })

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--sea-ink)]">Seller dashboard</h1>
        <Link to="/sell/new">
          <Button>New listing</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {auctions?.map((a) => (
          <li key={a.id}>
            <Card className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{a.title}</h2>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  {a.status} · {formatPhp(a.current_price)}
                </p>
              </div>
              <Link to="/sell/$id/edit" params={{ id: a.id }}>
                <Button variant="secondary">Edit</Button>
              </Link>
            </Card>
          </li>
        ))}
        {!auctions?.length && <Card>No listings yet.</Card>}
      </ul>
    </Page>
  )
}
