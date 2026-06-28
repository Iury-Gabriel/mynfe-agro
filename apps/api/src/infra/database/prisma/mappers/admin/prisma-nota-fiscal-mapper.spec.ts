import { Prisma } from '@prisma/client'
import { makeNotaFiscal, makeNotaFiscalEvento, makeNotaFiscalItem } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaNotaFiscalMapper } from './prisma-nota-fiscal-mapper'

import type {
  NotaFiscal as PrismaNotaFiscal,
  NotaFiscalEvento as PrismaNotaFiscalEvento,
  NotaFiscalItem as PrismaNotaFiscalItem,
} from '@prisma/client'

type PrismaNotaFiscalWithRelations = PrismaNotaFiscal & {
  itens: PrismaNotaFiscalItem[]
  eventos: PrismaNotaFiscalEvento[]
}

function makePrismaItemRow(override: Partial<PrismaNotaFiscalItem> = {}): PrismaNotaFiscalItem {
  return {
    id: 'nota-item-1',
    tenantId: 'tenant-1',
    notaFiscalId: 'nota-1',
    produtoId: 'produto-1',
    descricao: 'Soja a granel',
    ncm: '12019000',
    cfop: '5101',
    cstCsosn: '102',
    quantidade: new Prisma.Decimal('100.000'),
    valorUnitario: new Prisma.Decimal('10.00'),
    valorTotal: new Prisma.Decimal('1000.00'),
    impostos: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...override,
  }
}

function makePrismaEventoRow(override: Partial<PrismaNotaFiscalEvento> = {}): PrismaNotaFiscalEvento {
  return {
    id: 'nota-evento-1',
    tenantId: 'tenant-1',
    notaFiscalId: 'nota-1',
    tipo: 'emissao',
    payload: {},
    data: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    ...override,
  }
}

function makePrismaRow(
  override: Partial<PrismaNotaFiscalWithRelations> = {},
): PrismaNotaFiscalWithRelations {
  return {
    id: 'nota-1',
    tenantId: 'tenant-1',
    empresaEmitenteId: 'empresa-1',
    pedidoId: 'pedido-1',
    clienteId: 'cliente-1',
    numero: '1',
    serie: '1',
    modelo: '55',
    naturezaOperacao: 'Venda',
    status: 'autorizada',
    chaveAcesso: '0'.repeat(44),
    protocolo: 'protocolo-1',
    valorTotal: new Prisma.Decimal('1000.00'),
    ambiente: 'homologacao',
    plugnotasId: 'plugnotas-1',
    xmlUrl: 'https://files/nfe.xml',
    danfeUrl: 'https://files/danfe.pdf',
    mensagemRetorno: null,
    dataEmissao: new Date('2024-01-03'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    itens: [],
    eventos: [],
    ...override,
  }
}

describe('PrismaNotaFiscalMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const nota = PrismaNotaFiscalMapper.toDomain(makePrismaRow())

      expect(nota.id.toString()).toBe('nota-1')
      expect(nota.tenantId).toBe('tenant-1')
      expect(nota.empresaEmitenteId).toBe('empresa-1')
      expect(nota.pedidoId).toBe('pedido-1')
      expect(nota.clienteId).toBe('cliente-1')
      expect(nota.numero).toBe('1')
      expect(nota.serie).toBe('1')
      expect(nota.modelo).toBe('55')
      expect(nota.naturezaOperacao).toBe('Venda')
      expect(nota.status).toBe('autorizada')
      expect(nota.chaveAcesso).toBe('0'.repeat(44))
      expect(nota.protocolo).toBe('protocolo-1')
      expect(nota.valorTotal).toBe(1000)
      expect(nota.ambiente).toBe('homologacao')
      expect(nota.plugnotasId).toBe('plugnotas-1')
      expect(nota.xmlUrl).toBe('https://files/nfe.xml')
      expect(nota.danfeUrl).toBe('https://files/danfe.pdf')
      expect(nota.dataEmissao).toEqual(new Date('2024-01-03'))
      expect(nota.itens).toHaveLength(0)
      expect(nota.eventos).toHaveLength(0)
      expect(nota.deletedAt).toBeNull()
    })

    it('mapeia itens e eventos aninhados', () => {
      const nota = PrismaNotaFiscalMapper.toDomain(
        makePrismaRow({
          itens: [makePrismaItemRow({ id: 'i-1' })],
          eventos: [makePrismaEventoRow({ id: 'e-1', tipo: 'cancelamento' })],
        }),
      )

      expect(nota.itens).toHaveLength(1)
      expect(nota.itens[0].id.toString()).toBe('i-1')
      expect(nota.eventos).toHaveLength(1)
      expect(nota.eventos[0].tipo).toBe('cancelamento')
    })

    it('preserva campos nullable e deletedAt', () => {
      const deletedAt = new Date('2024-02-01')
      const nota = PrismaNotaFiscalMapper.toDomain(
        makePrismaRow({
          numero: null,
          serie: null,
          chaveAcesso: null,
          protocolo: null,
          plugnotasId: null,
          dataEmissao: null,
          mensagemRetorno: 'rejeitada',
          status: 'rejeitada',
          deletedAt,
        }),
      )

      expect(nota.numero).toBeNull()
      expect(nota.serie).toBeNull()
      expect(nota.chaveAcesso).toBeNull()
      expect(nota.plugnotasId).toBeNull()
      expect(nota.dataEmissao).toBeNull()
      expect(nota.mensagemRetorno).toBe('rejeitada')
      expect(nota.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade com itens e eventos aninhados', () => {
      const nota = makeNotaFiscal({
        id: 'nota-9',
        itens: [makeNotaFiscalItem({ id: 'i-9' })],
        eventos: [makeNotaFiscalEvento({ id: 'e-9' })],
      })

      const data = PrismaNotaFiscalMapper.toPrismaCreate(nota)

      expect(data.id).toBe('nota-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.empresaEmitenteId).toBe('empresa-1')

      const nestedItens = data.itens?.create
      const itens = Array.isArray(nestedItens) ? nestedItens : [nestedItens]
      expect(itens).toHaveLength(1)
      expect(itens[0]?.id).toBe('i-9')

      const nestedEventos = data.eventos?.create
      const eventos = Array.isArray(nestedEventos) ? nestedEventos : [nestedEventos]
      expect(eventos).toHaveLength(1)
      expect(eventos[0]?.id).toBe('e-9')
    })

    it('serializa create com arrays vazios quando não há itens/eventos', () => {
      const nota = makeNotaFiscal({ itens: [], eventos: [] })
      const data = PrismaNotaFiscalMapper.toPrismaCreate(nota)

      const nestedItens = data.itens?.create
      const itens = Array.isArray(nestedItens) ? nestedItens : [nestedItens]
      expect(itens).toHaveLength(0)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa apenas campos mutáveis sem id', () => {
      const nota = makeNotaFiscal({
        status: 'cancelada',
        chaveAcesso: '0'.repeat(44),
        protocolo: 'p-2',
        plugnotasId: 'pn-2',
        updatedAt: new Date('2024-03-01'),
      })

      const data = PrismaNotaFiscalMapper.toPrismaUpdate(nota)

      expect(data).not.toHaveProperty('id')
      expect(data.status).toBe('cancelada')
      expect(data.chaveAcesso).toBe('0'.repeat(44))
      expect(data.protocolo).toBe('p-2')
      expect(data.plugnotasId).toBe('pn-2')
      expect(data.updatedAt).toEqual(new Date('2024-03-01'))
    })
  })
})
