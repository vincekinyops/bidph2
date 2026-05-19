import { describe, expect, it } from 'vitest'
import { formatPhp, parseMoneyInput } from './money'

describe('money', () => {
  it('formats PHP currency', () => {
    expect(formatPhp(1500)).toMatch(/1,500/)
  })

  it('parses input strings', () => {
    expect(parseMoneyInput('₱2,500.50')).toBe(2500.5)
  })
})
