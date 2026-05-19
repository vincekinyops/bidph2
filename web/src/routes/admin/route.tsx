import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdminNav } from '../../components/admin/AdminNav'
import { Page } from '../../components/ui'
import { requireAdmin } from '../../lib/route-guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => requireAdmin(),
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <Page className="max-w-6xl">
      <div className="mb-8">
        <p className="island-kicker mb-1">Administration</p>
        <h1 className="text-3xl font-bold text-[var(--sea-ink)]">Platform overview</h1>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <AdminNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </Page>
  )
}
