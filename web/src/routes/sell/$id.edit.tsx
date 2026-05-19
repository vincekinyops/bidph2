import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { RequireAuth } from '../../components/RequireAuth'
import { Alert, Button, Card, Input, Page } from '../../components/ui'
import { formatPhp } from '../../lib/money'
import type { Auction } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/sell/$id/edit')({
  component: EditAuctionPage,
})

function EditAuctionPage() {
  return (
    <RequireAuth>
      <EditAuctionForm />
    </RequireAuth>
  )
}

function EditAuctionForm() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('auctions').select('*').eq('id', id).single()
      if (error) throw error
      return data as Auction
    },
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (auction) {
      setTitle(auction.title)
      setDescription(auction.description ?? '')
    }
  }, [auction])

  async function publish() {
    setError(null)
    const { error: err } = await supabase.rpc('publish_auction', { p_auction_id: id })
    if (err) {
      setError(err.message)
      return
    }
    setMessage('Auction published.')
    await qc.invalidateQueries({ queryKey: ['auction-edit', id] })
  }

  async function settle() {
    await supabase.rpc('end_expired_auctions')
    const { error: err } = await supabase.rpc('settle_auction', { p_auction_id: id })
    if (err) setError(err.message)
    else setMessage('Auction settled.')
    await qc.invalidateQueries({ queryKey: ['auction-edit', id] })
  }

  if (isLoading) {
    return (
      <Page>
        <Card>Loading…</Card>
      </Page>
    )
  }

  if (!auction) {
    return (
      <Page>
        <Card>Not found</Card>
      </Page>
    )
  }

  return (
    <Page className="max-w-lg">
      <Card>
        <h1 className="mb-2 text-2xl font-bold">Edit listing</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          Status: {auction.status} · {formatPhp(auction.current_price)}
        </p>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <textarea
            className="w-full rounded-xl border px-4 py-2.5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <div className="mt-6 flex flex-wrap gap-2">
          {auction.status === 'draft' && (
            <Button onClick={publish}>Publish auction</Button>
          )}
          {(auction.status === 'active' || auction.status === 'ended') && (
            <Button variant="secondary" onClick={settle}>
              End & settle
            </Button>
          )}
        </div>
        {message && (
          <div className="mt-4">
            <Alert tone="success">{message}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>
    </Page>
  )
}
