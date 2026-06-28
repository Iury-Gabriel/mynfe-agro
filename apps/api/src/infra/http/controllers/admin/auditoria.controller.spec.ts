import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeAuditoriaLog } from '@test/factories'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { AuditoriaController } from './auditoria.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { ListAuditoriaLogsUseCase } from '@/domain/application/use-cases/auditoria/list-auditoria-logs-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['auditoria:read'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(AuditoriaController.name, () => {
  let app: INestApplication
  let repo: InMemoryAuditoriaLogRepository

  beforeEach(async () => {
    currentUser = mockUser
    repo = new InMemoryAuditoriaLogRepository()

    const module = await Test.createTestingModule({
      controllers: [AuditoriaController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: AuditoriaLogRepository, useValue: repo },
        ListAuditoriaLogsUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /auditoria', () => {
    it('retorna 200 com lista paginada', async () => {
      repo.logs.push(makeAuditoriaLog({ id: 'l1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).get('/auditoria')

      expect(res.status).toBe(200)
      expect(res.body.logs).toHaveLength(1)
      expect(res.body.logs[0].entidade).toBe('tenant')
      expect(res.body.total).toBe(1)
    })

    it('usa page e perPage do query', async () => {
      const res = await request(app.getHttpServer()).get('/auditoria?page=2&perPage=5')

      expect(res.status).toBe(200)
      expect(res.body.page).toBe(2)
      expect(res.body.perPage).toBe(5)
    })

    it('aplica filtros de entidade, acao e usuario', async () => {
      repo.logs.push(
        makeAuditoriaLog({ id: 'l1', entidade: 'tenant', acao: 'editar', usuarioId: 'u1' }),
      )
      repo.logs.push(
        makeAuditoriaLog({ id: 'l2', entidade: 'produto', acao: 'criar', usuarioId: 'u2' }),
      )

      const res = await request(app.getHttpServer()).get(
        '/auditoria?entidade=tenant&acao=editar&usuarioId=u1',
      )

      expect(res.status).toBe(200)
      expect(res.body.logs).toHaveLength(1)
      expect(res.body.logs[0].id).toBe('l1')
    })

    it('retorna 400 quando acao inválida', async () => {
      const res = await request(app.getHttpServer()).get('/auditoria?acao=invalida')
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/auditoria?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/auditoria')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/auditoria')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      repo.findManyByTenant = () => Promise.reject(new Error('boom'))
      const res = await request(app.getHttpServer()).get('/auditoria')
      expect(res.status).toBe(500)
    })
  })
})
