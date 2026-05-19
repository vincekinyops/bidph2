import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { authUser, profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(23,58,64,0.08)] bg-[var(--sand)]/90 backdrop-blur-md">
      <div className="page-wrap flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-[var(--sea-ink)] no-underline">
          BidPH
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link to="/" className="text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]">
            Auctions
          </Link>
          {authUser && (
            <>
              <Link to="/wallet" className="text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]">
                Wallet
              </Link>
              <Link to="/sell" className="text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]">
                Sell
              </Link>
              <Link
                to="/account/profile"
                className="text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]"
              >
                Account
              </Link>
              {profile?.role === 'admin' && (
                <Link
                  to="/admin/kyc"
                  className="text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]"
                >
                  Admin
                </Link>
              )}
            </>
          )}
          {authUser ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            >
              Sign out
            </button>
          ) : (
            <Link to="/login" className="text-[var(--lagoon-deep)] no-underline">
              Login
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
