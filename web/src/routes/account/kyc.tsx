import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/account/kyc')({
  component: KycPage,
})

function KycPage() {
  return (
    <RequireAuth>
      <KycForm />
    </RequireAuth>
  )
}

function KycForm() {
  const { profile, refreshProfile } = useAuth()
  const [govId, setGovId] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function upload(file: File, path: string) {
    const { error: err } = await supabase.storage.from('kyc-documents').upload(path, file, {
      upsert: true,
    })
    if (err) throw err
    return path
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !govId || !selfie) {
      setError('Both government ID and selfie are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const base = `${profile.id}/${Date.now()}`
      const govPath = await upload(govId, `${base}-id-${govId.name}`)
      const selfiePath = await upload(selfie, `${base}-selfie-${selfie.name}`)

      const { error: insertErr } = await supabase.from('kyc_submissions').insert({
        user_id: profile.id,
        government_id_path: govPath,
        selfie_path: selfiePath,
        status: 'pending',
      })
      if (insertErr) throw insertErr

      await supabase.from('users').update({ kyc_status: 'pending' }).eq('id', profile.id)
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page className="max-w-lg">
      <Card>
        <h1 className="mb-4 text-2xl font-bold text-[var(--sea-ink)]">KYC verification</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Upload one valid Philippine government ID and a selfie. Cash-in is enabled after admin
          approval.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Government ID</span>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setGovId(e.target.files?.[0] ?? null)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Selfie</span>
            <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} />
          </label>
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">Submitted. Await admin review.</Alert>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading…' : 'Submit for review'}
          </Button>
        </form>
      </Card>
    </Page>
  )
}
