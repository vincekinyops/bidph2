import { Link } from '@tanstack/react-router'

const links = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/auctions', label: 'Auctions' },
  { to: '/admin/bids', label: 'Bids' },
  { to: '/admin/kyc', label: 'KYC review' },
] as const

export function AdminNav() {
  return (
    <nav className="w-44 shrink-0 space-y-1 text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        Admin
      </p>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          className="block rounded-lg px-3 py-2 font-medium text-[var(--sea-ink-soft)] no-underline hover:bg-[var(--accent-soft)] hover:text-[var(--sea-ink)] [&.active]:bg-[var(--accent-soft)] [&.active]:text-[var(--lagoon-deep)]"
          activeProps={{ className: 'active' }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
