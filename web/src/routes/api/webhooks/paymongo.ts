import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/webhooks/paymongo')({
  server: {
    handlers: {
      POST: () =>
        Response.json(
          {
            error: {
              code: 'GONE',
              message:
                'PayMongo webhooks moved to bidph-api. POST to http://localhost:3001/api/v1/webhooks/paymongo',
            },
          },
          { status: 410 },
        ),
    },
  },
})
