import { makeLote } from '@test/factories/make-lote'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { describe, expect, it } from 'vitest'

import { RemessaPresenter } from './remessa-presenter'

describe('RemessaPresenter', () => {
  it('serializa a entidade sem vazar internals e com lotes vazios por padrão', () => {
    const remessa = makeRemessa({
      id: 'remessa-1',
      status: 'consolidada',
      pedidoConsolidadoId: 'pedido-1',
      valorEstimado: 1500.5,
      observacoes: 'obs',
      itens: [makeRemessaItem({ id: 'remessa-item-1', loteId: 'lote-1', quantidade: 100, precoUnitario: 10 })],
    })

    const dto = RemessaPresenter.toHTTP(remessa)

    expect(dto.id).toBe('remessa-1')
    expect(dto.tenantId).toBe('tenant-1')
    expect(dto.empresaFaturadoraId).toBe('empresa-1')
    expect(dto.clienteId).toBe('cliente-1')
    expect(dto.numero).toBe('000001')
    expect(dto.status).toBe('consolidada')
    expect(dto.pedidoConsolidadoId).toBe('pedido-1')
    expect(dto.valorEstimado).toBe(1500.5)
    expect(dto.data).toEqual(new Date('2024-10-01'))
    expect(dto.observacoes).toBe('obs')
    expect(dto.createdAt).toEqual(new Date('2024-01-01'))
    expect(dto.updatedAt).toEqual(new Date('2024-01-01'))
    expect(dto.lotes).toEqual([])
    expect(dto.itens).toHaveLength(1)
    expect(dto.itens[0]).toEqual({
      id: 'remessa-item-1',
      produtoId: 'produto-1',
      loteId: 'lote-1',
      quantidade: 100,
      precoUnitario: 10,
      valorTotal: 1000,
    })
    expect(dto).not.toHaveProperty('props')
    expect(dto).not.toHaveProperty('deletedAt')
  })

  it('preserva campos nullable', () => {
    const remessa = makeRemessa({ pedidoConsolidadoId: null, observacoes: null })
    const dto = RemessaPresenter.toHTTP(remessa)
    expect(dto.pedidoConsolidadoId).toBeNull()
    expect(dto.observacoes).toBeNull()
    expect(dto.itens).toEqual([])
  })

  it('serializa os lotes vinculados via LotePresenter quando fornecidos', () => {
    const remessa = makeRemessa({ id: 'remessa-1' })
    const lote = makeLote({ id: 'lote-1', codigoLote: 'LOTE-007' })

    const dto = RemessaPresenter.toHTTP(remessa, [lote])

    expect(dto.lotes).toHaveLength(1)
    expect(dto.lotes[0].id).toBe('lote-1')
    expect(dto.lotes[0].codigoLote).toBe('LOTE-007')
    expect(dto.lotes[0].tenantId).toBe('tenant-1')
    expect(dto.lotes[0].empresaId).toBe('empresa-1')
    expect(dto.lotes[0].produtoId).toBe('produto-1')
    expect(dto.lotes[0]).not.toHaveProperty('deletedAt')
  })
})
