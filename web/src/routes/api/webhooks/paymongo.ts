import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { createServiceClient } from '../../../lib/supabase'

export const Route = createFileRoute('/api/webhooks/paymongo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>
        try {
          body = await request.json()
        } catch {
          return json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const data = body.data as Record<string, unknown> | undefined
        const attributes = data?.attributes as Record<string, unknown> | undefined
        const externalId = (data?.id as string) ?? `evt-${Date.now()}`
        const amountCentavos = attributes?.amount as number | undefined
        const metadata = attributes?.metadata as Record<string, string> | undefined
        const userId = metadata?.user_id
        const amount = amountCentavos ? amountCentavos / 100 : 0

        if (!userId || amount <= 0) {
          return json({ error: 'Missing user_id or amount in metadata' }, { status: 400 })
        }

        try {
          const supabase = createServiceClient()
          const { error } = await supabase.rpc('process_cash_in_webhook', {
            p_external_id: externalId,
            p_event_type: (body.type as string) ?? 'payment.paid',
            p_payload: body,
            p_user_id: userId,
            p_amount: amount,
            p_idempotency_key: externalId,
          })
          if (error) {
            return json({ error: error.message }, { status: 500 })
          }
          return json({ received: true })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Server error'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
