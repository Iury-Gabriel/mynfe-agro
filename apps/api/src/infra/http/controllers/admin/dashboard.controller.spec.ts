import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeLote } from '@test/factories/make-lote'
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeSafra } from '@test/factories/make-safra'
import { InMemoryDashboardRepository } from '@test/repositories/in-memory-dashboard-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardController } from './dashboard.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { DashboardRepository } from '@/domain/application/repositories/dashboard-repository'
import { GetDashboardResumoUseCase } from '@/domain/application/use-cases/dashboard/get-dashboard-resumo-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['view:dashboard'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const QUERY = 'empresaId=empresa-1&periodoInicio=2024-10-01&periodoFim=2024-10-31'

describe(DashboardController.name, () => {
  let app: INestApplication
  let pedidos: InMemoryPedidoRepository
  let remessas: InMemoryRemessaRepository
  let notas: InMemoryNotaFiscalRepository
  let lotes: InMemoryLoteRepository
  let safras: InMemorySafraRepository
  let dashboard: InMemoryDashboardRepository

  beforeEach(async () => {
    currentUser = mockUser
    pedidos = new InMemoryPedidoRepository()
    remessas = new InMemoryRemessaRepository()
    notas = new InMemoryNotaFiscalRepository()
    lotes = new InMemoryLoteRepository()
    safras = new InMemorySafraRepository()
    dashboard = new InMemoryDashboardRepository(pedidos, remessas, notas, lotes, safras)

    const module = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: DashboardRepository, useValue: dashboard },
        GetDashboardResumoUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('retorna 200 com o resumo agregado da empresa no período', async () => {
    pedidos.pedidos.push(
      makePedido({ id: 'p-1', status: 'faturado', valorTotal: 1000, data: new Date('2024-10-05') }),
    )
    remessas.remessas.push(makeRemessa({ id: 'r-1', data: new Date('2024-10-02') }))
    notas.notas.push(makeNotaFiscal({ id: 'n-1', status: 'autorizada' }))
    lotes.lotes.push(makeLote({ id: 'l-1', validade: new Date('2024-11-02') }))
    safras.safras.push(makeSafra({ id: 's-1', status: 'em_andamento' }))

    const res = await request(app.getHttpServer()).get(`/dashboard/resumo?${QUERY}`)

    expect(res.status).toBe(200)
    expect(res.body.resumo).toEqual({
      vendasNoPeriodo: 1000,
      totalPedidos: 1,
      totalRemessas: 1,
      notasEmitidas: 1,
      notasPendentes: 0,
      posicaoEstoque: { totalLotes: 1, lotesVencendo: 1 },
      safrasEmAndamento: 1,
    })
  })

  it('retorna 400 quando falta empresaId', async () => {
    const res = await request(app.getHttpServer()).get(
      '/dashboard/resumo?periodoInicio=2024-10-01&periodoFim=2024-10-31',
    )
    expect(res.status).toBe(400)
  })

  it('retorna 400 quando periodoFim é anterior a periodoInicio', async () => {
    const res = await request(app.getHttpServer()).get(
      '/dashboard/resumo?empresaId=empresa-1&periodoInicio=2024-10-31&periodoFim=2024-10-01',
    )
    expect(res.status).toBe(400)
  })

  it('retorna 403 sem permissão', async () => {
    currentUser = { ...mockUser, permissions: [] }
    const res = await request(app.getHttpServer()).get(`/dashboard/resumo?${QUERY}`)
    expect(res.status).toBe(403)
  })

  it('retorna 403 sem tenant', async () => {
    currentUser = { ...mockUser, tenantId: null }
    const res = await request(app.getHttpServer()).get(`/dashboard/resumo?${QUERY}`)
    expect(res.status).toBe(403)
  })

  it('retorna 500 quando o repositório falha', async () => {
    vi.spyOn(dashboard, 'resumo').mockRejectedValueOnce(new Error('db down'))
    const res = await request(app.getHttpServer()).get(`/dashboard/resumo?${QUERY}`)
    expect(res.status).toBe(500)
  })
})
