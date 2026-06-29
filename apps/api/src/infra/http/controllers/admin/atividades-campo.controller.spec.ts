import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeAtividadeCampo } from '@test/factories/make-atividade-campo'
import { InMemoryAtividadeCampoRepository } from '@test/repositories/in-memory-atividade-campo-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { AtividadesCampoController } from './atividades-campo.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'
import { CreateAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/create-atividade-campo-use-case'
import { DeleteAtividadeCampoUseCase } from '@/domain/application/use-cases/atividades-campo/delete-atividade-campo-use-case'
import { ListAtividadesCampoUseCase } from '@/domain/application/use-cases/atividades-campo/list-atividades-campo-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['atividade:read', 'atividade:create', 'atividade:delete'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  tipo: 'plantio',
  data: '2024-10-01',
}

describe(AtividadesCampoController.name, () => {
  let app: INestApplication
  let repository: InMemoryAtividadeCampoRepository

  beforeEach(async () => {
    currentUser = mockUser
    repository = new InMemoryAtividadeCampoRepository()
    const module = await Test.createTestingModule({
      controllers: [AtividadesCampoController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: AtividadeCampoRepository, useValue: repository },
        ListAtividadesCampoUseCase,
        CreateAtividadeCampoUseCase,
        DeleteAtividadeCampoUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /atividades-campo', () => {
    it('retorna 200 com lista paginada do tenant', async () => {
      await repository.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))
      await repository.create(makeAtividadeCampo({ id: 'atividade-2', tenantId: 'outro' }))

      const res = await request(app.getHttpServer()).get('/atividades-campo')

      expect(res.status).toBe(200)
      expect(res.body.atividades).toHaveLength(1)
      expect(res.body.atividades[0].id).toBe('atividade-1')
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/atividades-campo?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/atividades-campo')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/atividades-campo')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha na listagem', async () => {
      vi.spyOn(repository, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/atividades-campo')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /atividades-campo', () => {
    it('retorna 201 ao criar atividade', async () => {
      const res = await request(app.getHttpServer())
        .post('/atividades-campo')
        .send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.atividade.tipo).toBe('plantio')
      expect(res.body.atividade.tenantId).toBe('tenant-1')
      expect(repository.atividades).toHaveLength(1)
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/atividades-campo')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repository.atividades).toHaveLength(0)
    })

    it('retorna 400 quando tipo fora do enum', async () => {
      const res = await request(app.getHttpServer())
        .post('/atividades-campo')
        .send({ ...validCreateBody, tipo: 'invalido' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 quando o repositório falha', async () => {
      repository.shouldFailOnCreate = true
      const res = await request(app.getHttpServer())
        .post('/atividades-campo')
        .send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['atividade:read'] }
      const res = await request(app.getHttpServer())
        .post('/atividades-campo')
        .send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /atividades-campo/:id', () => {
    it('retorna 200 ao remover (soft delete)', async () => {
      await repository.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/atividades-campo/atividade-1')

      expect(res.status).toBe(200)
      expect(res.body.atividade.id).toBe('atividade-1')
      expect(repository.atividades[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 cross-tenant', async () => {
      await repository.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'outro-tenant' }))
      const res = await request(app.getHttpServer()).delete('/atividades-campo/atividade-1')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('AtividadeCampoNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['atividade:read'] }
      const res = await request(app.getHttpServer()).delete('/atividades-campo/atividade-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha no soft delete', async () => {
      await repository.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))
      repository.shouldFailOnSave = true
      const res = await request(app.getHttpServer()).delete('/atividades-campo/atividade-1')
      expect(res.status).toBe(500)
    })
  })
})
