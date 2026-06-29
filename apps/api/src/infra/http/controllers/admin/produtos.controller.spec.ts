import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeProduto } from '@test/factories'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { ProdutosController } from './produtos.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { ActivateProdutoUseCase } from '@/domain/application/use-cases/produtos/activate-produto-use-case'
import { CreateProdutoUseCase } from '@/domain/application/use-cases/produtos/create-produto-use-case'
import { DeactivateProdutoUseCase } from '@/domain/application/use-cases/produtos/deactivate-produto-use-case'
import { ListProdutosUseCase } from '@/domain/application/use-cases/produtos/list-produtos-use-case'
import { UpdateProdutoUseCase } from '@/domain/application/use-cases/produtos/update-produto-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['produto:read', 'produto:create', 'produto:update', 'produto:status'],
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
  empresaId: 'empresa-1',
  descricao: 'Soja a granel',
  tipo: 'bruto',
  unidadeMedida: 'KG',
}

describe(ProdutosController.name, () => {
  let app: INestApplication
  const listProdutos = { execute: vi.fn() }
  const createProduto = { execute: vi.fn() }
  const updateProduto = { execute: vi.fn() }
  const activateProduto = { execute: vi.fn() }
  const deactivateProduto = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    currentUser = mockUser
    const module = await Test.createTestingModule({
      controllers: [ProdutosController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ListProdutosUseCase, useValue: listProdutos },
        { provide: CreateProdutoUseCase, useValue: createProduto },
        { provide: UpdateProdutoUseCase, useValue: updateProduto },
        { provide: ActivateProdutoUseCase, useValue: activateProduto },
        { provide: DeactivateProdutoUseCase, useValue: deactivateProduto },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /produtos', () => {
    it('retorna 200 com lista paginada', async () => {
      listProdutos.execute.mockResolvedValue(
        right({ items: [makeProduto()], total: 1, page: 1, perPage: 20, totalPages: 1 }),
      )

      const res = await request(app.getHttpServer()).get('/produtos')

      expect(res.status).toBe(200)
      expect(res.body.produtos).toHaveLength(1)
      expect(res.body.produtos[0].descricao).toBe('Soja a granel')
      expect(res.body.total).toBe(1)
    })

    it('usa page e perPage do query', async () => {
      listProdutos.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 2, perPage: 5, totalPages: 1 }),
      )

      await request(app.getHttpServer()).get('/produtos?page=2&perPage=5')

      expect(listProdutos.execute).toHaveBeenCalledWith({ tenantId: 'tenant-1', page: 2, perPage: 5 })
    })

    it('retorna 400 quando query inválido (page=0)', async () => {
      const res = await request(app.getHttpServer()).get('/produtos?page=0')
      expect(res.status).toBe(400)
    })

    it('retorna 403 quando o usuário não tem a permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/produtos')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/produtos')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      listProdutos.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).get('/produtos')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /produtos', () => {
    it('retorna 201 ao criar produto', async () => {
      createProduto.execute.mockResolvedValue(right({ produto: makeProduto() }))

      const res = await request(app.getHttpServer()).post('/produtos').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.produto.descricao).toBe('Soja a granel')
      expect(createProduto.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', empresaId: 'empresa-1' }),
      )
    })

    it('rejeita tenantId no body (schema strict) — tenant vem só da sessão', async () => {
      createProduto.execute.mockResolvedValue(right({ produto: makeProduto() }))

      const res = await request(app.getHttpServer())
        .post('/produtos')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(createProduto.execute).not.toHaveBeenCalled()
    })

    it('retorna 400 quando body inválido (descricao vazio)', async () => {
      const res = await request(app.getHttpServer())
        .post('/produtos')
        .send({ ...validCreateBody, descricao: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando tipo inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/produtos')
        .send({ ...validCreateBody, tipo: 'xpto' })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      createProduto.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).post('/produtos').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['produto:read'] }
      const res = await request(app.getHttpServer()).post('/produtos').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /produtos/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      updateProduto.execute.mockResolvedValue(right({ produto: makeProduto({ descricao: 'Milho' }) }))

      const res = await request(app.getHttpServer())
        .patch('/produtos/produto-1')
        .send({ descricao: 'Milho' })

      expect(res.status).toBe(200)
      expect(res.body.produto.descricao).toBe('Milho')
    })

    it('retorna 404 cross-tenant (ProdutoNotFoundError)', async () => {
      updateProduto.execute.mockResolvedValue(left(new ProdutoNotFoundError()))

      const res = await request(app.getHttpServer())
        .patch('/produtos/outro-tenant')
        .send({ descricao: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ProdutoNotFound')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/produtos/produto-1')
        .send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      updateProduto.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer())
        .patch('/produtos/produto-1')
        .send({ descricao: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH /produtos/:id/activate', () => {
    it('retorna 200 ao ativar', async () => {
      activateProduto.execute.mockResolvedValue(right({ produto: makeProduto({ status: 'ativo' }) }))

      const res = await request(app.getHttpServer()).patch('/produtos/produto-1/activate')

      expect(res.status).toBe(200)
      expect(res.body.produto.status).toBe('ativo')
    })

    it('retorna 404 quando não encontrado', async () => {
      activateProduto.execute.mockResolvedValue(left(new ProdutoNotFoundError()))
      const res = await request(app.getHttpServer()).patch('/produtos/x/activate')
      expect(res.status).toBe(404)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      activateProduto.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).patch('/produtos/produto-1/activate')
      expect(res.status).toBe(500)
    })
  })

  describe('PATCH /produtos/:id/deactivate', () => {
    it('retorna 200 ao inativar', async () => {
      deactivateProduto.execute.mockResolvedValue(
        right({ produto: makeProduto({ status: 'inativo' }) }),
      )

      const res = await request(app.getHttpServer()).patch('/produtos/produto-1/deactivate')

      expect(res.status).toBe(200)
      expect(res.body.produto.status).toBe('inativo')
    })

    it('retorna 404 quando não encontrado', async () => {
      deactivateProduto.execute.mockResolvedValue(left(new ProdutoNotFoundError()))
      const res = await request(app.getHttpServer()).patch('/produtos/x/deactivate')
      expect(res.status).toBe(404)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      deactivateProduto.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).patch('/produtos/produto-1/deactivate')
      expect(res.status).toBe(500)
    })
  })
})
