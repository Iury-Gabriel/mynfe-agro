import { makeLote } from '@test/factories/make-lote'
import { describe, expect, it } from 'vitest'

import { LotePresenter } from './lote-presenter'

describe('LotePresenter', () => {
  it('serializa a entidade sem vazar internals do Prisma', () => {
    const lote = makeLote({
      id: 'lote-1',
      codigoLote: 'LOTE-001',
      quantidadeInicial: 1000,
      quantidadeAtual: 800,
    })

    const dto = LotePresenter.toHTTP(lote)

    expect(dto.id).toBe('lote-1')
    expect(dto.codigoLote).toBe('LOTE-001')
    expect(dto.quantidadeInicial).toBe(1000)
    expect(dto.quantidadeAtual).toBe(800)
    expect(dto.origemTipo).toBe('colheita')
    expect(dto).not.toHaveProperty('props')
    expect(dto).not.toHaveProperty('deletedAt')
  })

  it('preserva campos nullable', () => {
    const lote = makeLote({ origemTipo: 'embalagem', validade: new Date('2025-01-01') })
    const dto = LotePresenter.toHTTP(lote)
    expect(dto.origemTipo).toBe('embalagem')
    expect(dto.colheitaId).toBeNull()
    expect(dto.areaId).toBeNull()
    expect(dto.validade).toEqual(new Date('2025-01-01'))
  })
})
