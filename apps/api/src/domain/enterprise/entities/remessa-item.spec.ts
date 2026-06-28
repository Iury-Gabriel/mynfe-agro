import { describe, expect, it } from 'vitest'

import { makeRemessaItem } from '@test/factories/make-remessa-item'

import { RemessaItem } from './remessa-item'

describe(RemessaItem.name, () => {
  it('calcula valorTotal a partir de quantidade x precoUnitario quando omitido', () => {
    const sut = RemessaItem.create({
      tenantId: 'tenant-1',
      remessaId: 'remessa-1',
      produtoId: 'produto-1',
      quantidade: 8,
      precoUnitario: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    expect(sut.valorTotal).toBe(40)
    expect(sut.loteId).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('respeita valorTotal explícito', () => {
    const sut = makeRemessaItem({ quantidade: 10, precoUnitario: 5, valorTotal: 77 })

    expect(sut.valorTotal).toBe(77)
  })

  it('expõe getters', () => {
    const created = new Date('2024-01-01')
    const sut = makeRemessaItem({
      tenantId: 'tenant-1',
      remessaId: 'remessa-9',
      produtoId: 'produto-9',
      loteId: 'lote-9',
      quantidade: 3,
      precoUnitario: 7,
      valorTotal: 21,
      createdAt: created,
      updatedAt: created,
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.remessaId).toBe('remessa-9')
    expect(sut.produtoId).toBe('produto-9')
    expect(sut.loteId).toBe('lote-9')
    expect(sut.quantidade).toBe(3)
    expect(sut.precoUnitario).toBe(7)
    expect(sut.valorTotal).toBe(21)
    expect(sut.createdAt).toBe(created)
    expect(sut.updatedAt).toBe(created)
    expect(sut.deletedAt).toBeNull()
  })
})
