import { makeNotaFiscalItem } from '@test/factories/make-nota-fiscal-item'
import { describe, expect, it } from 'vitest'


import { NotaFiscalItem } from './nota-fiscal-item'

describe(NotaFiscalItem.name, () => {
  it('cria com defaults (sem campos fiscais, valorTotal calculado, impostos vazio)', () => {
    const sut = NotaFiscalItem.create({
      tenantId: 'tenant-1',
      notaFiscalId: 'nota-1',
      produtoId: 'produto-1',
      descricao: 'Milho',
      quantidade: 10,
      valorUnitario: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.ncm).toBeNull()
    expect(sut.cfop).toBeNull()
    expect(sut.cstCsosn).toBeNull()
    expect(sut.valorTotal).toBe(50)
    expect(sut.impostos).toEqual({})
  })

  it('expõe getters', () => {
    const sut = makeNotaFiscalItem({
      ncm: '12019000',
      cfop: '5101',
      cstCsosn: '102',
      impostos: { icms: { aliquota: 12 } },
    })

    expect(sut.id.toString()).toBe('nota-item-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.notaFiscalId).toBe('nota-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.descricao).toBe('Soja a granel')
    expect(sut.ncm).toBe('12019000')
    expect(sut.cfop).toBe('5101')
    expect(sut.cstCsosn).toBe('102')
    expect(sut.quantidade).toBe(100)
    expect(sut.valorUnitario).toBe(10)
    expect(sut.valorTotal).toBe(1000)
    expect(sut.impostos).toEqual({ icms: { aliquota: 12 } })
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })

  it('respeita valorTotal explícito', () => {
    const sut = makeNotaFiscalItem({ quantidade: 3, valorUnitario: 10, valorTotal: 99 })

    expect(sut.valorTotal).toBe(99)
  })
})
