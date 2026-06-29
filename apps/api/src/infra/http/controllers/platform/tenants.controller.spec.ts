import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { TenantsController } from './tenants.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmailAlreadyInUseError } from '@/domain/application/use-cases/errors/email-already-in-use-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'
import { CreateTenantUseCase } from '@/domain/application/use-cases/tenants/create-tenant-use-case'
import { ListTenantsUseCase } from '@/domain/application/use-cases/tenants/list-tenants-use-case'
import { SetTenantStatusUseCase } from '@/domain/application/use-cases/tenants/set-tenant-status-use-case'
import { Tenant } from '@/domain/enterprise/entities/tenant'
import { User } from '@/domain/enterprise/entities/user'
import { SuperAdminGuard } from '@/infra/http/guards/super-admin.guard'

const superAdminUser = { id: 'sa-1', email: 'sa@test.com', isSuperAdmin: true }

let currentUser: Record<string, unknown> = superAdminUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

function makeTenant(id: string, nome: string): Tenant {
  return Tenant.create(
    { nome, labelArea: 'Talhão', createdAt: new Date('2026-01-01'), updatedAt: new Date() },
    new UniqueEntityID(id),
  )
}

function makeUser() {
  return User.create(
    {
      name: 'Ada',
      email: 'ada@example.com',
      emailVerified: true,
      image: null,
      roleIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID('user-1'),
  )
}

const validCreateBody = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'senha-super-segura',
  tenantNome: 'Fazenda Ada',
  empresa: {
    razaoSocial: 'Agro Ada LTDA',
    cnpjCpf: '11222333000181',
    tipoPessoa: 'PJ',
    regimeTributario: 'simples_nacional',
    crt: '1',
  },
}

describe(TenantsController.name, () => {
  let app: INestApplication
  const listTenants = { execute: vi.fn() }
  const createTenant = { execute: vi.fn() }
  const setTenantStatus = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    currentUser = superAdminUser
    const module = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: SuperAdminGuard },
        { provide: ListTenantsUseCase, useValue: listTenants },
        { provide: CreateTenantUseCase, useValue: createTenant },
        { provide: SetTenantStatusUseCase, useValue: setTenantStatus },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('autorização super-admin', () => {
    it('retorna 403 quando o usuário não é super-admin', async () => {
      currentUser = { id: 'u1', email: 'u@test.com', isSuperAdmin: false }
      const res = await request(app.getHttpServer()).get('/platform/tenants')
      expect(res.status).toBe(403)
      expect(listTenants.execute).not.toHaveBeenCalled()
    })

    it('libera super-admin', async () => {
      listTenants.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 1, perPage: 20, totalPages: 1 }),
      )
      const res = await request(app.getHttpServer()).get('/platform/tenants')
      expect(res.status).toBe(200)
    })
  })

  describe('GET /platform/tenants', () => {
    it('retorna lista paginada com contagens', async () => {
      listTenants.execute.mockResolvedValue(
        right({
          items: [{ tenant: makeTenant('t1', 'Fazenda A'), empresasCount: 2, usuariosCount: 3 }],
          total: 1,
          page: 1,
          perPage: 20,
          totalPages: 1,
        }),
      )

      const res = await request(app.getHttpServer()).get('/platform/tenants')

      expect(res.status).toBe(200)
      expect(res.body.tenants).toHaveLength(1)
      expect(res.body.tenants[0]).toMatchObject({
        id: 't1',
        nome: 'Fazenda A',
        empresasCount: 2,
        usuariosCount: 3,
      })
      expect(res.body.total).toBe(1)
    })

    it('repassa page e perPage', async () => {
      listTenants.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 3, perPage: 5, totalPages: 1 }),
      )

      await request(app.getHttpServer()).get('/platform/tenants?page=3&perPage=5')

      expect(listTenants.execute).toHaveBeenCalledWith({ page: 3, perPage: 5 })
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/platform/tenants?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 500 em erro inesperado', async () => {
      listTenants.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).get('/platform/tenants')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /platform/tenants', () => {
    it('cria tenant e retorna 201', async () => {
      createTenant.execute.mockResolvedValue(
        right({ user: makeUser(), tenant: makeTenant('t1', 'Fazenda Ada') }),
      )

      const res = await request(app.getHttpServer())
        .post('/platform/tenants')
        .send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.tenant).toMatchObject({ id: 't1', nome: 'Fazenda Ada', status: 'ativo' })
    })

    it('retorna 409 quando o email já está em uso', async () => {
      createTenant.execute.mockResolvedValue(left(new EmailAlreadyInUseError('ada@example.com')))

      const res = await request(app.getHttpServer())
        .post('/platform/tenants')
        .send(validCreateBody)

      expect(res.status).toBe(409)
      expect(res.body.error.kind).toBe('EmailAlreadyInUse')
    })

    it('retorna 400 quando o CNPJ é inválido', async () => {
      createTenant.execute.mockResolvedValue(left(new InvalidCnpjCpfError('000')))

      const res = await request(app.getHttpServer())
        .post('/platform/tenants')
        .send(validCreateBody)

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('InvalidCnpjCpf')
    })

    it('retorna 500 em erro inesperado', async () => {
      createTenant.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer())
        .post('/platform/tenants')
        .send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer())
        .post('/platform/tenants')
        .send({ ...validCreateBody, foo: 'bar' })
      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /platform/tenants/:id/status', () => {
    it('atualiza o status e retorna 200', async () => {
      const tenant = makeTenant('t1', 'Fazenda A')
      tenant.suspend()
      setTenantStatus.execute.mockResolvedValue(right({ tenant }))

      const res = await request(app.getHttpServer())
        .patch('/platform/tenants/t1/status')
        .send({ status: 'suspenso' })

      expect(res.status).toBe(200)
      expect(res.body.tenant.status).toBe('suspenso')
      expect(setTenantStatus.execute).toHaveBeenCalledWith({ tenantId: 't1', status: 'suspenso' })
    })

    it('retorna 404 quando o tenant não existe', async () => {
      setTenantStatus.execute.mockResolvedValue(left(new TenantNotFoundError()))

      const res = await request(app.getHttpServer())
        .patch('/platform/tenants/x/status')
        .send({ status: 'ativo' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('TenantNotFound')
    })

    it('retorna 400 quando status inválido', async () => {
      const res = await request(app.getHttpServer())
        .patch('/platform/tenants/t1/status')
        .send({ status: 'inativo' })
      expect(res.status).toBe(400)
    })

    it('retorna 500 em erro inesperado', async () => {
      setTenantStatus.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer())
        .patch('/platform/tenants/t1/status')
        .send({ status: 'ativo' })
      expect(res.status).toBe(500)
    })
  })
})
