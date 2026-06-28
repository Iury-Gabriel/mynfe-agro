import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeRemessa } from '@test/factories/make-remessa'
import { describe, expect, it } from 'vitest'

import { PedidoPresenter } from './pedido-presenter'

describe('PedidoPresenter', () => {
  it('serializa a entidade sem vazar internals e com remessas vazias por padrão', () => {
    const pedido = makePedido({
      id: 'pedido-1',
      tipo: 'consolidado',
      status: 'confirmado',
      valorTotal: 1500.5,
      periodoConsolidacao: new Date('2024-09-30'),
      observacoes: 'obs',
      itens: [makePedidoItem({ id: 'pedido-item-1', loteId: 'lote-1', quantidade: 100, precoUnitario: 10 })],
    })

    const dto = PedidoPresenter.toHTTP(pedido)

    expect(dto.id).toBe('pedido-1')
    expect(dto.tenantId).toBe('tenant-1')
    expect(dto.empresaFaturadoraId).toBe('empresa-1')
    expect(dto.clienteId).toBe('cliente-1')
    expect(dto.numero).toBe('000001')
    expect(dto.tipo).toBe('consolidado')
    expect(dto.status).toBe('confirmado')
    expect(dto.valorTotal).toBe(1500.5)
    expect(dto.periodoConsolidacao).toEqual(new Date('2024-09-30'))
    expect(dto.data).toEqual(new Date('2024-10-01'))
    expect(dto.observacoes).toBe('obs')
    expect(dto.createdAt).toEqual(new Date('2024-01-01'))
    expect(dto.updatedAt).toEqual(new Date('2024-01-01'))
    expect(dto.remessas).toEqual([])
    expect(dto.itens).toHaveLength(1)
    expect(dto.itens[0]).toEqual({
      id: 'pedido-item-1',
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
    const pedido = makePedido({ periodoConsolidacao: null, observacoes: null })
    const dto = PedidoPresenter.toHTTP(pedido)
    expect(dto.periodoConsolidacao).toBeNull()
    expect(dto.observacoes).toBeNull()
    expect(dto.itens).toEqual([])
  })

  it('mapeia o vínculo das remessas quando fornecidas', () => {
    const pedido = makePedido({ id: 'pedido-1' })
    const remessa = makeRemessa({
      id: 'remessa-1',
      numero: '000007',
      status: 'entregue',
      valorEstimado: 500,
    })

    const dto = PedidoPresenter.toHTTP(pedido, [remessa])

    expect(dto.remessas).toHaveLength(1)
    expect(dto.remessas[0]).toEqual({
      id: 'remessa-1',
      numero: '000007',
      status: 'entregue',
      valorEstimado: 500,
    })
  })
})
