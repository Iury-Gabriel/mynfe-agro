import { Prisma } from '@prisma/client'
import { makeCustoProducao } from '@test/factories/make-custo-producao'
import { describe, expect, it } from 'vitest'

import { PrismaCustoProducaoMapper } from './prisma-custo-producao-mapper'

import type { CustoProducao as PrismaCustoProducao } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaCustoProducao> = {}): PrismaCustoProducao {
  return {
    id: 'custo-1',
    tenantId: 'tenant-1',
    safraId: 'safra-1',
    areaId: 'area-1',
    tipo: 'insumo',
    descricao: 'Adubo NPK',
    valor: new Prisma.Decimal('5000.00'),
    data: new Date('2024-10-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaCustoProducaoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const custo = PrismaCustoProducaoMapper.toDomain(makePrismaRow())

      expect(custo.id.toString()).toBe('custo-1')
      expect(custo.tenantId).toBe('tenant-1')
      expect(custo.safraId).toBe('safra-1')
      expect(custo.areaId).toBe('area-1')
      expect(custo.tipo).toBe('insumo')
      expect(custo.descricao).toBe('Adubo NPK')
      expect(custo.valor).toBe(5000)
      expect(custo.data).toEqual(new Date('2024-10-01'))
      expect(custo.createdAt).toEqual(new Date('2024-01-01'))
      expect(custo.updatedAt).toEqual(new Date('2024-01-02'))
      expect(custo.deletedAt).toBeNull()
    })

    it('mapeia safraId e areaId nulos para null', () => {
      const custo = PrismaCustoProducaoMapper.toDomain(
        makePrismaRow({ safraId: null, areaId: null }),
      )
      expect(custo.safraId).toBeNull()
      expect(custo.areaId).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const custo = PrismaCustoProducaoMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(custo.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const custo = makeCustoProducao({
        id: 'custo-9',
        tipo: 'maquinario',
        descricao: 'Aluguel trator',
        valor: 800.25,
      })

      const data = PrismaCustoProducaoMapper.toPrismaCreate(custo)

      expect(data.id).toBe('custo-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.tipo).toBe('maquinario')
      expect(data.descricao).toBe('Aluguel trator')
      expect(data.valor).toBe(800.25)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const custo = makeCustoProducao({ id: 'custo-7', descricao: 'Atualizado', valor: 999 })

      const data = PrismaCustoProducaoMapper.toPrismaUpdate(custo)

      expect(data).not.toHaveProperty('id')
      expect(data.descricao).toBe('Atualizado')
      expect(data.valor).toBe(999)
      expect(data.updatedAt).toEqual(custo.updatedAt)
    })
  })
})
