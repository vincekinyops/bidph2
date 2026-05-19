import { Link } from '@tanstack/react-router'
import {
  Bell,
  ChevronDown,
  Gavel,
  Menu,
  Shield,
  Smartphone,
  Star,
  Trophy,
  UserPlus,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import LandingTrendingHero from './LandingTrendingHero'

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#live-auctions', label: 'Live Auctions' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create Account',
    description:
      'Sign up in seconds with email or social login. Complete KYC once to unlock secure bidding and wallet features.',
  },
  {
    icon: Gavel,
    title: 'Place Your Bid',
    description:
      'Fund your wallet via GCash, allocate to your bidding balance, and join live auctions with real-time updates.',
  },
  {
    icon: Trophy,
    title: 'Win & Save',
    description:
      'Outbid the competition, win premium items at unbeatable prices, and receive them through our trusted checkout flow.',
  },
]

const LIVE_AUCTIONS = [
  {
    name: 'MacBook Pro 14" M3',
    image: 'from-slate-100 to-slate-200',
    timer: '01:12:45',
    bid: '₱42,500',
  },
  {
    name: 'DJI Mini 4 Pro Drone',
    image: 'from-sky-50 to-blue-100',
    timer: '00:28:17',
    bid: '₱18,900',
  },
  {
    name: 'Rolex Submariner Date',
    image: 'from-amber-50 to-yellow-100',
    timer: '02:45:03',
    bid: '₱385,000',
  },
]

const FEATURES = [
  {
    title: 'Secure Payments',
    description:
      'Your funds stay protected in a closed-loop wallet powered by PayMongo and GCash. Every transaction is encrypted, verified, and fully traceable.',
    icon: Shield,
    image: 'from-emerald-50 to-teal-100',
  },
  {
    title: 'Real-Time Notifications',
    description:
      'Never miss a moment. Get instant alerts when you\'re outbid, when auctions are ending, and when you win — so you can act fast.',
    icon: Bell,
    image: 'from-indigo-50 to-violet-100',
  },
]

const TESTIMONIALS = [
  {
    name: 'Maria Santos',
    location: 'Makati City',
    quote:
      'I won a brand-new iPhone for half the retail price. The bidding experience feels premium and the wallet system keeps me in control.',
    avatar: 'MS',
  },
  {
    name: 'James Rivera',
    location: 'Cebu',
    quote:
      'Real-time updates are flawless. I got notified the second I was outbid and snatched the win back. Best auction platform in the PH.',
    avatar: 'JR',
  },
  {
    name: 'Angela Cruz',
    location: 'Quezon City',
    quote:
      'GCash integration makes funding effortless. I love allocating exactly what I want to spend — no surprise charges, ever.',
    avatar: 'AC',
  },
]

