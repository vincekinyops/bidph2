import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { parseMoneyInput } from '../../lib/money'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/sell/new')({
  component: NewAuctionPage,
})

function NewAuctionPage() {
  return (
    <RequireAuth>
      <NewAuctionForm />
    </RequireAuth>
  )
}

function NewAuctionForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startingPrice, setStartingPrice] = useState('100')
  const [minIncrement, setMinIncrement] = useState('10')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function createDraft(e: React.SubmitEvent) {
    e.preventDefault()
    if (!profile) return
    const end = endTime || new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 16)
    const start = parseMoneyInput(startingPrice)
    const { data, error: err } = await supabase
      .from('auctions')
      .insert({
        seller_id: profile.id,
        title,
        description,
        starting_price: start,
        current_price: start,
        min_increment: parseMoneyInput(minIncrement),
        status: 'draft',
        end_time: new Date(end).toISOString(),
      })
      .select('id')
      .single()
    if (err) {
      setError(err.message)
      return
    }
    navigate({ to: '/sell/$id/edit', params: { id: data.id } })
  }

  return (
    <Page className="max-w-lg">
      <Card>
        <h1 className="mb-6 text-2xl font-bold">New auction</h1>
        <form onSubmit={createDraft} className="space-y-4">
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              className="w-full rounded-xl border border-[rgba(23,58,64,0.15)] bg-white/80 px-4 py-2.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <Input
            label="Starting price"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
          />
          <Input
            label="Min increment"
            value={minIncrement}
            onChange={(e) => setMinIncrement(e.target.value)}
          />
          <Input
            label="End time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit">Save draft</Button>
        </form>
      </Card>
    </Page>
  )
}
