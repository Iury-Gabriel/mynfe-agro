import { describe, expect, it } from 'vitest'

import { FISCAL_STATUS_LABEL, FISCAL_STATUS_TONE } from './status'

describe('fiscal status maps', () => {
  it('mapeia tom de cada status', () => {
    expect(FISCAL_STATUS_TONE.autorizada).toBe('success')
    expect(FISCAL_STATUS_TONE.pendente).toBe('warning')
    expect(FISCAL_STATUS_TONE.emitindo).toBe('warning')
    expect(FISCAL_STATUS_TONE.rejeitada).toBe('danger')
    expect(FISCAL_STATUS_TONE.cancelada).toBe('neutral')
  })

  it('mapeia label de cada status', () => {
    expect(FISCAL_STATUS_LABEL.autorizada).toBe('Autorizada')
    expect(FISCAL_STATUS_LABEL.cancelada).toBe('Cancelada')
  })
})
