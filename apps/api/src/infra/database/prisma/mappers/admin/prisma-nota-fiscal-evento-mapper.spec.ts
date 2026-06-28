import { makeNotaFiscalEvento } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaNotaFiscalEventoMapper } from './prisma-nota-fiscal-evento-mapper'

import type { NotaFiscalEvento as PrismaNotaFiscalEvento } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaNotaFiscalEvento> = {}): PrismaNotaFiscalEvento {
  return {
    id: 'nota-evento-1',
    tenantId: 'tenant-1',
    notaFiscalId: 'nota-1',
    tipo: 'emissao',
    payload: { numero: '1', serie: '1' },
    data: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    ...override,
  }
}

describe('PrismaNotaFiscalEventoMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const evento = PrismaNotaFiscalEventoMapper.toDomain(makePrismaRow())

      expect(evento.id.toString()).toBe('nota-evento-1')
      expect(evento.tenantId).toBe('tenant-1')
      expect(evento.notaFiscalId).toBe('nota-1')
      expect(evento.tipo).toBe('emissao')
      expect(evento.payload).toEqual({ numero: '1', serie: '1' })
      expect(evento.data).toEqual(new Date('2024-01-01'))
      expect(evento.createdAt).toEqual(new Date('2024-01-01'))
    })

    it('mapeia payload nulo/não-objeto para {}', () => {
      const evento = PrismaNotaFiscalEventoMapper.toDomain(
        makePrismaRow({ tipo: 'cancelamento', payload: null }),
      )

      expect(evento.tipo).toBe('cancelamento')
      expect(evento.payload).toEqual({})
    })

    it('mapeia payload em formato de array para {}', () => {
      const evento = PrismaNotaFiscalEventoMapper.toDomain(makePrismaRow({ payload: ['a'] }))
      expect(evento.payload).toEqual({})
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const evento = makeNotaFiscalEvento({ id: 'nota-evento-9', tipo: 'rejeicao', payload: { msg: 'x' } })
      const data = PrismaNotaFiscalEventoMapper.toPrismaCreate(evento)

      expect(data.id).toBe('nota-evento-9')
      expect(data.notaFiscalId).toBe('nota-1')
      expect(data.tipo).toBe('rejeicao')
      expect(data.payload).toEqual({ msg: 'x' })
    })
  })

  describe('toPrismaCreateNested', () => {
    it('serializa sem notaFiscalId', () => {
      const evento = makeNotaFiscalEvento({ id: 'nota-evento-7' })
      const data = PrismaNotaFiscalEventoMapper.toPrismaCreateNested(evento)

      expect(data.id).toBe('nota-evento-7')
      expect(data).not.toHaveProperty('notaFiscalId')
      expect(data.tipo).toBe('emissao')
    })
  })
})
