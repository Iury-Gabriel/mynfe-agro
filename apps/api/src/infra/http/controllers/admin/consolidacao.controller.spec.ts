import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemoryVendaWriteRepository } from '@test/repositories/in-memory-venda-write-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { ConsolidacaoController } from './consolidacao.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { VendaWriteRepository } from '@/domain/application/repositories/venda-write-repository'
import { ConsolidarRemessasUseCase } from '@/domain/application/use-cases/vendas/consolidar-remessas-use-case'
import { PreviewConsolidacaoUseCase } from '@/domain/application/use-cases/vendas/preview-consolidacao-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['consolidacao:create'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validQuery =
  'empresaId=empresa-1&clienteId=cliente-1&periodoInicio=2024-10-01&periodoFim=2024-10-31'

const validBody = {
  empresaId: 'empresa-1',
  clienteId: 'cliente-1',
  periodoInicio: '2024-10-01',
  periodoFim: '2024-10-31',
}

function seedRemessasNaJanela(remessas: InMemoryRemessaRepository): void {
  const r1 = makeRemessa({
    id: 'r-1',
    status: 'aberta',
    clienteId: 'cliente-1',
    data: new Date('2024-10-05'),
    itens: [],
  })
  r1.addItem(makeRemessaItem({ id: 'ri-1', remessaId: 'r-1', quantidade: 100, precoUnitario: 10 }))

  const r2 = makeRemessa({
    id: 'r-2',
    status: 'entregue',
    clienteId: 'cliente-1',
    data: new Date('2024-10-10'),
    itens: [],
  })
  r2.addItem(makeRemessaItem({ id: 'ri-2', remessaId: 'r-2', quantidade: 50, precoUnitario: 10 }))

  remessas.remessas.push(r1, r2)
}

describe(ConsolidacaoController.name, () => {
  let app: INestApplication
  let pedidos: InMemoryPedidoRepository
  let remessas: InMemoryRemessaRepository
  let vendaWrite: InMemoryVendaWriteRepository

  beforeEach(async () => {
    currentUser = mockUser
    pedidos = new InMemoryPedidoRepository()
    remessas = new InMemoryRemessaRepository()
    vendaWrite = new InMemoryVendaWriteRepository(pedidos, remessas)

    const module = await Test.createTestingModule({
      controllers: [ConsolidacaoController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: PedidoRepository, useValue: pedidos },
        { provide: RemessaRepository, useValue: remessas },
        { provide: VendaWriteRepository, useValue: vendaWrite },
        PreviewConsolidacaoUseCase,
        ConsolidarRemessasUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /consolidacao/preview', () => {
    it('retorna 200 com itens agregados e valorTotal', async () => {
      seedRemessasNaJanela(remessas)

      const res = await request(app.getHttpServer()).get(`/consolidacao/preview?${validQuery}`)

      expect(res.status).toBe(200)
      expect(res.body.remessas).toHaveLength(2)
      expect(res.body.itens).toHaveLength(1)
      expect(res.body.itens[0].quantidade).toBe(150)
      expect(res.body.valorTotal).toBe(1500)
    })

    it('retorna 400 quando falta query obrigatória', async () => {
      const res = await request(app.getHttpServer()).get('/consolidacao/preview?empresaId=empresa-1')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get(`/consolidacao/preview?${validQuery}`)
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get(`/consolidacao/preview?${validQuery}`)
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao buscar remessas', async () => {
      vi.spyOn(remessas, 'findNaoConsolidadasByClientePeriodo').mockRejectedValueOnce(
        new Error('db down'),
      )
      const res = await request(app.getHttpServer()).get(`/consolidacao/preview?${validQuery}`)
      expect(res.status).toBe(500)
    })
  })

  describe('POST /consolidacao', () => {
    it('retorna 201, cria pedido consolidado e marca remessas como consolidadas', async () => {
      seedRemessasNaJanela(remessas)

      const res = await request(app.getHttpServer()).post('/consolidacao').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.pedido.tipo).toBe('consolidado')
      expect(res.body.pedido.itens).toHaveLength(1)
      expect(res.body.remessas.every((r: { status: string }) => r.status === 'consolidada')).toBe(
        true,
      )
      expect(pedidos.pedidos).toHaveLength(1)
      expect(remessas.remessas.every((r) => r.status === 'consolidada')).toBe(true)
    })

    it('retorna 400 quando não há remessas no período', async () => {
      const res = await request(app.getHttpServer()).post('/consolidacao').send(validBody)
      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('SemRemessasParaConsolidar')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).post('/consolidacao').send(validBody)
      expect(res.status).toBe(403)
    })

    it('retorna 409 quando uma remessa não pode ser consolidada', async () => {
      vi.spyOn(remessas, 'findNaoConsolidadasByClientePeriodo').mockResolvedValueOnce([
        makeRemessa({ id: 'r-x', status: 'cancelada', clienteId: 'cliente-1' }),
      ])
      const res = await request(app.getHttpServer()).post('/consolidacao').send(validBody)
      expect(res.status).toBe(409)
    })

    it('retorna 500 quando a transação de venda falha', async () => {
      seedRemessasNaJanela(remessas)
      vendaWrite.shouldFail = true
      const res = await request(app.getHttpServer()).post('/consolidacao').send(validBody)
      expect(res.status).toBe(500)
    })
  })
})
