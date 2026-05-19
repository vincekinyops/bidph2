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
    'rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    primary:
      'border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)] hover:bg-[rgba(79,184,178,0.24)]',
    secondary:
      'border border-[rgba(23,58,64,0.2)] bg-white/50 text-[var(--sea-ink)] hover:border-[rgba(23,58,64,0.35)]',
    danger: 'border border-red-300 bg-red-50 text-red-800 hover:bg-red-100',
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
        className={`w-full rounded-xl border border-[rgba(23,58,64,0.15)] bg-white/80 px-4 py-2.5 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)] ${className}`}
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
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    error: 'bg-red-50 text-red-900 border-red-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
  )
}
