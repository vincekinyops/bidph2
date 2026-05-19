import { Link, useRouterState } from '@tanstack/react-router'

const links = [
  { to: '/account' as const, label: 'Overview' },
  { to: '/account/profile' as const, label: 'Profile' },
  { to: '/account/kyc' as const, label: 'KYC' },
]

export function AccountNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
      {links.map(({ to, label }) => {
        const active = pathname === to || (to === '/account' && pathname === '/account/')
        return (
          <Link
            key={to}
            to={to}
            className={`rounded-full px-4 py-1.5 text-sm font-medium no-underline transition ${
              active
                ? 'bg-[var(--accent-soft-strong)] text-[var(--lagoon-deep)]'
                : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
