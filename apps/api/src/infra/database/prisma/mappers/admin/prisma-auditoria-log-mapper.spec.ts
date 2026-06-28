import { Prisma } from '@prisma/client'
import { makeAuditoriaLog } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaAuditoriaLogMapper } from './prisma-auditoria-log-mapper'

import type { AuditoriaLog as PrismaAuditoriaLog } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaAuditoriaLog> = {}): PrismaAuditoriaLog {
  return {
    id: 'log-1',
    tenantId: 'tenant-1',
    usuarioId: 'user-1',
    entidade: 'tenant',
    entidadeId: 'tenant-1',
    acao: 'editar',
    dadosAntes: { nome: 'Antes' },
    dadosDepois: { nome: 'Depois' },
    data: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    ...override,
  }
}

describe('PrismaAuditoriaLogMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const log = PrismaAuditoriaLogMapper.toDomain(makePrismaRow())

      expect(log.id.toString()).toBe('log-1')
      expect(log.tenantId).toBe('tenant-1')
      expect(log.usuarioId).toBe('user-1')
      expect(log.entidade).toBe('tenant')
      expect(log.entidadeId).toBe('tenant-1')
      expect(log.acao).toBe('editar')
      expect(log.dadosAntes).toEqual({ nome: 'Antes' })
      expect(log.dadosDepois).toEqual({ nome: 'Depois' })
      expect(log.data).toEqual(new Date('2024-01-01'))
    })

    it('mapeia usuarioId null e JSONs ausentes para null no domínio', () => {
      const log = PrismaAuditoriaLogMapper.toDomain(
        makePrismaRow({ usuarioId: null, dadosAntes: null, dadosDepois: null }),
      )

      expect(log.usuarioId).toBeNull()
      expect(log.dadosAntes).toBeNull()
      expect(log.dadosDepois).toBeNull()
    })

    it('mapeia JSON array (não-objeto) para null', () => {
      const log = PrismaAuditoriaLogMapper.toDomain(makePrismaRow({ dadosAntes: [1, 2, 3] }))

      expect(log.dadosAntes).toBeNull()
    })
  })

  describe('toPrismaCreate', () => {
    it('mapeia a entidade para o input de create', () => {
      const data = PrismaAuditoriaLogMapper.toPrismaCreate(
        makeAuditoriaLog({ id: 'log-1', dadosAntes: { a: 1 }, dadosDepois: { b: 2 } }),
      )

      expect(data.id).toBe('log-1')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.entidade).toBe('tenant')
      expect(data.acao).toBe('editar')
      expect(data.dadosAntes).toEqual({ a: 1 })
      expect(data.dadosDepois).toEqual({ b: 2 })
    })

    it('mapeia dadosAntes/dadosDepois null para Prisma.JsonNull', () => {
      const data = PrismaAuditoriaLogMapper.toPrismaCreate(
        makeAuditoriaLog({ dadosAntes: null, dadosDepois: null }),
      )

      expect(data.dadosAntes).toBe(Prisma.JsonNull)
      expect(data.dadosDepois).toBe(Prisma.JsonNull)
    })
  })
})
