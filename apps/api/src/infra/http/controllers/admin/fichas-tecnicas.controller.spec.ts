import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeProdutoFichaTecnica } from '@test/factories'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { FichasTecnicasController } from './fichas-tecnicas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { left, right } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'
import { CreateFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/create-ficha-tecnica-use-case'
import { DeleteFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/delete-ficha-tecnica-use-case'
import { ListFichasTecnicasUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/list-fichas-tecnicas-use-case'
import { UpdateFichaTecnicaUseCase } from '@/domain/application/use-cases/produtos-ficha-tecnica/update-ficha-tecnica-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['produto:read', 'produto:update'],
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
  produtoId: 'produto-1',
  descricaoComponente: 'Milho moído',
}

describe(FichasTecnicasController.name, () => {
  let app: INestApplication
  const listFichas = { execute: vi.fn() }
  const createFicha = { execute: vi.fn() }
  const updateFicha = { execute: vi.fn() }
  const deleteFicha = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()
    currentUser = mockUser
    const module = await Test.createTestingModule({
      controllers: [FichasTecnicasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: ListFichasTecnicasUseCase, useValue: listFichas },
        { provide: CreateFichaTecnicaUseCase, useValue: createFicha },
        { provide: UpdateFichaTecnicaUseCase, useValue: updateFicha },
        { provide: DeleteFichaTecnicaUseCase, useValue: deleteFicha },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /fichas-tecnicas', () => {
    it('retorna 200 com lista paginada', async () => {
      listFichas.execute.mockResolvedValue(
        right({ items: [makeProdutoFichaTecnica()], total: 1, page: 1, perPage: 20, totalPages: 1 }),
      )

      const res = await request(app.getHttpServer()).get('/fichas-tecnicas?produtoId=produto-1')

      expect(res.status).toBe(200)
      expect(res.body.fichasTecnicas).toHaveLength(1)
      expect(res.body.fichasTecnicas[0].descricaoComponente).toBe('Milho moído')
      expect(res.body.total).toBe(1)
    })

    it('passa produtoId, page e perPage do query', async () => {
      listFichas.execute.mockResolvedValue(
        right({ items: [], total: 0, page: 2, perPage: 5, totalPages: 1 }),
      )

      await request(app.getHttpServer()).get('/fichas-tecnicas?produtoId=p9&page=2&perPage=5')

      expect(listFichas.execute).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        produtoId: 'p9',
        page: 2,
        perPage: 5,
      })
    })

    it('retorna 400 quando produtoId ausente', async () => {
      const res = await request(app.getHttpServer()).get('/fichas-tecnicas')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/fichas-tecnicas?produtoId=produto-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 quando o usuário não tem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/fichas-tecnicas?produtoId=produto-1')
      expect(res.status).toBe(403)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      listFichas.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).get('/fichas-tecnicas?produtoId=produto-1')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /fichas-tecnicas', () => {
    it('retorna 201 ao criar', async () => {
      createFicha.execute.mockResolvedValue(right({ fichaTecnica: makeProdutoFichaTecnica() }))

      const res = await request(app.getHttpServer()).post('/fichas-tecnicas').send(validCreateBody)

      expect(res.status).toBe(201)
      expect(res.body.fichaTecnica.descricaoComponente).toBe('Milho moído')
      expect(createFicha.execute).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', produtoId: 'produto-1' }),
      )
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      createFicha.execute.mockResolvedValue(right({ fichaTecnica: makeProdutoFichaTecnica() }))

      const res = await request(app.getHttpServer())
        .post('/fichas-tecnicas')
        .send({ ...validCreateBody, tenantId: 'tenant-evil' })

      expect(res.status).toBe(400)
      expect(createFicha.execute).not.toHaveBeenCalled()
    })

    it('retorna 400 quando body inválido (descricaoComponente vazio)', async () => {
      const res = await request(app.getHttpServer())
        .post('/fichas-tecnicas')
        .send({ ...validCreateBody, descricaoComponente: '' })
      expect(res.status).toBe(400)
    })

    it('retorna 404 quando o produto não existe', async () => {
      createFicha.execute.mockResolvedValue(left(new ProdutoNotFoundError()))
      const res = await request(app.getHttpServer()).post('/fichas-tecnicas').send(validCreateBody)
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ProdutoNotFound')
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      createFicha.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).post('/fichas-tecnicas').send(validCreateBody)
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['produto:read'] }
      const res = await request(app.getHttpServer()).post('/fichas-tecnicas').send(validCreateBody)
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /fichas-tecnicas/:id', () => {
    it('retorna 200 ao atualizar', async () => {
      updateFicha.execute.mockResolvedValue(
        right({ fichaTecnica: makeProdutoFichaTecnica({ descricaoComponente: 'Soja' }) }),
      )

      const res = await request(app.getHttpServer())
        .patch('/fichas-tecnicas/ficha-1')
        .send({ descricaoComponente: 'Soja' })

      expect(res.status).toBe(200)
      expect(res.body.fichaTecnica.descricaoComponente).toBe('Soja')
    })

    it('retorna 404 cross-tenant (FichaTecnicaNotFoundError)', async () => {
      updateFicha.execute.mockResolvedValue(left(new FichaTecnicaNotFoundError()))

      const res = await request(app.getHttpServer())
        .patch('/fichas-tecnicas/outra')
        .send({ descricaoComponente: 'X' })

      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('FichaTecnicaNotFound')
    })

    it('retorna 400 quando body inválido (campo desconhecido)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/fichas-tecnicas/ficha-1')
        .send({ foo: 'bar' })
      expect(res.status).toBe(400)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      updateFicha.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer())
        .patch('/fichas-tecnicas/ficha-1')
        .send({ descricaoComponente: 'X' })
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /fichas-tecnicas/:id', () => {
    it('retorna 200 ao remover', async () => {
      deleteFicha.execute.mockResolvedValue(right(null))

      const res = await request(app.getHttpServer()).delete('/fichas-tecnicas/ficha-1')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('retorna 404 quando não encontrado', async () => {
      deleteFicha.execute.mockResolvedValue(left(new FichaTecnicaNotFoundError()))
      const res = await request(app.getHttpServer()).delete('/fichas-tecnicas/x')
      expect(res.status).toBe(404)
    })

    it('repassa erro genérico via fromUseCaseError', async () => {
      deleteFicha.execute.mockResolvedValue(left(new UnexpectedError(new Error('x'))))
      const res = await request(app.getHttpServer()).delete('/fichas-tecnicas/ficha-1')
      expect(res.status).toBe(500)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: ['produto:read'] }
      const res = await request(app.getHttpServer()).delete('/fichas-tecnicas/ficha-1')
      expect(res.status).toBe(403)
    })
  })
})
