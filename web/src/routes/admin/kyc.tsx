import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card } from '../../components/ui'
import type { KycSubmission } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/kyc')({
  component: AdminKycPage,
})

function AdminKycPage() {
  const qc = useQueryClient()
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true })
      if (error) throw error
      return data as KycSubmission[]
    },
  })

  async function review(id: string, status: 'approved' | 'rejected') {
    await supabase.rpc('review_kyc_submission', {
      p_submission_id: id,
      p_status: status,
      p_rejection_reason: status === 'rejected' ? 'Documents unclear' : null,
    })
    await qc.invalidateQueries({ queryKey: ['kyc-pending'] })
    await qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  if (isLoading) return <Card>Loading KYC queue…</Card>

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">KYC review</h2>
      <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
        Approve users so they can bid, cash in, and sell. Rejected users may resubmit.
      </p>
      <ul className="space-y-4">
        {submissions?.map((s) => (
          <li key={s.id}>
            <Card>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                User {s.user_id} · {new Date(s.submitted_at).toLocaleString()}
              </p>
              <p className="text-xs">ID: {s.government_id_path}</p>
              <p className="text-xs">Selfie: {s.selfie_path}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => review(s.id, 'approved')}>Approve</Button>
                <Button variant="danger" onClick={() => review(s.id, 'rejected')}>
                  Reject
                </Button>
              </div>
            </Card>
          </li>
        ))}
        {!submissions?.length && <Card>No pending submissions.</Card>}
      </ul>
    </div>
  )
}
