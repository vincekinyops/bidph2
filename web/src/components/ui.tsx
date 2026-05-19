import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={`page-wrap mx-auto max-w-5xl px-4 pb-12 pt-8 ${className}`}>
      {children}
    </main>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`island-shell rounded-2xl p-6 ${className}`}>{children}</section>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const base =
    'rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
  const styles = {
    primary: 'btn-primary border-0 shadow-md shadow-amber-900/15 hover:scale-[1.02]',
    secondary:
      'border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)] hover:border-slate-300 hover:bg-[var(--link-bg-hover)]',
    danger: 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />
}

export function Input({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-[var(--sea-ink)]">{label}</span>}
      <input
        className={`w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[var(--accent-soft-strong)] ${className}`}
        {...props}
      />
    </label>
  )
}

export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'error' | 'success'
}) {
  const tones = {
    info: 'border-slate-200 bg-slate-50 text-slate-800',
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  )
}
