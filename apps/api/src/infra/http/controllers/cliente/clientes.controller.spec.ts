import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeCliente } from '@test/factories'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect } from 'vitest'

import { ClientesController } from './clientes.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { CreateClienteUseCase } from '@/domain/application/use-cases/clientes/create-cliente-use-case'
import { DeleteClienteUseCase } from '@/domain/application/use-cases/clientes/delete-cliente-use-case'
import { ListClientesUseCase } from '@/domain/application/use-cases/clientes/list-clientes-use-case'
import { UpdateClienteUseCase } from '@/domain/application/use-cases/clientes/update-cliente-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['cliente:read', 'cliente:create', 'cliente:update', 'cliente:delete'],
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
  razaoSocialNome: 'Cliente Agro LTDA',
  cnpjCpf: '11222333000181',
  indicadorIe: '1',
  contribuinteIcms: true,
}

describe(ClientesController.name, () => {
  let app: INestApplication
  let repo: InMemoryClienteRepository

  beforeEach(async () => {
    currentUser = mockUser
    repo = new InMemoryClienteRepository()

    const module = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ClienteRepository, useValue: repo },
        ListClientesUseCase,
        CreateClienteUseCase,
        UpdateClienteUseCase,
        DeleteClienteUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /clientes', () => {
    it('retorna 200 com lista paginada', async () => {
      repo.clientes.push(makeCliente({ tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).get('/clientes')

      expect(res.status).toBe(200)
      expect(res.body.clientes).toHaveLength(1)
      expect(res.body.clientes[0].cnpjCpfFormatado).toBe('11.222.333/0001-81')
      expect(res.body.total).toBe(1)
    })

    it('usa page e perPage do query', async () => {
      const res = await request(app.getHttpServer()).get('/clientes?page=2&perPage=5')

      expect(res.status).toBe(200)
      expect(res.body.page).toBe(2)
      expect(res.body.perPage).toBe(5)
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/clientes?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/clientes')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/clientes')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      repo.findManyByTenant = () => Promise.reject(new Error('boom'))
      const res = await request(app.getHttpServer()).get('/clientes')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /clientes', () => {
    it('retorna 201 ao criar cliente', async () => {
      const res = await request(app.getHttpServer()).post('/clientes').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.cliente.razaoSocialNome).toBe('Cliente Agro LTDA')
      expect(res.body.cliente.tenantId).toBe('tenant-1')
      expect(repo.clientes).toHaveLength(1)
    })

    it('persiste endereços de entrega informados', async () => {
      const res = await request(app.getHttpServer())
        .post('/clientes')
        .send({
          ...validCreateBody,
          enderecosEntrega: [{ enderecoLogradouro: 'Rua da Entrega', principal: true }],
        })

      expect(res.status).toBe(201)
      expect(res.body.cliente.enderecosEntrega).toHaveLength(1)
      expect(res.body.cliente.enderecosEntrega[0].enderecoLogradouro).toBe('Rua da Entrega')
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      const res = await request(app.getHttpServer())
        .post('/clientes')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(repo.clientes).toHaveLength(0)
    })

    it('retorna 400 quando body inválido (razaoSocialNome vazio)', async () => {
      const res = await request(app.getHttpServer())
        .post('/clientes')
        .send({ ...validCreateBody, razaoSocialNome: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando cnpjCpf inválido (InvalidCnpjCpfError)', async () => {
      const res = await request(app.getHttpServer())
        .post('/clientes')
        .send({ ...validCreateBody, cnpjCpf: '00000000000' })

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('InvalidCnpjCpf')
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      repo.shouldFailOnCreate = true
      const res = await request(app.getHttpServer()).post('/clientes').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['cliente:read'] }
      const res = await request(app.getHttpServer()).post('/clientes').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /clientes/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer())
        .patch('/clientes/cliente-1')
        .send({ razaoSocialNome: 'Nova Razão' })

      expect(res.status).toBe(200)
      expect(res.body.cliente.razaoSocialNome).toBe('Nova Razão')
    })

    it('retorna 404 cross-tenant (ClienteNotFoundError)', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-outro', tenantId: 'outro-tenant' }))

      const res = await request(app.getHttpServer())
        .patch('/clientes/cliente-outro')
        .send({ razaoSocialNome: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ClienteNotFound')
    })

    it('retorna 400 quando cnpjCpf inválido (InvalidCnpjCpfError)', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer())
        .patch('/clientes/cliente-1')
        .send({ cnpjCpf: '00000000000' })

      expect(res.status).toBe(400)
      expect(res.body.error.kind).toBe('InvalidCnpjCpf')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer()).patch('/clientes/cliente-1').send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
      repo.shouldFailOnSave = true

      const res = await request(app.getHttpServer())
        .patch('/clientes/cliente-1')
        .send({ razaoSocialNome: 'X' })
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['cliente:read'] }
      const res = await request(app.getHttpServer())
        .patch('/clientes/cliente-1')
        .send({ razaoSocialNome: 'X' })
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /clientes/:id', () => {
    it('retorna 200 ao remover (soft-delete)', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

      const res = await request(app.getHttpServer()).delete('/clientes/cliente-1')

      expect(res.status).toBe(200)
      expect(res.body.cliente.id).toBe('cliente-1')
      expect(repo.clientes[0].deletedAt).not.toBeNull()
    })

    it('retorna 404 quando não encontrado', async () => {
      const res = await request(app.getHttpServer()).delete('/clientes/inexistente')
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ClienteNotFound')
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      repo.clientes.push(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
      repo.shouldFailOnSave = true

      const res = await request(app.getHttpServer()).delete('/clientes/cliente-1')
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['cliente:read'] }
      const res = await request(app.getHttpServer()).delete('/clientes/cliente-1')
      expect(res.status).toBe(403)
    })
  })
})
