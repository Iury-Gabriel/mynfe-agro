import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { describe, expect, it } from 'vitest'

import { EstoqueSaldoPresenter } from './estoque-saldo-presenter'

describe('EstoqueSaldoPresenter', () => {
  it('serializa a entidade sem vazar internals do Prisma', () => {
    const saldo = makeEstoqueSaldo({
      id: 'saldo-1',
      loteId: 'lote-1',
      quantidadeDisponivel: 500,
      quantidadeReservada: 50,
    })

    const dto = EstoqueSaldoPresenter.toHTTP(saldo)

    expect(dto.id).toBe('saldo-1')
    expect(dto.loteId).toBe('lote-1')
    expect(dto.quantidadeDisponivel).toBe(500)
    expect(dto.quantidadeReservada).toBe(50)
    expect(dto).not.toHaveProperty('props')
  })

  it('preserva loteId null (saldo agregado sem lote)', () => {
    const saldo = makeEstoqueSaldo({ loteId: null })
    const dto = EstoqueSaldoPresenter.toHTTP(saldo)
    expect(dto.loteId).toBeNull()
  })
})
