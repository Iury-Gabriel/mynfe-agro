import { describe, expect, it } from 'vitest'

import { formatCurrency, formatDate, formatQty } from './format'

describe('vendas/lib/format', () => {
  it('formatDate retorna travessão para valor nulo', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('formatDate retorna travessão para data inválida', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('formatDate formata data válida em pt-BR', () => {
    expect(formatDate('2026-06-20T12:00:00.000Z')).toBe('20/06/2026')
  })

  it('formatQty formata número em pt-BR', () => {
    expect(formatQty(1500)).toBe('1.500')
  })

  it('formatCurrency formata em BRL', () => {
    expect(formatCurrency(8940)).toContain('8.940')
  })
})
