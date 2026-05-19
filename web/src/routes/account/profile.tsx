import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/account/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileForm />
    </RequireAuth>
  )
}

function ProfileForm() {
  const { profile, refreshProfile } = useAuth()
  const [fullLegalName, setFullLegalName] = useState(profile?.full_legal_name ?? '')
  const [currentAddress, setCurrentAddress] = useState(profile?.current_address ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? '')
  const [gcashMobile, setGcashMobile] = useState(profile?.gcash_mobile ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(e: React.SubmitEvent) {
    e.preventDefault()
    if (!profile) return
    setError(null)
    const { error: err } = await supabase
      .from('users')
      .update({
        full_legal_name: fullLegalName,
        current_address: currentAddress,
        date_of_birth: dateOfBirth || null,
        gcash_mobile: gcashMobile,
      })
      .eq('id', profile.id)
    if (err) {
      setError(err.message)
      return
    }
    await refreshProfile()
    setMessage('Profile saved.')
  }

  return (
    <Page className="max-w-lg">
      <Card>
        <h1 className="mb-2 text-2xl font-bold text-[var(--sea-ink)]">Profile & KYC info</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          KYC status: <strong>{profile?.kyc_status}</strong>
        </p>
        <form onSubmit={save} className="space-y-4">
          <Input label="Full legal name" value={fullLegalName} onChange={(e) => setFullLegalName(e.target.value)} />
          <Input label="Current address" value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} />
          <Input label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          <Input label="GCash mobile" value={gcashMobile} onChange={(e) => setGcashMobile(e.target.value)} placeholder="09XXXXXXXXX" />
          {message && <Alert tone="success">{message}</Alert>}
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit">Save profile</Button>
        </form>
        <p className="mt-4 text-sm">
          <Link to="/account/kyc" className="text-[var(--lagoon-deep)]">
            Upload KYC documents →
          </Link>
        </p>
      </Card>
    </Page>
  )
}
