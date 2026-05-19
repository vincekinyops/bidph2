import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

import { Alert as ShadcnAlert } from '@/components/ui/alert'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Card as ShadcnCard } from '@/components/ui/card'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('page-wrap mx-auto max-w-5xl px-4 pb-12 pt-8', className)}>
      {children}
    </main>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ShadcnCard className={className}>{children}</ShadcnCard>
}

const buttonVariantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
} as const

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  return (
    <ShadcnButton
      variant={buttonVariantMap[variant]}
      className={className}
      {...props}
    />
  )
}

export function Input({
  label,
  className = '',
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputId = id ?? props.name

  if (!label) {
    return <ShadcnInput id={inputId} className={className} {...props} />
  }

  return (
    <div className="block text-sm">
      <Label htmlFor={inputId} className="mb-1 block">
        {label}
      </Label>
      <ShadcnInput id={inputId} className={className} {...props} />
    </div>
  )
}

export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'error' | 'success'
}) {
  const toneClass = {
    info: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
    error: '',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100',
  }

  return (
    <ShadcnAlert
      variant={tone === 'error' ? 'destructive' : 'default'}
      className={tone === 'error' ? undefined : toneClass[tone]}
    >
      {children}
    </ShadcnAlert>
  )
}
