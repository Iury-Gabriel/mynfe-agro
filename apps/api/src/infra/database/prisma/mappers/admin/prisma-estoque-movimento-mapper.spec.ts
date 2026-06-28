import { Prisma } from '@prisma/client'
import { makeEstoqueMovimento } from '@test/factories/make-estoque-movimento'
import { describe, expect, it } from 'vitest'

import { PrismaEstoqueMovimentoMapper } from './prisma-estoque-movimento-mapper'

import type { EstoqueMovimento as PrismaEstoqueMovimento } from '@prisma/client'

function makePrismaRow(
  override: Partial<PrismaEstoqueMovimento> = {},
): PrismaEstoqueMovimento {
  return {
    id: 'movimento-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    loteId: 'lote-1',
    tipo: 'entrada',
    origem: 'colheita',
    referenciaId: 'colheita-1',
    quantidade: new Prisma.Decimal('1000.000'),
    data: new Date('2024-10-01'),
    usuarioId: 'user-1',
    motivo: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaEstoqueMovimentoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const movimento = PrismaEstoqueMovimentoMapper.toDomain(makePrismaRow())

      expect(movimento.id.toString()).toBe('movimento-1')
      expect(movimento.tenantId).toBe('tenant-1')
      expect(movimento.empresaId).toBe('empresa-1')
      expect(movimento.produtoId).toBe('produto-1')
      expect(movimento.loteId).toBe('lote-1')
      expect(movimento.tipo).toBe('entrada')
      expect(movimento.origem).toBe('colheita')
      expect(movimento.referenciaId).toBe('colheita-1')
      expect(movimento.quantidade).toBe(1000)
      expect(movimento.usuarioId).toBe('user-1')
      expect(movimento.motivo).toBeNull()
      expect(movimento.deletedAt).toBeNull()
    })

    it('preserva campos nullable como null', () => {
      const movimento = PrismaEstoqueMovimentoMapper.toDomain(
        makePrismaRow({ loteId: null, referenciaId: null, usuarioId: null }),
      )
      expect(movimento.loteId).toBeNull()
      expect(movimento.referenciaId).toBeNull()
      expect(movimento.usuarioId).toBeNull()
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação com Decimal como number', () => {
      const movimento = makeEstoqueMovimento({
        id: 'movimento-9',
        tipo: 'ajuste',
        origem: 'ajuste',
        quantidade: -50.5,
        motivo: 'perda',
      })

      const data = PrismaEstoqueMovimentoMapper.toPrismaCreate(movimento)

      expect(data.id).toBe('movimento-9')
      expect(data.tipo).toBe('ajuste')
      expect(data.origem).toBe('ajuste')
      expect(data.quantidade).toBe(-50.5)
      expect(data.motivo).toBe('perda')
    })
  })
})
