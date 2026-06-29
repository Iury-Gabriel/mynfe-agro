import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeArea } from '@test/factories/make-area'
import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { AreasController } from './areas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { CreateAreaUseCase } from '@/domain/application/use-cases/areas/create-area-use-case'
import { DeleteAreaUseCase } from '@/domain/application/use-cases/areas/delete-area-use-case'
import { ListAreasUseCase } from '@/domain/application/use-cases/areas/list-areas-use-case'
import { UpdateAreaUseCase } from '@/domain/application/use-cases/areas/update-area-use-case'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['area:read', 'area:create', 'area:update', 'area:delete'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  fazendaId: 'fazenda-1',
  identificacao: 'Talhão 01',
}

describe(AreasController.name, () => {
  let app: INestApplication
  let repository: InMemoryAreaRepository

  beforeEach(async () => {
    currentUser = mockUser
    repository = new InMemoryAreaRepository()
    const module = await Test.createTestingModule({
      controllers: [AreasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: AreaRepository, useValue: repository },
        { provide: AuditoriaLogRepository, useClass: InMemoryAuditoriaLogRepository },
        RegistrarAuditoriaUseCase,
        ListAreasUseCase,
        CreateAreaUseCase,
        UpdateAreaUseCase,
        DeleteAreaUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /areas', () => {
    it('retorna 200 com lista paginada do tenant', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
      await repository.create(makeArea({ id: 'area-2', tenantId: 'outro' }))

      const res = await request(app.getHttpServer()).get('/areas')

      expect(res.status).toBe(200)
      expect(res.body.areas).toHaveLength(1)
      expect(res.body.areas[0].id).toBe('area-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/areas?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/areas')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/areas')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha na listagem', async () => {
      vi.spyOn(repository, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/areas')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /areas', () => {
    it('retorna 201 ao criar área', async () => {
      const res = await request(app.getHttpServer())
        .post('/areas')
        .send({ ...validCreateBody, geometria: { type: 'Point' } })

      expect(res.status).toBe(201)
      expect(res.body.area.identificacao).toBe('Talhão 01')
      expect(res.body.area.tenantId).toBe('tenant-1')
      expect(res.body.area.fazendaId).toBe('fazenda-1')
      expect(res.body.area.geometria).toEqual({ type: 'Point' })
      expect(repository.areas).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/areas')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repository.areas).toHaveLength(0)
    })

    it('retorna 400 quando body inválido (identificacao vazia)', async () => {
      const res = await request(app.getHttpServer())
        .post('/areas')
        .send({ ...validCreateBody, identificacao: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha', async () => {
      repository.shouldFailOnCreate = true
      const res = await request(app.getHttpServer()).post('/areas').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['area:read'] }
      const res = await request(app.getHttpServer()).post('/areas').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /areas/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer())
        .patch('/areas/area-1')
        .send({ identificacao: 'Novo' })

      expect(res.status).toBe(200)
      expect(res.body.area.identificacao).toBe('Novo')
    })

    it('retorna 404 cross-tenant (AreaNotFoundError)', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'outro-tenant' }))

      const res = await request(app.getHttpServer())
        .patch('/areas/area-1')
        .send({ identificacao: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('AreaNotFound')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer()).patch('/areas/area-1').send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha no save', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer())
        .patch('/areas/area-1')
        .send({ identificacao: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /areas/:id', () => {
    it('retorna 200 ao remover (soft delete)', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/areas/area-1')

      expect(res.status).toBe(200)
      expect(res.body.area.id).toBe('area-1')
      expect(repository.areas[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 cross-tenant', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).delete('/areas/area-1')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('AreaNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['area:read'] }
      const res = await request(app.getHttpServer()).delete('/areas/area-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha no soft delete', async () => {
      await repository.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer()).delete('/areas/area-1')
      expect(res.status).toBe(500)
    })
  })
})
