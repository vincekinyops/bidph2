import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert, Button, Card } from '../../components/ui'
import type { KycSubmission, User } from '../../lib/database.types'
import { formatUserRef } from '../../lib/user'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/admin/kyc')({
  component: AdminKycPage,
})

function AdminKycPage() {
  const qc = useQueryClient()
  const [bypassError, setBypassError] = useState<string | null>(null)
  const [bypassingId, setBypassingId] = useState<string | null>(null)

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

  const { data: needsBypass, isLoading: bypassLoading } = useQuery({
    queryKey: ['kyc-needs-bypass'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('kyc_status', 'approved')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as User[]
    },
  })

  async function review(id: string, status: 'approved' | 'rejected') {
    await supabase.rpc('review_kyc_submission', {
      p_submission_id: id,
      p_status: status,
      p_rejection_reason: status === 'rejected' ? 'Documents unclear' : null,
    })
    await qc.invalidateQueries({ queryKey: ['kyc-pending'] })
    await qc.invalidateQueries({ queryKey: ['kyc-needs-bypass'] })
    await qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  async function bypassKyc(userId: string) {
    setBypassError(null)
    setBypassingId(userId)
    const { error } = await supabase.rpc('admin_bypass_kyc', { p_user_id: userId })
    setBypassingId(null)
    if (error) {
      setBypassError(error.message)
      return
    }
    await qc.invalidateQueries({ queryKey: ['kyc-pending'] })
    await qc.invalidateQueries({ queryKey: ['kyc-needs-bypass'] })
    await qc.invalidateQueries({ queryKey: ['admin-users'] })
  }

  if (isLoading || bypassLoading) return <Card>Loading KYC queue…</Card>

  return (
    <div className="space-y-10">
      <section>
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
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">KYC bypass</h2>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Approve users who have not submitted documents (unverified) or were rejected — no upload
          required. They can bid and use the wallet immediately.
        </p>
        {bypassError && (
          <div className="mb-4">
            <Alert tone="error">{bypassError}</Alert>
          </div>
        )}
        <ul className="space-y-3">
          {needsBypass?.map((u) => (
            <li key={u.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-[var(--sea-ink)]">{u.email}</p>
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    {formatUserRef(u.reference_number)} · {u.role} ·{' '}
                    <span className="capitalize">{u.kyc_status}</span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={bypassingId === u.id}
                  onClick={() => bypassKyc(u.id)}
                >
                  {bypassingId === u.id ? 'Approving…' : 'Bypass KYC'}
                </Button>
              </Card>
            </li>
          ))}
          {!needsBypass?.length && (
            <Card>All users are KYC-approved.</Card>
          )}
        </ul>
      </section>
    </div>
  )
}