const FAQS = [
  {
    question: 'How does bidding work on BidPH?',
    answer:
      'Browse live auctions, allocate funds from your wallet to your bidding balance, and place bids in real time. The highest bid when the timer ends wins the item.',
  },
  {
    question: 'Is my money safe?',
    answer:
      'Yes. BidPH uses a closed-loop wallet with PayMongo and GCash. Funds remain on-platform until you cash out or pay for a won auction.',
  },
  {
    question: 'Do I need to verify my identity?',
    answer:
      'KYC verification is required before cash-ins. Upload a valid Philippine government ID and a selfie — approval typically takes 24–48 hours.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'We currently support GCash for deposits and payouts. More payment options are coming soon.',
  },
  {
    question: 'Can I sell items on BidPH?',
    answer:
      'Absolutely. Register as a seller, list your items with photos and details, set your starting price, and let bidders compete.',
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-slate-200/80 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-slate-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-amber-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-slate-600">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add('landing-route')
    return () => document.documentElement.classList.remove('landing-route')
  }, [])

  return (
    <div className="landing-page min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5 no-underline text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md">
              <Gavel className="h-[18px] w-[18px] text-amber-300" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              <span>Bid</span>
              <span className="font-semibold text-amber-700">PH</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="landing-nav-link text-sm no-underline">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="landing-btn-primary hidden rounded-full px-5 py-2.5 text-sm font-semibold no-underline shadow-md shadow-amber-900/20 transition hover:scale-105 sm:inline-block"
            >
              Start bidding
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-800 md:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav className="border-t border-slate-100 px-4 py-4 md:hidden" aria-label="Mobile">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="landing-nav-link-mobile block rounded-lg px-3 py-2.5 text-sm no-underline"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/register"
                  className="landing-btn-primary mt-2 block rounded-full px-5 py-2.5 text-center text-sm font-semibold no-underline"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Start bidding
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(251,191,36,0.12),transparent)]" />
          <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
                <Zap className="h-3.5 w-3.5" />
                Live auctions · Philippines
              </p>
              <h1 className="mb-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
                Bid, Win, and Save on{' '}
                <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Amazing Products
                </span>
              </h1>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-slate-600">
                Join thousands in real-time auctions starting at just ₱1. Secure wallet, instant
                notifications, and premium items — all in your browser.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/auctions"
                  className="landing-btn-primary rounded-full px-6 py-3 text-sm font-semibold no-underline shadow-md shadow-amber-900/20 transition hover:scale-105"
                >
                  Browse live auctions
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 no-underline transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Create account
                </Link>
              </div>
              <p className="mt-6 text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-slate-900 no-underline hover:text-amber-700">
                  Sign in
                </Link>{' '}
                or{' '}
                <Link to="/auctions" className="font-semibold text-slate-900 no-underline hover:text-amber-700">
                  browse live auctions
                </Link>
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
              <LandingTrendingHero />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Start Winning in 3 Easy Steps
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                From sign-up to your first win — it takes less than five minutes.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
                >
                  <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-amber-300">
                    {i + 1}
                  </span>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-md transition group-hover:scale-105">
                    <step.icon className="h-7 w-7 text-amber-300" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Auctions */}
        <section id="live-auctions" className="relative py-20 sm:py-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Trending Live Auctions
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Hot items ending soon — place your bid before time runs out.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {LIVE_AUCTIONS.map((item) => (
                <article
                  key={item.name}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div className={`aspect-[4/3] bg-gradient-to-br ${item.image}`}>
                    <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                      Product image
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <span className="shrink-0 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Live
                      </span>
                    </div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Time left
                      </p>
                      <p className="font-mono text-sm font-bold text-red-500">{item.timer}</p>
                    </div>
                    <p className="text-xs text-slate-500">Current Bid</p>
                    <p className="mb-4 text-xl font-bold text-slate-900">{item.bid}</p>
                    <Link
                      to="/auctions"
                      className="landing-btn-dark block w-full rounded-xl py-3 text-center text-sm font-semibold no-underline shadow-md transition hover:scale-[1.01]"
                    >
                      View & Bid
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Built for Trust & Speed
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Enterprise-grade security meets the thrill of live bidding.
              </p>
            </div>

            <div className="flex flex-col gap-20">
              {FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
                >
                  <div>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
                      <feature.icon className="h-6 w-6 text-amber-300" />
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-base leading-relaxed text-slate-600">{feature.description}</p>
                  </div>
                  <div
                    className={`aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${feature.image} shadow-inner`}
                  >
                    <div className="flex h-full items-center justify-center">
                      <Smartphone className="h-16 w-16 text-slate-300" strokeWidth={1.25} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Loved by Bidders Nationwide
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Real stories from real winners across the Philippines.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <StarRating />
                  <p className="my-4 flex-1 text-sm leading-relaxed text-slate-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="flex items-center gap-3 border-t border-slate-100 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-bold text-amber-300">
                      {t.avatar}
                    </div>
                    <div>
                      <cite className="not-italic font-semibold text-slate-900">{t.name}</cite>
                      <p className="text-xs text-slate-500">{t.location}</p>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-slate-600">Everything you need to know before your first bid.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white px-6 shadow-sm">
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-12 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center sm:p-12">
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
              Ready to Start Winning?
            </h2>
            <p className="mx-auto mb-6 max-w-md text-slate-400">
              Join BidPH on the web and compete in the next live auction. Your first bid is one click
              away.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/auctions"
                className="landing-btn-primary rounded-full px-8 py-3 text-sm font-semibold no-underline transition hover:scale-105"
              >
                Browse live auctions
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-white/25 px-8 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/10"
              >
                Create account
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                  <Gavel className="h-4 w-4 text-amber-300" />
                </span>
                <span className="text-lg font-bold text-white">
                  Bid<span className="text-amber-300">PH</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Premium live auctions for the Philippine market. Bid smart, win big.
              </p>
            </div>

            {[
              { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Blog'] },
              { title: 'Platform', links: ['Features', 'Pricing', 'Auctions', 'Updates'] },
              { title: 'Support', links: ['Help Center', 'Contact', 'Trust & Safety', 'Community'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-300 no-underline transition hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} BidPH Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              {['Facebook', 'Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-sm text-slate-300 no-underline transition hover:text-white"
                  aria-label={social}
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
