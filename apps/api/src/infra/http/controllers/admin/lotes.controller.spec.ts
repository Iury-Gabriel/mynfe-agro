import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeColheita } from '@test/factories/make-colheita'
import { makeLote } from '@test/factories/make-lote'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { LotesController } from './lotes.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { GetLoteRastreabilidadeUseCase } from '@/domain/application/use-cases/estoque/get-lote-rastreabilidade-use-case'
import { ListLotesUseCase } from '@/domain/application/use-cases/estoque/list-lotes-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['lote:read'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(LotesController.name, () => {
  let app: INestApplication
  let lotes: InMemoryLoteRepository
  let colheitas: InMemoryColheitaRepository
  let pedidos: InMemoryPedidoRepository
  let remessas: InMemoryRemessaRepository

  beforeEach(async () => {
    currentUser = mockUser
    lotes = new InMemoryLoteRepository()
    colheitas = new InMemoryColheitaRepository()
    pedidos = new InMemoryPedidoRepository()
    remessas = new InMemoryRemessaRepository()

    const module = await Test.createTestingModule({
      controllers: [LotesController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: LoteRepository, useValue: lotes },
        { provide: ColheitaRepository, useValue: colheitas },
        { provide: PedidoRepository, useValue: pedidos },
        { provide: RemessaRepository, useValue: remessas },
        ListLotesUseCase,
        GetLoteRastreabilidadeUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /lotes', () => {
    it('retorna 200 com lista paginada da empresa', async () => {
      lotes.lotes.push(
        makeLote({ id: 'l-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }),
        makeLote({ id: 'l-2', tenantId: 'tenant-1', empresaId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/lotes?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.lotes).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/lotes')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/lotes?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/lotes?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao listar', async () => {
      vi.spyOn(lotes, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/lotes?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /lotes/:id/rastreabilidade', () => {
    it('retorna 200 com montante (colheita) e jusante vazio', async () => {
      colheitas.colheitas.push(makeColheita({ id: 'c-1', tenantId: 'tenant-1', safraId: 'safra-1' }))
      lotes.lotes.push(makeLote({ id: 'l-1', tenantId: 'tenant-1', colheitaId: 'c-1' }))

      const res = await request(app.getHttpServer()).get('/lotes/l-1/rastreabilidade')

      expect(res.status).toBe(200)
      expect(res.body.lote.id).toBe('l-1')
      expect(res.body.montante.colheita.id).toBe('c-1')
      expect(res.body.montante.safraId).toBe('safra-1')
      expect(res.body.jusante).toEqual({ pedidoItens: [], remessaItens: [] })
    })

    it('retorna jusante com pedidos e remessas que consumiram o lote', async () => {
      lotes.lotes.push(makeLote({ id: 'l-7', tenantId: 'tenant-1' }))
      pedidos.clienteNomes['cliente-1'] = 'Atacadão Verde'
      remessas.clienteNomes['cliente-1'] = 'Atacadão Verde'
      pedidos.pedidos.push(
        makePedido({
          id: 'p-1',
          tenantId: 'tenant-1',
          numero: '000009',
          clienteId: 'cliente-1',
          status: 'confirmado',
          itens: [makePedidoItem({ id: 'pi-1', pedidoId: 'p-1', loteId: 'l-7', quantidade: 25 })],
        }),
      )
      remessas.remessas.push(
        makeRemessa({
          id: 'r-1',
          tenantId: 'tenant-1',
          numero: '000004',
          clienteId: 'cliente-1',
          status: 'entregue',
          itens: [makeRemessaItem({ id: 'ri-1', remessaId: 'r-1', loteId: 'l-7', quantidade: 8 })],
        }),
      )

      const res = await request(app.getHttpServer()).get('/lotes/l-7/rastreabilidade')

      expect(res.status).toBe(200)
      expect(res.body.jusante.pedidoItens).toHaveLength(1)
      expect(res.body.jusante.pedidoItens[0]).toMatchObject({
        pedidoId: 'p-1',
        numero: '000009',
        clienteNome: 'Atacadão Verde',
        quantidade: 25,
        status: 'confirmado',
      })
      expect(res.body.jusante.remessaItens).toHaveLength(1)
      expect(res.body.jusante.remessaItens[0]).toMatchObject({
        remessaId: 'r-1',
        numero: '000004',
        clienteNome: 'Atacadão Verde',
        quantidade: 8,
        status: 'entregue',
      })
    })

    it('retorna 404 quando lote não existe', async () => {
      const res = await request(app.getHttpServer()).get('/lotes/nao-existe/rastreabilidade')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('LoteNotFound')
    })

    it('retorna 404 cross-tenant', async () => {
      lotes.lotes.push(makeLote({ id: 'l-9', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).get('/lotes/l-9/rastreabilidade')
      expect(res.status).toBe(404)
    })

    it('retorna montante.colheita null quando o lote não tem colheita de origem', async () => {
      lotes.lotes.push(
        makeLote({ id: 'l-2', tenantId: 'tenant-1', origemTipo: 'embalagem', colheitaId: null }),
      )

      const res = await request(app.getHttpServer()).get('/lotes/l-2/rastreabilidade')

      expect(res.status).toBe(200)
      expect(res.body.montante.colheita).toBeNull()
      expect(res.body.montante.safraId).toBeNull()
    })

    it('retorna 500 quando o repositório falha de forma inesperada', async () => {
      vi.spyOn(lotes, 'findById').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/lotes/l-1/rastreabilidade')
      expect(res.status).toBe(500)
    })
  })
})
