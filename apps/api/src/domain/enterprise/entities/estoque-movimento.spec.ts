import { describe, expect, it } from 'vitest'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueMovimento } from '@/domain/enterprise/entities/estoque-movimento'

describe(EstoqueMovimento.name, () => {
  it('cria com defaults para campos opcionais', () => {
    const sut = EstoqueMovimento.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      tipo: 'entrada',
      origem: 'colheita',
      quantidade: 1000,
      data: new Date('2024-10-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tipo).toBe('entrada')
    expect(sut.origem).toBe('colheita')
    expect(sut.quantidade).toBe(1000)
    expect(sut.loteId).toBeNull()
    expect(sut.referenciaId).toBeNull()
    expect(sut.usuarioId).toBeNull()
    expect(sut.motivo).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('preserva campos opcionais quando informados e o id', () => {
    const sut = EstoqueMovimento.create(
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        produtoId: 'produto-1',
        loteId: 'lote-1',
        tipo: 'ajuste',
        origem: 'ajuste',
        referenciaId: 'ref-1',
        quantidade: -50,
        data: new Date('2024-10-01'),
        usuarioId: 'user-1',
        motivo: 'perda',
        deletedAt: new Date('2024-12-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('movimento-x'),
    )

    expect(sut.id.toString()).toBe('movimento-x')
    expect(sut.loteId).toBe('lote-1')
    expect(sut.referenciaId).toBe('ref-1')
    expect(sut.usuarioId).toBe('user-1')
    expect(sut.motivo).toBe('perda')
    expect(sut.quantidade).toBe(-50)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.data).toEqual(new Date('2024-10-01'))
    expect(sut.deletedAt).toEqual(new Date('2024-12-01'))
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })
})
