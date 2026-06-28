import { describe, expect, it } from 'vitest'

import { formatDate, formatQty } from './format'

describe('format', () => {
  it('formatDate retorna traço para null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('formatDate retorna traço para data inválida', () => {
    expect(formatDate('não-é-data')).toBe('—')
  })

  it('formatDate formata ISO em pt-BR', () => {
    expect(formatDate('2026-06-12T00:00:00.000Z')).toMatch(/2026/)
  })

  it('formatQty formata número em pt-BR', () => {
    expect(formatQty(1240)).toBe('1.240')
  })
})
