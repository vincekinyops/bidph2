import { Link } from '@tanstack/react-router'
import { Gavel } from 'lucide-react'
import { useAuth } from '../lib/auth'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { authUser, profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-xl">
      <div className="page-wrap flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 shadow-sm">
            <Gavel className="h-4 w-4 text-amber-300" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--sea-ink)]">
            Bid<span className="font-semibold text-[var(--lagoon)]">PH</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link to="/auctions" className="nav-link no-underline">
            Auctions
          </Link>
          {authUser && (
            <>
              <Link to="/wallet" className="nav-link no-underline">
                Wallet
              </Link>
              <Link to="/sell" className="nav-link no-underline">
                Sell
              </Link>
              <Link to="/account" className="nav-link no-underline">
                Account
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin/kyc" className="nav-link no-underline">
                  Admin
                </Link>
              )}
            </>
          )}
          {authUser ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="nav-link border-0 bg-transparent p-0 text-sm font-medium"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/register"
              className="btn-primary rounded-full px-4 py-2 text-sm font-semibold no-underline shadow-md shadow-amber-900/15"
            >
              Start bidding
            </Link>
          )}
          {!authUser && (
            <Link to="/login" className="nav-link no-underline">
              Login
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
