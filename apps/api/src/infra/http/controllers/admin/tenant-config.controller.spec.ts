import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeTenant } from '@test/factories'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryTenantRepository } from '@test/repositories/in-memory-tenant-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { TenantConfigController } from './tenant-config.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { GetTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/get-tenant-config-use-case'
import { UpdateTenantConfigUseCase } from '@/domain/application/use-cases/tenant-config/update-tenant-config-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['view:settings', 'manage:settings'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(TenantConfigController.name, () => {
  let app: INestApplication
  let tenantRepo: InMemoryTenantRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository

  beforeEach(async () => {
    currentUser = mockUser
    tenantRepo = new InMemoryTenantRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()

    const module = await Test.createTestingModule({
      controllers: [TenantConfigController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: TenantRepository, useValue: tenantRepo },
        { provide: AuditoriaLogRepository, useValue: auditoriaRepo },
        GetTenantConfigUseCase,
        UpdateTenantConfigUseCase,
        RegistrarAuditoriaUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /tenant/config', () => {
    it('retorna 200 com a config do tenant', async () => {
      tenantRepo.tenants.push(makeTenant({ id: 'tenant-1', nome: 'Fazenda X', labelArea: 'Gleba' }))

      const res = await request(app.getHttpServer()).get('/tenant/config')

      expect(res.status).toBe(200)
      expect(res.body.tenant.nome).toBe('Fazenda X')
      expect(res.body.tenant.labelArea).toBe('Gleba')
    })

    it('retorna 404 quando o tenant não existe', async () => {
      const res = await request(app.getHttpServer()).get('/tenant/config')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('TenantNotFound')
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/tenant/config')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/tenant/config')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      tenantRepo.findById = () => Promise.reject(new Error('boom'))
      const res = await request(app.getHttpServer()).get('/tenant/config')
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH /tenant/config', () => {
    it('retorna 200 ao atualizar e registra auditoria', async () => {
      tenantRepo.tenants.push(makeTenant({ id: 'tenant-1', nome: 'Antigo' }))

      const res = await request(app.getHttpServer())
        .patch('/tenant/config')
        .send({ nome: 'Novo', labelArea: 'Lote', diaCorteConsolidacao: 15 })

      expect(res.status).toBe(200)
      expect(res.body.tenant.nome).toBe('Novo')
      expect(res.body.tenant.labelArea).toBe('Lote')
      expect(res.body.tenant.diaCorteConsolidacao).toBe(15)
      expect(auditoriaRepo.logs).toHaveLength(1)
      expect(auditoriaRepo.logs[0].entidade).toBe('tenant')
      expect(auditoriaRepo.logs[0].usuarioId).toBe('actor-1')
    })

    it('retorna 404 quando o tenant não existe', async () => {
      const res = await request(app.getHttpServer()).patch('/tenant/config').send({ nome: 'X' })
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('TenantNotFound')
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      tenantRepo.tenants.push(makeTenant({ id: 'tenant-1' }))
      const res = await request(app.getHttpServer())
        .patch('/tenant/config')
        .send({ nome: 'X', tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
    })

    it('retorna 400 quando diaCorteConsolidacao fora do intervalo', async () => {
      tenantRepo.tenants.push(makeTenant({ id: 'tenant-1' }))
      const res = await request(app.getHttpServer())
        .patch('/tenant/config')
        .send({ diaCorteConsolidacao: 40 })

      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      tenantRepo.tenants.push(makeTenant({ id: 'tenant-1' }))
      tenantRepo.shouldFailOnSave = true
      const res = await request(app.getHttpServer()).patch('/tenant/config').send({ nome: 'X' })
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão de escrita', async () => {
      currentUser = { ...mockUser, permissions: ['view:settings'] }
      const res = await request(app.getHttpServer()).patch('/tenant/config').send({ nome: 'X' })
      expect(res.status).toBe(403)
    })
  })
})
