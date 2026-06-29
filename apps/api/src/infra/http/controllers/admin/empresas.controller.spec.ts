import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeEmpresa } from '@test/factories'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { EmpresasController } from './empresas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { ActivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/activate-empresa-use-case'
import { CreateEmpresaUseCase } from '@/domain/application/use-cases/empresas/create-empresa-use-case'
import { DeactivateEmpresaUseCase } from '@/domain/application/use-cases/empresas/deactivate-empresa-use-case'
import { ListEmpresasUseCase } from '@/domain/application/use-cases/empresas/list-empresas-use-case'
import { UpdateEmpresaUseCase } from '@/domain/application/use-cases/empresas/update-empresa-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['empresa:read', 'empresa:create', 'empresa:update', 'empresa:status'],
  empresaIds: ['empresa-1'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validCreateBody = {
  tipoPessoa: 'PJ',
  razaoSocial: 'Agro LTDA',
  cnpjCpf: '11222333000181',
  regimeTributario: 'simples_nacional',
  crt: '1',
  ambienteFiscal: 'homologacao',
}

describe(EmpresasController.name, () => {
  let app: INestApplication
  const listEmpresas = { execute: vi.fn() }
  const createEmpresa = { execute: vi.fn() }
  const updateEmpresa = { execute: vi.fn() }
  const activateEmpresa = { execute: vi.fn() }
  const deactivateEmpresa = { execute: vi.fn() }
  const empresaRepo = { findById: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    currentUser = mockUser
    const module = await Test.createTestingModule({
      controllers: [EmpresasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ListEmpresasUseCase, useValue: listEmpresas },
        { provide: CreateEmpresaUseCase, useValue: createEmpresa },
        { provide: UpdateEmpresaUseCase, useValue: updateEmpresa },
        { provide: ActivateEmpresaUseCase, useValue: activateEmpresa },
        { provide: DeactivateEmpresaUseCase, useValue: deactivateEmpresa },
        { provide: EmpresaRepository, useValue: empresaRepo },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /empresas', () => {
    it('retorna 200 com lista paginada', async () => {
      listEmpresas.execute.mockResolvedValue(
        right({ items: [makeEmpresa()], total: 1, page: 1, perPage: 20, totalPages: 1 }),
      )

      const res = await request(app.getHttpServer()).get('/empresas')

      expect(res.status).toBe(200)
      expect(res.body.empresas).toHaveLength(1)
      expect(res.body.empresas[0].cnpjCpfFormatado).toBe('11.222.333/0001-81')
      expect(res.body.total).toBe(1)
    })

    it('usa page e perPage do query', async () => {
      listEmpresas.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 2, perPage: 5, totalPages: 1 }),
      )

      await request(app.getHttpServer()).get('/empresas?page=2&perPage=5')

      expect(listEmpresas.execute).toHaveBeenCalledWith({ tenantId: 'tenant-1', page: 2, perPage: 5 })
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/empresas?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/empresas')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/empresas')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      listEmpresas.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).get('/empresas')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /empresas', () => {
    it('retorna 201 ao criar empresa', async () => {
      createEmpresa.execute.mockResolvedValue(right({ empresa: makeEmpresa() }))

      const res = await request(app.getHttpServer()).post('/empresas').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.empresa.razaoSocial).toBe('Agro Empresa LTDA')
      expect(createEmpresa.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', razaoSocial: 'Agro LTDA' }),
      )
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      createEmpresa.execute.mockResolvedValue(right({ empresa: makeEmpresa() }))

      const res = await request(app.getHttpServer())
        .post('/empresas')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(createEmpresa.execute).not.toHaveBeenCalled()
    })

    it('retorna 400 quando body inválido (razaoSocial vazio)', async () => {
      const res = await request(app.getHttpServer())
        .post('/empresas')
        .send({ ...validCreateBody, razaoSocial: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando InvalidCnpjCpfError', async () => {
      createEmpresa.execute.mockResolvedValue(left(new InvalidCnpjCpfError('000')))

      const res = await request(app.getHttpServer()).post('/empresas').send(validCreateBody)

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('InvalidCnpjCpf')
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      createEmpresa.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).post('/empresas').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['empresa:read'] }
      const res = await request(app.getHttpServer()).post('/empresas').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /empresas/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      updateEmpresa.execute.mockResolvedValue(right({ empresa: makeEmpresa({ razaoSocial: 'Nova' }) }))

      const res = await request(app.getHttpServer())
        .patch('/empresas/empresa-1')
        .send({ razaoSocial: 'Nova' })

      expect(res.status).toBe(200)
      expect(res.body.empresa.razaoSocial).toBe('Nova')
    })

    it('retorna 404 cross-tenant (EmpresaNotFoundError)', async () => {
      updateEmpresa.execute.mockResolvedValue(left(new EmpresaNotFoundError()))

      const res = await request(app.getHttpServer())
        .patch('/empresas/outro-tenant')
        .send({ razaoSocial: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('EmpresaNotFound')
    })

    it('retorna 400 quando InvalidCnpjCpfError', async () => {
      updateEmpresa.execute.mockResolvedValue(left(new InvalidCnpjCpfError('000')))

      const res = await request(app.getHttpServer())
        .patch('/empresas/empresa-1')
        .send({ cnpjCpf: '00000000000000' })

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('InvalidCnpjCpf')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/empresas/empresa-1')
        .send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      updateEmpresa.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer())
        .patch('/empresas/empresa-1')
        .send({ razaoSocial: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH /empresas/:id/activate', () => {
    it('retorna 200 ao ativar', async () => {
      activateEmpresa.execute.mockResolvedValue(right({ empresa: makeEmpresa({ status: 'ativo' }) }))

      const res = await request(app.getHttpServer()).patch('/empresas/empresa-1/activate')

      expect(res.status).toBe(200)
      expect(res.body.empresa.status).toBe('ativo')
    })

    it('retorna 404 quando não encontrada', async () => {
      activateEmpresa.execute.mockResolvedValue(left(new EmpresaNotFoundError()))
      const res = await request(app.getHttpServer()).patch('/empresas/x/activate')
      expect(res.status).toBe(404)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      activateEmpresa.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).patch('/empresas/empresa-1/activate')
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH /empresas/:id/deactivate', () => {
    it('retorna 200 ao inativar', async () => {
      deactivateEmpresa.execute.mockResolvedValue(
        right({ empresa: makeEmpresa({ status: 'inativo' }) }),
      )

      const res = await request(app.getHttpServer()).patch('/empresas/empresa-1/deactivate')

      expect(res.status).toBe(200)
      expect(res.body.empresa.status).toBe('inativo')
    })

    it('retorna 404 quando não encontrada', async () => {
      deactivateEmpresa.execute.mockResolvedValue(left(new EmpresaNotFoundError()))
      const res = await request(app.getHttpServer()).patch('/empresas/x/deactivate')
      expect(res.status).toBe(404)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      deactivateEmpresa.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).patch('/empresas/empresa-1/deactivate')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /empresas/active', () => {
    it('retorna 201 com a empresa quando o usuário tem acesso', async () => {
      empresaRepo.findById.mockResolvedValue(makeEmpresa({ id: 'empresa-1' }))

      const res = await request(app.getHttpServer())
        .post('/empresas/active')
        .send({ empresaId: 'empresa-1' })

      expect(res.status).toBe(201)
      expect(res.body.empresa.id).toBe('empresa-1')
      expect(empresaRepo.findById).toHaveBeenCalledWith('empresa-1', 'tenant-1')
    })

    it('retorna 403 quando a empresa não está na lista de acesso do usuário', async () => {
      const res = await request(app.getHttpServer())
        .post('/empresas/active')
        .send({ empresaId: 'empresa-sem-acesso' })

      expect(res.status).toBe(403)
      expect(empresaRepo.findById).not.toHaveBeenCalled()
    })

    it('retorna 403 quando o usuário não tem empresaIds', async () => {
      currentUser = { ...mockUser, empresaIds: undefined }
      const res = await request(app.getHttpServer())
        .post('/empresas/active')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(403)
    })

    it('retorna 404 quando a empresa não existe no tenant (cross-tenant)', async () => {
      empresaRepo.findById.mockResolvedValue(null)

      const res = await request(app.getHttpServer())
        .post('/empresas/active')
        .send({ empresaId: 'empresa-1' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('EmpresaNotFound')
    })

    it('retorna 400 quando body inválido', async () => {
      const res = await request(app.getHttpServer()).post('/empresas/active').send({})
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer())
        .post('/empresas/active')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(403)
    })
  })
})
