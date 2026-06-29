import { Prisma } from '@prisma/client'
import { makeTabelaPrecoCliente } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaTabelaPrecoClienteMapper } from './prisma-tabela-preco-cliente-mapper'

import type { TabelaPrecoCliente as PrismaTabelaPrecoCliente } from '@prisma/client'

function makePrismaRow(
  override: Partial<PrismaTabelaPrecoCliente> = {},
): PrismaTabelaPrecoCliente {
  return {
    id: 'tabela-preco-1',
    tenantId: 'tenant-1',
    clienteId: 'cliente-1',
    produtoId: 'produto-1',
    preco: new Prisma.Decimal('150.00'),
    vigenciaInicio: new Date('2024-01-01'),
    vigenciaFim: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaTabelaPrecoClienteMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const tabela = PrismaTabelaPrecoClienteMapper.toDomain(makePrismaRow())

      expect(tabela.id.toString()).toBe('tabela-preco-1')
      expect(tabela.tenantId).toBe('tenant-1')
      expect(tabela.clienteId).toBe('cliente-1')
      expect(tabela.produtoId).toBe('produto-1')
      expect(tabela.preco).toBe(150)
      expect(tabela.vigenciaInicio).toEqual(new Date('2024-01-01'))
      expect(tabela.vigenciaFim).toEqual(new Date('2024-12-31'))
      expect(tabela.createdAt).toEqual(new Date('2024-01-01'))
      expect(tabela.updatedAt).toEqual(new Date('2024-01-02'))
      expect(tabela.deletedAt).toBeNull()
    })

    it('mapeia vigências nulas para null', () => {
      const tabela = PrismaTabelaPrecoClienteMapper.toDomain(
        makePrismaRow({ vigenciaInicio: null, vigenciaFim: null }),
      )
      expect(tabela.vigenciaInicio).toBeNull()
      expect(tabela.vigenciaFim).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const tabela = PrismaTabelaPrecoClienteMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(tabela.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const tabela = makeTabelaPrecoCliente({
        id: 'tabela-preco-9',
        preco: 250,
        vigenciaInicio: new Date('2024-03-01'),
      })

      const data = PrismaTabelaPrecoClienteMapper.toPrismaCreate(tabela)

      expect(data.id).toBe('tabela-preco-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.clienteId).toBe('cliente-1')
      expect(data.produtoId).toBe('produto-1')
      expect(data.preco).toBe(250)
      expect(data.vigenciaInicio).toEqual(new Date('2024-03-01'))
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const tabela = makeTabelaPrecoCliente({ id: 'tabela-preco-7', preco: 500 })

      const data = PrismaTabelaPrecoClienteMapper.toPrismaUpdate(tabela)

      expect(data).not.toHaveProperty('id')
      expect(data.preco).toBe(500)
      expect(data.updatedAt).toEqual(tabela.updatedAt)
    })
  })
})
