import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { FilaFaturamentoController } from './fila-faturamento.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ListFilaFaturamentoUseCase } from '@/domain/application/use-cases/faturamento/list-fila-faturamento-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['nota:read'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(FilaFaturamentoController.name, () => {
  let app: INestApplication
  let pedidos: InMemoryPedidoRepository
  let notas: InMemoryNotaFiscalRepository

  beforeEach(async () => {
    currentUser = mockUser
    pedidos = new InMemoryPedidoRepository()
    notas = new InMemoryNotaFiscalRepository()

    const module = await Test.createTestingModule({
      controllers: [FilaFaturamentoController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: PedidoRepository, useValue: pedidos },
        { provide: NotaFiscalRepository, useValue: notas },
        ListFilaFaturamentoUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /fila-faturamento', () => {
    it('retorna 200 listando pedidos confirmados aptos a faturar', async () => {
      pedidos.pedidos.push(
        makePedido({ id: 'p-1', status: 'confirmado', empresaFaturadoraId: 'empresa-1' }),
        makePedido({ id: 'p-2', status: 'confirmado', empresaFaturadoraId: 'empresa-1' }),
      )
      notas.notas.push(makeNotaFiscal({ id: 'n-1', pedidoId: 'p-2', status: 'autorizada' }))

      const res = await request(app.getHttpServer()).get('/fila-faturamento?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.pedidos).toHaveLength(1)
      expect(res.body.pedidos[0].id).toBe('p-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/fila-faturamento')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/fila-faturamento?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/fila-faturamento?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha', async () => {
      vi.spyOn(pedidos, 'findManyByEmpresa').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/fila-faturamento?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })
})
