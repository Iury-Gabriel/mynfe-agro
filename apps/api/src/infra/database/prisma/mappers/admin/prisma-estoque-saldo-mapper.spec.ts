import { Prisma } from '@prisma/client'
import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { describe, expect, it } from 'vitest'

import { PrismaEstoqueSaldoMapper } from './prisma-estoque-saldo-mapper'

import type { EstoqueSaldo as PrismaEstoqueSaldo } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaEstoqueSaldo> = {}): PrismaEstoqueSaldo {
  return {
    id: 'saldo-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    loteId: 'lote-1',
    quantidadeDisponivel: new Prisma.Decimal('1000.500'),
    quantidadeReservada: new Prisma.Decimal('100.000'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...override,
  }
}

describe('PrismaEstoqueSaldoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const saldo = PrismaEstoqueSaldoMapper.toDomain(makePrismaRow())

      expect(saldo.id.toString()).toBe('saldo-1')
      expect(saldo.tenantId).toBe('tenant-1')
      expect(saldo.empresaId).toBe('empresa-1')
      expect(saldo.produtoId).toBe('produto-1')
      expect(saldo.loteId).toBe('lote-1')
      expect(saldo.quantidadeDisponivel).toBe(1000.5)
      expect(saldo.quantidadeReservada).toBe(100)
      expect(saldo.createdAt).toEqual(new Date('2024-01-01'))
      expect(saldo.updatedAt).toEqual(new Date('2024-01-02'))
    })

    it('preserva loteId null (saldo sem lote)', () => {
      const saldo = PrismaEstoqueSaldoMapper.toDomain(makePrismaRow({ loteId: null }))
      expect(saldo.loteId).toBeNull()
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação com Decimal como number', () => {
      const saldo = makeEstoqueSaldo({
        id: 'saldo-9',
        quantidadeDisponivel: 250.75,
        quantidadeReservada: 0,
      })

      const data = PrismaEstoqueSaldoMapper.toPrismaCreate(saldo)

      expect(data.id).toBe('saldo-9')
      expect(data.quantidadeDisponivel).toBe(250.75)
      expect(data.quantidadeReservada).toBe(0)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const saldo = makeEstoqueSaldo({ id: 'saldo-7', quantidadeDisponivel: 999 })

      const data = PrismaEstoqueSaldoMapper.toPrismaUpdate(saldo)

      expect(data).not.toHaveProperty('id')
      expect(data.quantidadeDisponivel).toBe(999)
      expect(data.updatedAt).toEqual(saldo.updatedAt)
    })
  })
})
