import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeFazenda } from '@test/factories/make-fazenda'
import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { FazendasController } from './fazendas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { CreateFazendaUseCase } from '@/domain/application/use-cases/fazendas/create-fazenda-use-case'
import { DeleteFazendaUseCase } from '@/domain/application/use-cases/fazendas/delete-fazenda-use-case'
import { ListFazendasUseCase } from '@/domain/application/use-cases/fazendas/list-fazendas-use-case'
import { UpdateFazendaUseCase } from '@/domain/application/use-cases/fazendas/update-fazenda-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['fazenda:read', 'fazenda:create', 'fazenda:update', 'fazenda:delete'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  empresaId: 'empresa-1',
  nome: 'Fazenda Boa Vista',
}

describe(FazendasController.name, () => {
  let app: INestApplication
  let repository: InMemoryFazendaRepository

  beforeEach(async () => {
    currentUser = mockUser
    repository = new InMemoryFazendaRepository()
    const module = await Test.createTestingModule({
      controllers: [FazendasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: FazendaRepository, useValue: repository },
        ListFazendasUseCase,
        CreateFazendaUseCase,
        UpdateFazendaUseCase,
        DeleteFazendaUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /fazendas', () => {
    it('retorna 200 com lista paginada do tenant', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1', nome: 'A' }))
      await repository.create(makeFazenda({ id: 'fazenda-2', tenantId: 'outro', nome: 'B' }))

      const res = await request(app.getHttpServer()).get('/fazendas')

      expect(res.status).toBe(200)
      expect(res.body.fazendas).toHaveLength(1)
      expect(res.body.fazendas[0].id).toBe('fazenda-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/fazendas?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/fazendas')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/fazendas')
      expect(res.status).toBe(403)
    })
  })

  describe('POST /fazendas', () => {
    it('retorna 201 ao criar fazenda', async () => {
      const res = await request(app.getHttpServer()).post('/fazendas').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.fazenda.nome).toBe('Fazenda Boa Vista')
      expect(res.body.fazenda.tenantId).toBe('tenant-1')
      expect(res.body.fazenda.empresaId).toBe('empresa-1')
      expect(repository.fazendas).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/fazendas')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repository.fazendas).toHaveLength(0)
    })

    it('retorna 400 quando body inválido (nome vazio)', async () => {
      const res = await request(app.getHttpServer())
        .post('/fazendas')
        .send({ ...validCreateBody, nome: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha', async () => {
      repository.shouldFailOnCreate = true
      const res = await request(app.getHttpServer()).post('/fazendas').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['fazenda:read'] }
      const res = await request(app.getHttpServer()).post('/fazendas').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /fazendas/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer())
        .patch('/fazendas/fazenda-1')
        .send({ nome: 'Nova' })

      expect(res.status).toBe(200)
      expect(res.body.fazenda.nome).toBe('Nova')
    })

    it('retorna 404 cross-tenant (FazendaNotFoundError)', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'outro-tenant' }))

      const res = await request(app.getHttpServer())
        .patch('/fazendas/fazenda-1')
        .send({ nome: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('FazendaNotFound')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/fazendas/fazenda-1')
        .send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha no save', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer())
        .patch('/fazendas/fazenda-1')
        .send({ nome: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /fazendas/:id', () => {
    it('retorna 200 ao remover (soft delete)', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/fazendas/fazenda-1')

      expect(res.status).toBe(200)
      expect(res.body.fazenda.id).toBe('fazenda-1')
      expect(repository.fazendas[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 cross-tenant', async () => {
      await repository.create(makeFazenda({ id: 'fazenda-1', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).delete('/fazendas/fazenda-1')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('FazendaNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['fazenda:read'] }
      const res = await request(app.getHttpServer()).delete('/fazendas/fazenda-1')
      expect(res.status).toBe(403)
    })
  })
})
