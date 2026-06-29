import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeColheita } from '@test/factories/make-colheita'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { ColheitasController } from './colheitas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { ColheitaRepository } from '@/domain/application/repositories/colheita-repository'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { ListColheitasUseCase } from '@/domain/application/use-cases/estoque/list-colheitas-use-case'
import { RegistrarColheitaUseCase } from '@/domain/application/use-cases/estoque/registrar-colheita-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['colheita:read', 'colheita:create'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validBody = {
  empresaId: 'empresa-1',
  produtoId: 'produto-1',
  quantidade: 1000,
  data: '2024-10-01',
}

describe(ColheitasController.name, () => {
  let app: INestApplication
  let colheitas: InMemoryColheitaRepository
  let lotes: InMemoryLoteRepository
  let movimentos: InMemoryEstoqueMovimentoRepository
  let saldos: InMemoryEstoqueSaldoRepository
  let write: InMemoryEstoqueWriteRepository

  beforeEach(async () => {
    currentUser = mockUser
    colheitas = new InMemoryColheitaRepository()
    lotes = new InMemoryLoteRepository()
    movimentos = new InMemoryEstoqueMovimentoRepository()
    saldos = new InMemoryEstoqueSaldoRepository()
    write = new InMemoryEstoqueWriteRepository(colheitas, lotes, movimentos, saldos)

    const module = await Test.createTestingModule({
      controllers: [ColheitasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ColheitaRepository, useValue: colheitas },
        { provide: EstoqueSaldoRepository, useValue: saldos },
        { provide: EstoqueWriteRepository, useValue: write },
        ListColheitasUseCase,
        RegistrarColheitaUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /colheitas', () => {
    it('retorna 200 com lista paginada da empresa', async () => {
      colheitas.colheitas.push(
        makeColheita({ id: 'c-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }),
        makeColheita({ id: 'c-2', tenantId: 'tenant-1', empresaId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/colheitas?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.colheitas).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/colheitas')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/colheitas?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/colheitas?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao listar', async () => {
      vi.spyOn(colheitas, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/colheitas?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /colheitas', () => {
    it('retorna 201 ao registrar colheita (gera lote + movimento + saldo)', async () => {
      const res = await request(app.getHttpServer()).post('/colheitas').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.colheita.empresaId).toBe('empresa-1')
      expect(res.body.lote.quantidadeAtual).toBe(1000)
      expect(colheitas.colheitas).toHaveLength(1)
      expect(lotes.lotes).toHaveLength(1)
      expect(movimentos.movimentos).toHaveLength(1)
      expect(saldos.saldos).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/colheitas')
        .send({ ...validBody, tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 com quantidade não positiva', async () => {
      const res = await request(app.getHttpServer())
        .post('/colheitas')
        .send({ ...validBody, quantidade: 0 })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando a transação falha', async () => {
      write.shouldFail = true
      const res = await request(app.getHttpServer()).post('/colheitas').send(validBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão de create', async () => {
      currentUser = { ...mockUser, permissions: ['colheita:read'] }
      const res = await request(app.getHttpServer()).post('/colheitas').send(validBody)
      expect(res.status).toBe(403)
    })
  })
})
