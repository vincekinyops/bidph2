import { createFileRoute } from '@tanstack/react-router'
import { routerRedirect } from '../../lib/router-redirect'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    routerRedirect({ to: '/admin/users' })
  },
})
