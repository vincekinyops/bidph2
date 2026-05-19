export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--foam)] px-4 pb-10 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <p className="m-0 text-sm font-medium text-[var(--sea-ink)]">
            &copy; {year} BidPH
          </p>
          <p className="m-0 mt-1 text-sm">Closed-loop wallet auctions for the Philippines.</p>
        </div>
        <p className="island-kicker m-0">GCash · PayMongo · Real-time bidding</p>
      </div>
    </footer>
  )
}
