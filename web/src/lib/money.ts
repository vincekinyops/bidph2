const formatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
})

export function formatPhp(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return formatter.format(Number.isFinite(n) ? n : 0)
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}
