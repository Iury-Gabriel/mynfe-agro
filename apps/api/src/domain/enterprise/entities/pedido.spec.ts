import { describe, expect, it } from 'vitest'

import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'

import { Pedido } from './pedido'

describe(Pedido.name, () => {
  it('cria com defaults (rascunho, total 0, sem itens)', () => {
    const sut = Pedido.create({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      clienteId: 'cliente-1',
      numero: '000001',
      tipo: 'avulso',
      data: new Date('2024-10-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    expect(sut.status).toBe('rascunho')
    expect(sut.valorTotal).toBe(0)
    expect(sut.itens).toHaveLength(0)
    expect(sut.periodoConsolidacao).toBeNull()
    expect(sut.observacoes).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('expõe getters', () => {
    const created = new Date('2024-01-01')
    const sut = makePedido({
      tipo: 'consolidado',
      status: 'confirmado',
      valorTotal: 500,
      periodoConsolidacao: new Date('2024-10-01'),
      observacoes: 'obs',
      createdAt: created,
      updatedAt: created,
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaFaturadoraId).toBe('empresa-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.numero).toBe('000001')
    expect(sut.tipo).toBe('consolidado')
    expect(sut.status).toBe('confirmado')
    expect(sut.valorTotal).toBe(500)
    expect(sut.periodoConsolidacao).toEqual(new Date('2024-10-01'))
    expect(sut.data).toEqual(new Date('2024-10-01'))
    expect(sut.observacoes).toBe('obs')
    expect(sut.createdAt).toBe(created)
    expect(sut.updatedAt).toBe(created)
    expect(sut.deletedAt).toBeNull()
  })

  it('addItem recalcula o total', () => {
    const sut = makePedido()

    sut.addItem(makePedidoItem({ id: 'item-1', quantidade: 10, precoUnitario: 5 }))
    sut.addItem(makePedidoItem({ id: 'item-2', quantidade: 4, precoUnitario: 5 }))

    expect(sut.itens).toHaveLength(2)
    expect(sut.valorTotal).toBe(70)
  })

  it('confirmar transiciona de rascunho para confirmado', () => {
    const sut = makePedido({ status: 'rascunho' })

    const result = sut.confirmar()

    expect(result.isRight()).toBe(true)
    expect(sut.status).toBe('confirmado')
  })

  it('confirmar falha quando não está em rascunho', () => {
    const sut = makePedido({ status: 'confirmado' })

    const result = sut.confirmar()

    expect(result.isLeft()).toBe(true)
    expect(sut.status).toBe('confirmado')
  })

  it('cancelar transiciona de rascunho para cancelado', () => {
    const sut = makePedido({ status: 'rascunho' })

    const result = sut.cancelar()

    expect(result.isRight()).toBe(true)
    expect(sut.status).toBe('cancelado')
  })

  it('cancelar transiciona de confirmado para cancelado', () => {
    const sut = makePedido({ status: 'confirmado' })

    const result = sut.cancelar()

    expect(result.isRight()).toBe(true)
    expect(sut.status).toBe('cancelado')
  })

  it.each(['faturado', 'cancelado'] as const)('cancelar falha quando status é %s', (status) => {
    const sut = makePedido({ status })

    const result = sut.cancelar()

    expect(result.isLeft()).toBe(true)
    expect(sut.status).toBe(status)
  })
})
