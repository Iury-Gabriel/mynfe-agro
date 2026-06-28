import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeEstoqueMovimento } from '@test/factories/make-estoque-movimento'
import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { makeLote } from '@test/factories/make-lote'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { EstoqueController } from './estoque.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { EstoqueMovimentoRepository } from '@/domain/application/repositories/estoque-movimento-repository'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { AjustarEstoqueUseCase } from '@/domain/application/use-cases/estoque/ajustar-estoque-use-case'
import { GetPosicaoEstoqueUseCase } from '@/domain/application/use-cases/estoque/get-posicao-estoque-use-case'
import { ListMovimentacoesUseCase } from '@/domain/application/use-cases/estoque/list-movimentacoes-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['estoque:read', 'estoque:ajuste'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(EstoqueController.name, () => {
  let app: INestApplication
  let lotes: InMemoryLoteRepository
  let movimentos: InMemoryEstoqueMovimentoRepository
  let saldos: InMemoryEstoqueSaldoRepository
  let write: InMemoryEstoqueWriteRepository

  beforeEach(async () => {
    currentUser = mockUser
    lotes = new InMemoryLoteRepository()
    movimentos = new InMemoryEstoqueMovimentoRepository()
    saldos = new InMemoryEstoqueSaldoRepository()
    write = new InMemoryEstoqueWriteRepository(
      new InMemoryColheitaRepository(),
      lotes,
      movimentos,
      saldos,
    )

    const module = await Test.createTestingModule({
      controllers: [EstoqueController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: EstoqueSaldoRepository, useValue: saldos },
        { provide: EstoqueMovimentoRepository, useValue: movimentos },
        { provide: LoteRepository, useValue: lotes },
        { provide: EstoqueWriteRepository, useValue: write },
        { provide: AuditoriaLogRepository, useClass: InMemoryAuditoriaLogRepository },
        RegistrarAuditoriaUseCase,
        GetPosicaoEstoqueUseCase,
        ListMovimentacoesUseCase,
        AjustarEstoqueUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /estoque/posicao', () => {
    it('retorna 200 com saldos paginados da empresa', async () => {
      saldos.saldos.push(
        makeEstoqueSaldo({ id: 's-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }),
        makeEstoqueSaldo({ id: 's-2', tenantId: 'tenant-1', empresaId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/estoque/posicao?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.saldos).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/estoque/posicao')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/estoque/posicao?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/estoque/posicao?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório de saldos falha', async () => {
      vi.spyOn(saldos, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/estoque/posicao?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /estoque/movimentos', () => {
    it('retorna 200 e aplica filtro de tipo', async () => {
      movimentos.movimentos.push(
        makeEstoqueMovimento({ id: 'm-1', tipo: 'entrada', empresaId: 'empresa-1' }),
        makeEstoqueMovimento({ id: 'm-2', tipo: 'ajuste', origem: 'ajuste', empresaId: 'empresa-1' }),
      )

      const res = await request(app.getHttpServer()).get(
        '/estoque/movimentos?empresaId=empresa-1&tipo=ajuste',
      )

      expect(res.status).toBe(200)
      expect(res.body.movimentos).toHaveLength(1)
      expect(res.body.movimentos[0].tipo).toBe('ajuste')
    })

    it('retorna 400 com tipo inválido', async () => {
      const res = await request(app.getHttpServer()).get(
        '/estoque/movimentos?empresaId=empresa-1&tipo=foo',
      )
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório de movimentos falha', async () => {
      vi.spyOn(movimentos, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/estoque/movimentos?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /estoque/ajustes', () => {
    const validBody = {
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      delta: 50,
      motivo: 'inventário',
      data: '2024-10-10',
    }

    it('retorna 201 ao registrar ajuste positivo (cria saldo)', async () => {
      const res = await request(app.getHttpServer()).post('/estoque/ajustes').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.movimento.tipo).toBe('ajuste')
      expect(res.body.saldo.quantidadeDisponivel).toBe(50)
      expect(movimentos.movimentos).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/estoque/ajustes')
        .send({ ...validBody, tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 com motivo vazio', async () => {
      const res = await request(app.getHttpServer())
        .post('/estoque/ajustes')
        .send({ ...validBody, motivo: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 (MovimentoInvalido) quando delta é zero', async () => {
      const res = await request(app.getHttpServer())
        .post('/estoque/ajustes')
        .send({ ...validBody, delta: 0 })
      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('MovimentoInvalido')
    })

    it('retorna 404 quando loteId informado não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/estoque/ajustes')
        .send({ ...validBody, loteId: 'nao-existe' })
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('LoteNotFound')
    })

    it('retorna 400 (EstoqueInsuficiente) ao baixar mais do que o disponível no lote', async () => {
      lotes.lotes.push(
        makeLote({ id: 'l-1', tenantId: 'tenant-1', empresaId: 'empresa-1', quantidadeAtual: 10 }),
      )
      saldos.saldos.push(
        makeEstoqueSaldo({
          id: 's-1',
          tenantId: 'tenant-1',
          empresaId: 'empresa-1',
          loteId: 'l-1',
          quantidadeDisponivel: 10,
        }),
      )

      const res = await request(app.getHttpServer())
        .post('/estoque/ajustes')
        .send({ ...validBody, loteId: 'l-1', delta: -50 })

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('EstoqueInsuficiente')
    })

    it('retorna 500 quando a transação falha', async () => {
      write.shouldFail = true
      const res = await request(app.getHttpServer()).post('/estoque/ajustes').send(validBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão de ajuste', async () => {
      currentUser = { ...mockUser, permissions: ['estoque:read'] }
      const res = await request(app.getHttpServer()).post('/estoque/ajustes').send(validBody)
      expect(res.status).toBe(403)
    })
  })
})
