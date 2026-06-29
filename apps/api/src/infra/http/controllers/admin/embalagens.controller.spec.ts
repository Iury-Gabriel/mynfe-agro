import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { EmbalagensController } from './embalagens.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { RegistrarEmbalagemUseCase } from '@/domain/application/use-cases/estoque/registrar-embalagem-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['embalagem:create'],
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
  quantidade: 500,
  data: '2024-10-05',
}

describe(EmbalagensController.name, () => {
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
      controllers: [EmbalagensController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: EstoqueSaldoRepository, useValue: saldos },
        { provide: EstoqueWriteRepository, useValue: write },
        RegistrarEmbalagemUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /embalagens', () => {
    it('retorna 201 ao registrar embalagem (gera lote + movimento + saldo)', async () => {
      const res = await request(app.getHttpServer()).post('/embalagens').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.lote.origemTipo).toBe('embalagem')
      expect(res.body.movimento.origem).toBe('embalagem')
      expect(lotes.lotes).toHaveLength(1)
      expect(movimentos.movimentos).toHaveLength(1)
      expect(saldos.saldos).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/embalagens')
        .send({ ...validBody, tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 com quantidade não positiva', async () => {
      const res = await request(app.getHttpServer())
        .post('/embalagens')
        .send({ ...validBody, quantidade: -1 })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando a transação falha', async () => {
      write.shouldFail = true
      const res = await request(app.getHttpServer()).post('/embalagens').send(validBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).post('/embalagens').send(validBody)
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).post('/embalagens').send(validBody)
      expect(res.status).toBe(403)
    })
  })
})
