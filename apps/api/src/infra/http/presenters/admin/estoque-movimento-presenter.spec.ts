import { makeEstoqueMovimento } from '@test/factories/make-estoque-movimento'
import { describe, expect, it } from 'vitest'

import { EstoqueMovimentoPresenter } from './estoque-movimento-presenter'

describe('EstoqueMovimentoPresenter', () => {
  it('serializa a entidade sem vazar internals do Prisma', () => {
    const movimento = makeEstoqueMovimento({
      id: 'movimento-1',
      tipo: 'ajuste',
      origem: 'ajuste',
      quantidade: -25.5,
      motivo: 'perda',
      loteId: 'lote-1',
    })

    const dto = EstoqueMovimentoPresenter.toHTTP(movimento)

    expect(dto.id).toBe('movimento-1')
    expect(dto.tipo).toBe('ajuste')
    expect(dto.origem).toBe('ajuste')
    expect(dto.quantidade).toBe(-25.5)
    expect(dto.motivo).toBe('perda')
    expect(dto.loteId).toBe('lote-1')
    expect(dto).not.toHaveProperty('props')
    expect(dto).not.toHaveProperty('deletedAt')
  })

  it('preserva campos nullable', () => {
    const movimento = makeEstoqueMovimento({ loteId: null, referenciaId: null, usuarioId: null, motivo: null })
    const dto = EstoqueMovimentoPresenter.toHTTP(movimento)
    expect(dto.loteId).toBeNull()
    expect(dto.referenciaId).toBeNull()
    expect(dto.usuarioId).toBeNull()
    expect(dto.motivo).toBeNull()
  })
})
