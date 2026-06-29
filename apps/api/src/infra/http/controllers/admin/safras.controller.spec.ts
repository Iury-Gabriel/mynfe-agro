import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeSafra } from '@test/factories/make-safra'
import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { SafrasController } from './safras.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { SafraRepository } from '@/domain/application/repositories/safra-repository'
import { CreateSafraUseCase } from '@/domain/application/use-cases/safras/create-safra-use-case'
import { DeleteSafraUseCase } from '@/domain/application/use-cases/safras/delete-safra-use-case'
import { ListSafrasUseCase } from '@/domain/application/use-cases/safras/list-safras-use-case'
import { UpdateSafraUseCase } from '@/domain/application/use-cases/safras/update-safra-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['safra:read', 'safra:create', 'safra:update', 'safra:delete'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  areaId: 'area-1',
  cultura: 'Soja',
}

describe(SafrasController.name, () => {
  let app: INestApplication
  let repository: InMemorySafraRepository

  beforeEach(async () => {
    currentUser = mockUser
    repository = new InMemorySafraRepository()
    const module = await Test.createTestingModule({
      controllers: [SafrasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: SafraRepository, useValue: repository },
        ListSafrasUseCase,
        CreateSafraUseCase,
        UpdateSafraUseCase,
        DeleteSafraUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /safras', () => {
    it('retorna 200 com lista paginada do tenant', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1', cultura: 'A' }))
      await repository.create(makeSafra({ id: 'safra-2', tenantId: 'outro', cultura: 'B' }))

      const res = await request(app.getHttpServer()).get('/safras')

      expect(res.status).toBe(200)
      expect(res.body.safras).toHaveLength(1)
      expect(res.body.safras[0].id).toBe('safra-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/safras?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/safras')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/safras')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha na listagem', async () => {
      vi.spyOn(repository, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/safras')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /safras', () => {
    it('retorna 201 ao criar safra', async () => {
      const res = await request(app.getHttpServer()).post('/safras').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.safra.cultura).toBe('Soja')
      expect(res.body.safra.tenantId).toBe('tenant-1')
      expect(res.body.safra.areaId).toBe('area-1')
      expect(repository.safras).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/safras')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repository.safras).toHaveLength(0)
    })

    it('retorna 400 quando body inválido (cultura vazia)', async () => {
      const res = await request(app.getHttpServer())
        .post('/safras')
        .send({ ...validCreateBody, cultura: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando status fora do enum', async () => {
      const res = await request(app.getHttpServer())
        .post('/safras')
        .send({ ...validCreateBody, status: 'invalido' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha', async () => {
      repository.shouldFailOnCreate = true
      const res = await request(app.getHttpServer()).post('/safras').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['safra:read'] }
      const res = await request(app.getHttpServer()).post('/safras').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /safras/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer())
        .patch('/safras/safra-1')
        .send({ cultura: 'Milho', status: 'colhido' })

      expect(res.status).toBe(200)
      expect(res.body.safra.cultura).toBe('Milho')
      expect(res.body.safra.status).toBe('colhido')
    })

    it('retorna 404 cross-tenant (SafraNotFoundError)', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'outro-tenant' }))

      const res = await request(app.getHttpServer())
        .patch('/safras/safra-1')
        .send({ cultura: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('SafraNotFound')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer()).patch('/safras/safra-1').send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha no save', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer())
        .patch('/safras/safra-1')
        .send({ cultura: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /safras/:id', () => {
    it('retorna 200 ao remover (soft delete)', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/safras/safra-1')

      expect(res.status).toBe(200)
      expect(res.body.safra.id).toBe('safra-1')
      expect(repository.safras[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 cross-tenant', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).delete('/safras/safra-1')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('SafraNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['safra:read'] }
      const res = await request(app.getHttpServer()).delete('/safras/safra-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha no soft delete', async () => {
      await repository.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer()).delete('/safras/safra-1')
      expect(res.status).toBe(500)
    })
  })
})
