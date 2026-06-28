import { Prisma } from '@prisma/client'
import { makeProdutoFichaTecnica } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaProdutoFichaTecnicaMapper } from './prisma-produto-ficha-tecnica-mapper'

import type { ProdutoFichaTecnica as PrismaProdutoFichaTecnica } from '@prisma/client'

function makePrismaRow(
  override: Partial<PrismaProdutoFichaTecnica> = {},
): PrismaProdutoFichaTecnica {
  return {
    id: 'ficha-1',
    tenantId: 'tenant-1',
    produtoId: 'produto-1',
    descricaoComponente: 'Milho moído',
    quantidadeReferencia: new Prisma.Decimal('5.000'),
    observacoes: 'Base',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaProdutoFichaTecnicaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const ficha = PrismaProdutoFichaTecnicaMapper.toDomain(makePrismaRow())

      expect(ficha.id.toString()).toBe('ficha-1')
      expect(ficha.tenantId).toBe('tenant-1')
      expect(ficha.produtoId).toBe('produto-1')
      expect(ficha.descricaoComponente).toBe('Milho moído')
      expect(ficha.quantidadeReferencia).toBe(5)
      expect(ficha.observacoes).toBe('Base')
      expect(ficha.createdAt).toEqual(new Date('2024-01-01'))
      expect(ficha.updatedAt).toEqual(new Date('2024-01-02'))
      expect(ficha.deletedAt).toBeNull()
    })

    it('mapeia quantidadeReferencia null para null', () => {
      const ficha = PrismaProdutoFichaTecnicaMapper.toDomain(
        makePrismaRow({ quantidadeReferencia: null }),
      )
      expect(ficha.quantidadeReferencia).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const ficha = PrismaProdutoFichaTecnicaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(ficha.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const ficha = makeProdutoFichaTecnica({
        id: 'ficha-9',
        descricaoComponente: 'Soja',
        quantidadeReferencia: 3,
      })

      const data = PrismaProdutoFichaTecnicaMapper.toPrismaCreate(ficha)

      expect(data.id).toBe('ficha-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.produtoId).toBe('produto-1')
      expect(data.descricaoComponente).toBe('Soja')
      expect(data.quantidadeReferencia).toBe(3)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const ficha = makeProdutoFichaTecnica({ id: 'ficha-7', descricaoComponente: 'Novo' })

      const data = PrismaProdutoFichaTecnicaMapper.toPrismaUpdate(ficha)

      expect(data).not.toHaveProperty('id')
      expect(data.descricaoComponente).toBe('Novo')
      expect(data.updatedAt).toEqual(ficha.updatedAt)
    })
  })
})
