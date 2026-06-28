import { describe, expect, it } from 'vitest'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Colheita } from '@/domain/enterprise/entities/colheita'

describe(Colheita.name, () => {
  it('cria com defaults para campos opcionais', () => {
    const sut = Colheita.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      quantidade: 500,
      data: new Date('2024-10-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.produtoId).toBe('produto-1')
    expect(sut.quantidade).toBe(500)
    expect(sut.data).toEqual(new Date('2024-10-01'))
    expect(sut.safraId).toBeNull()
    expect(sut.areaId).toBeNull()
    expect(sut.responsavelUsuarioId).toBeNull()
    expect(sut.deletedAt).toBeNull()
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })

  it('preserva campos opcionais quando informados e o id', () => {
    const sut = Colheita.create(
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        produtoId: 'produto-1',
        safraId: 'safra-1',
        areaId: 'area-1',
        quantidade: 500,
        data: new Date('2024-10-01'),
        responsavelUsuarioId: 'user-1',
        deletedAt: new Date('2024-12-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      new UniqueEntityID('colheita-x'),
    )

    expect(sut.id.toString()).toBe('colheita-x')
    expect(sut.safraId).toBe('safra-1')
    expect(sut.areaId).toBe('area-1')
    expect(sut.responsavelUsuarioId).toBe('user-1')
    expect(sut.deletedAt).toEqual(new Date('2024-12-01'))
  })
})
