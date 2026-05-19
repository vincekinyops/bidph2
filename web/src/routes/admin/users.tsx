import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui'
import type { User } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      if (err) throw err
      return data as User[]
    },
  })

  if (isLoading) return <Card>Loading users…</Card>
  if (error) return <Card>Could not load users.</Card>

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">All users</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-[var(--sea-ink-soft)]">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ref</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">KYC</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.reference_number}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span className="capitalize">{u.kyc_status}</span>
                  {u.kyc_status === 'pending' && (
                    <Link to="/admin/kyc" className="ml-2 text-[var(--lagoon-deep)]">
                      Review
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
