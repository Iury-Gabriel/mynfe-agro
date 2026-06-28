import { describe, expect, it } from 'vitest'

import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'

import { Remessa } from './remessa'

describe(Remessa.name, () => {
  it('cria com defaults (aberta, valorEstimado 0, sem itens)', () => {
    const sut = Remessa.create({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      clienteId: 'cliente-1',
      numero: '000001',
      data: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    expect(sut.status).toBe('aberta')
    expect(sut.valorEstimado).toBe(0)
    expect(sut.itens).toHaveLength(0)
    expect(sut.pedidoConsolidadoId).toBeNull()
    expect(sut.observacoes).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('expõe getters', () => {
    const created = new Date('2024-01-01')
    const sut = makeRemessa({
      status: 'entregue',
      pedidoConsolidadoId: 'pedido-9',
      valorEstimado: 200,
      observacoes: 'obs',
      createdAt: created,
      updatedAt: created,
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaFaturadoraId).toBe('empresa-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.numero).toBe('000001')
    expect(sut.status).toBe('entregue')
    expect(sut.pedidoConsolidadoId).toBe('pedido-9')
    expect(sut.valorEstimado).toBe(200)
    expect(sut.data).toEqual(new Date('2024-10-01'))
    expect(sut.observacoes).toBe('obs')
    expect(sut.createdAt).toBe(created)
    expect(sut.updatedAt).toBe(created)
    expect(sut.deletedAt).toBeNull()
  })

  it('addItem recalcula o valorEstimado', () => {
    const sut = makeRemessa()

    sut.addItem(makeRemessaItem({ id: 'item-1', quantidade: 10, precoUnitario: 5 }))
    sut.addItem(makeRemessaItem({ id: 'item-2', quantidade: 2, precoUnitario: 5 }))

    expect(sut.itens).toHaveLength(2)
    expect(sut.valorEstimado).toBe(60)
  })

  it('marcarEntregue transiciona de aberta para entregue', () => {
    const sut = makeRemessa({ status: 'aberta' })

    const result = sut.marcarEntregue()

    expect(result.isRight()).toBe(true)
    expect(sut.status).toBe('entregue')
  })

  it.each(['entregue', 'consolidada', 'cancelada'] as const)(
    'marcarEntregue falha quando status é %s',
    (status) => {
      const sut = makeRemessa({ status })

      const result = sut.marcarEntregue()

      expect(result.isLeft()).toBe(true)
    },
  )

  it.each(['aberta', 'entregue'] as const)(
    'marcarConsolidada transiciona de %s para consolidada e vincula pedido',
    (status) => {
      const sut = makeRemessa({ status })

      const result = sut.marcarConsolidada('pedido-7')

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('consolidada')
      expect(sut.pedidoConsolidadoId).toBe('pedido-7')
    },
  )

  it.each(['consolidada', 'cancelada'] as const)(
    'marcarConsolidada falha quando status é %s',
    (status) => {
      const sut = makeRemessa({ status })

      const result = sut.marcarConsolidada('pedido-7')

      expect(result.isLeft()).toBe(true)
    },
  )

  it.each(['aberta', 'entregue'] as const)(
    'cancelar transiciona de %s para cancelada',
    (status) => {
      const sut = makeRemessa({ status })

      const result = sut.cancelar()

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('cancelada')
    },
  )

  it.each(['consolidada', 'cancelada'] as const)('cancelar falha quando status é %s', (status) => {
    const sut = makeRemessa({ status })

    const result = sut.cancelar()

    expect(result.isLeft()).toBe(true)
    expect(sut.status).toBe(status)
  })
})
