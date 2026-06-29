import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeTabelaPrecoCliente } from '@test/factories'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { TabelaPrecosController } from './tabela-precos.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { TabelaPrecoNotFoundError } from '@/domain/application/use-cases/errors/tabela-preco-not-found-error'
import { CreateTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/create-tabela-preco-use-case'
import { DeleteTabelaPrecoUseCase } from '@/domain/application/use-cases/precos/delete-tabela-preco-use-case'
import { ListTabelaPrecosUseCase } from '@/domain/application/use-cases/precos/list-tabela-precos-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['preco:read', 'preco:create', 'preco:delete'],
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
  clienteId: 'cliente-1',
  produtoId: 'produto-1',
  preco: 150,
}

describe(TabelaPrecosController.name, () => {
  let app: INestApplication
  const listTabelaPrecos = { execute: vi.fn() }
  const createTabelaPreco = { execute: vi.fn() }
  const deleteTabelaPreco = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    currentUser = mockUser
    const module = await Test.createTestingModule({
      controllers: [TabelaPrecosController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ListTabelaPrecosUseCase, useValue: listTabelaPrecos },
        { provide: CreateTabelaPrecoUseCase, useValue: createTabelaPreco },
        { provide: DeleteTabelaPrecoUseCase, useValue: deleteTabelaPreco },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /tabela-precos', () => {
    it('retorna 200 com lista paginada', async () => {
      listTabelaPrecos.execute.mockResolvedValue(
        right({ items: [makeTabelaPrecoCliente()], total: 1, page: 1, perPage: 20, totalPages: 1 }),
      )

      const res = await request(app.getHttpServer()).get('/tabela-precos')

      expect(res.status).toBe(200)
      expect(res.body.tabelaPrecos).toHaveLength(1)
      expect(res.body.tabelaPrecos[0].preco).toBe(100)
      expect(res.body.total).toBe(1)
    })

    it('usa page e perPage do query', async () => {
      listTabelaPrecos.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 2, perPage: 5, totalPages: 1 }),
      )

      await request(app.getHttpServer()).get('/tabela-precos?page=2&perPage=5')

      expect(listTabelaPrecos.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 2,
        perPage: 5,
      })
    })

    it('retorna 400 quando query inválido (perPage>100)', async () => {
      const res = await request(app.getHttpServer()).get('/tabela-precos?perPage=999')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/tabela-precos')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/tabela-precos')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      listTabelaPrecos.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).get('/tabela-precos')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /tabela-precos', () => {
    it('retorna 201 ao criar', async () => {
      createTabelaPreco.execute.mockResolvedValue(right({ tabelaPreco: makeTabelaPrecoCliente() }))

      const res = await request(app.getHttpServer()).post('/tabela-precos').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.tabelaPreco.preco).toBe(100)
      expect(createTabelaPreco.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', clienteId: 'cliente-1', preco: 150 }),
      )
    })

    it('coage vigências de string ISO para Date', async () => {
      createTabelaPreco.execute.mockResolvedValue(right({ tabelaPreco: makeTabelaPrecoCliente() }))

      await request(app.getHttpServer())
        .post('/tabela-precos')
        .send({ ...validCreateBody, vigenciaInicio: '2024-01-01', vigenciaFim: '2024-12-31' })

      const call = createTabelaPreco.execute.mock.calls[0]![0]
      expect(call.vigenciaInicio).toBeInstanceOf(Date)
      expect(call.vigenciaFim).toBeInstanceOf(Date)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tabela-precos')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(createTabelaPreco.execute).not.toHaveBeenCalled()
    })

    it('retorna 400 quando preco negativo', async () => {
      const res = await request(app.getHttpServer())
        .post('/tabela-precos')
        .send({ ...validCreateBody, preco: -1 })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      createTabelaPreco.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).post('/tabela-precos').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 404 quando o cliente não existe', async () => {
      createTabelaPreco.execute.mockResolvedValue(left(new ClienteNotFoundError()))
      const res = await request(app.getHttpServer()).post('/tabela-precos').send(validCreateBody)
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ClienteNotFound')
    })

    it('retorna 404 quando o produto não existe', async () => {
      createTabelaPreco.execute.mockResolvedValue(left(new ProdutoNotFoundError()))
      const res = await request(app.getHttpServer()).post('/tabela-precos').send(validCreateBody)
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ProdutoNotFound')
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['preco:read'] }
      const res = await request(app.getHttpServer()).post('/tabela-precos').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /tabela-precos/:id', () => {
    it('retorna 200 ao deletar', async () => {
      deleteTabelaPreco.execute.mockResolvedValue(right(null))

      const res = await request(app.getHttpServer()).delete('/tabela-precos/tabela-preco-1')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(deleteTabelaPreco.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        tabelaPrecoId: 'tabela-preco-1',
      })
    })

    it('retorna 404 quando não encontrada', async () => {
      deleteTabelaPreco.execute.mockResolvedValue(left(new TabelaPrecoNotFoundError()))

      const res = await request(app.getHttpServer()).delete('/tabela-precos/x')

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('TabelaPrecoNotFound')
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      deleteTabelaPreco.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).delete('/tabela-precos/tabela-preco-1')
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['preco:read'] }
      const res = await request(app.getHttpServer()).delete('/tabela-precos/tabela-preco-1')
      expect(res.status).toBe(403)
    })
  })
})
