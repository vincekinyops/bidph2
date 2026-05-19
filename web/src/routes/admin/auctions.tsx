import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui'
import { formatPhp } from '../../lib/money'
import type { Auction } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/auctions')({
  component: AdminAuctionsPage,
})

function AdminAuctionsPage() {
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ['admin-auctions'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('auctions')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      return data as Auction[]
    },
  })

  if (isLoading) return <Card>Loading auctions…</Card>
  if (error) return <Card>Could not load auctions.</Card>

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All auctions</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Ends</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {auctions?.map((a) => (
              <tr key={a.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3 capitalize">{a.status}</td>
                <td className="px-4 py-3">{formatPhp(a.current_price)}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                  {new Date(a.end_time).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/auctions/$id"
                    params={{ id: a.id }}
                    className="text-[var(--lagoon-deep)]"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!auctions?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">
                  No auctions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
