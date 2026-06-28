import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeCustoProducao } from '@test/factories/make-custo-producao'
import { InMemoryCustoProducaoRepository } from '@test/repositories/in-memory-custo-producao-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { CustosProducaoController } from './custos-producao.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'
import { CreateCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/create-custo-producao-use-case'
import { DeleteCustoProducaoUseCase } from '@/domain/application/use-cases/custos-producao/delete-custo-producao-use-case'
import { ListCustosProducaoUseCase } from '@/domain/application/use-cases/custos-producao/list-custos-producao-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['custo:read', 'custo:create', 'custo:delete'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  tipo: 'insumo',
  descricao: 'Adubo NPK',
  valor: 5000,
  data: '2024-10-01',
}

describe(CustosProducaoController.name, () => {
  let app: INestApplication
  let repository: InMemoryCustoProducaoRepository

  beforeEach(async () => {
    currentUser = mockUser
    repository = new InMemoryCustoProducaoRepository()
    const module = await Test.createTestingModule({
      controllers: [CustosProducaoController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: CustoProducaoRepository, useValue: repository },
        ListCustosProducaoUseCase,
        CreateCustoProducaoUseCase,
        DeleteCustoProducaoUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /custos-producao', () => {
    it('retorna 200 com lista paginada do tenant', async () => {
      await repository.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))
      await repository.create(makeCustoProducao({ id: 'custo-2', tenantId: 'outro' }))

      const res = await request(app.getHttpServer()).get('/custos-producao')

      expect(res.status).toBe(200)
      expect(res.body.custos).toHaveLength(1)
      expect(res.body.custos[0].id).toBe('custo-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/custos-producao?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/custos-producao')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/custos-producao')
      expect(res.status).toBe(403)
    })
  })

  describe('POST /custos-producao', () => {
    it('retorna 201 ao criar custo', async () => {
      const res = await request(app.getHttpServer()).post('/custos-producao').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.custo.descricao).toBe('Adubo NPK')
      expect(res.body.custo.valor).toBe(5000)
      expect(res.body.custo.tenantId).toBe('tenant-1')
      expect(repository.custos).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/custos-producao')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repository.custos).toHaveLength(0)
    })

    it('retorna 400 quando body inválido (descricao vazia)', async () => {
      const res = await request(app.getHttpServer())
        .post('/custos-producao')
        .send({ ...validCreateBody, descricao: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando tipo fora do enum', async () => {
      const res = await request(app.getHttpServer())
        .post('/custos-producao')
        .send({ ...validCreateBody, tipo: 'invalido' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha', async () => {
      repository.shouldFailOnCreate = true
      const res = await request(app.getHttpServer()).post('/custos-producao').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['custo:read'] }
      const res = await request(app.getHttpServer()).post('/custos-producao').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /custos-producao/:id', () => {
    it('retorna 200 ao remover (soft delete)', async () => {
      await repository.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/custos-producao/custo-1')

      expect(res.status).toBe(200)
      expect(res.body.custo.id).toBe('custo-1')
      expect(repository.custos[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 cross-tenant', async () => {
      await repository.create(makeCustoProducao({ id: 'custo-1', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).delete('/custos-producao/custo-1')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('CustoProducaoNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['custo:read'] }
      const res = await request(app.getHttpServer()).delete('/custos-producao/custo-1')
      expect(res.status).toBe(403)
    })
  })
})
