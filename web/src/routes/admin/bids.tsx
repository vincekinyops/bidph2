import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui'
import { formatPhp } from '../../lib/money'
import type { Auction, Bid, User, UserPublicProfile } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { formatUserRef } from '../../lib/user'

type AdminBidRow = Bid & {
  auction_title: string
  bidder_ref: string
  bidder_email: string
}

export const Route = createFileRoute('/admin/bids')({
  component: AdminBidsPage,
})

function AdminBidsPage() {
  const { data: bids, isLoading, error } = useQuery({
    queryKey: ['admin-bids'],
    queryFn: async () => {
      const { data: bidRows, error: bidErr } = await supabase
        .from('bids')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (bidErr) throw bidErr
      if (!bidRows?.length) return [] as AdminBidRow[]

      const auctionIds = [...new Set(bidRows.map((b) => b.auction_id))]
      const userIds = [...new Set(bidRows.map((b) => b.user_id))]

      const [{ data: auctions }, { data: users }, { data: profiles }] = await Promise.all([
        supabase.from('auctions').select('id, title').in('id', auctionIds),
        supabase.from('users').select('id, email').in('id', userIds),
        supabase.from('user_public_profiles').select('id, reference_number').in('id', userIds),
      ])

      const titleById = new Map((auctions as Pick<Auction, 'id' | 'title'>[])?.map((a) => [a.id, a.title]))
      const emailById = new Map((users as Pick<User, 'id' | 'email'>[])?.map((u) => [u.id, u.email]))
      const refById = new Map(
        (profiles as UserPublicProfile[])?.map((p) => [p.id, p.reference_number]),
      )

      return bidRows.map((b) => ({
        ...b,
        auction_title: titleById.get(b.auction_id) ?? 'Unknown',
        bidder_ref: formatUserRef(refById.get(b.user_id) ?? '????????'),
        bidder_email: emailById.get(b.user_id) ?? '—',
      })) as AdminBidRow[]
    },
  })

  if (isLoading) return <Card>Loading bids…</Card>
  if (error) return <Card>Could not load bids.</Card>

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All bids</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">Auction</th>
              <th className="px-4 py-3 font-medium">Bidder</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {bids?.map((b) => (
              <tr key={b.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">
                  <Link
                    to="/auctions/$id"
                    params={{ id: b.auction_id }}
                    className="font-medium text-[var(--lagoon-deep)]"
                  >
                    {b.auction_title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{b.bidder_ref}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{b.bidder_email}</td>
                <td className="px-4 py-3 font-semibold">{formatPhp(b.amount)}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                  {new Date(b.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!bids?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">
                  No bids yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
