import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeLote } from '@test/factories/make-lote'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { RemessasController } from './remessas.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { CancelarRemessaUseCase } from '@/domain/application/use-cases/vendas/cancelar-remessa-use-case'
import { CriarRemessaUseCase } from '@/domain/application/use-cases/vendas/criar-remessa-use-case'
import { GetRemessaUseCase } from '@/domain/application/use-cases/vendas/get-remessa-use-case'
import { ListRemessasUseCase } from '@/domain/application/use-cases/vendas/list-remessas-use-case'
import { MarcarRemessaEntregueUseCase } from '@/domain/application/use-cases/vendas/marcar-remessa-entregue-use-case'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['remessa:read', 'remessa:create', 'remessa:update', 'remessa:cancel'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

const validBody = {
  empresaId: 'empresa-1',
  clienteId: 'cliente-1',
  data: '2024-10-01',
  itens: [{ produtoId: 'produto-1', quantidade: 100, precoUnitario: 10 }],
}

function seedSaldo(
  saldos: InMemoryEstoqueSaldoRepository,
  quantidadeDisponivel: number,
  loteId: string | null = null,
): void {
  saldos.saldos.push(
    EstoqueSaldo.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      produtoId: 'produto-1',
      loteId,
      quantidadeDisponivel,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }),
  )
}

describe(RemessasController.name, () => {
  let app: INestApplication
  let remessas: InMemoryRemessaRepository
  let produtos: InMemoryProdutoRepository
  let tabelas: InMemoryTabelaPrecoClienteRepository
  let saldos: InMemoryEstoqueSaldoRepository
  let lotes: InMemoryLoteRepository
  let estoqueWrite: InMemoryEstoqueWriteRepository

  beforeEach(async () => {
    currentUser = mockUser
    remessas = new InMemoryRemessaRepository()
    produtos = new InMemoryProdutoRepository()
    tabelas = new InMemoryTabelaPrecoClienteRepository()
    saldos = new InMemoryEstoqueSaldoRepository()
    lotes = new InMemoryLoteRepository()
    estoqueWrite = new InMemoryEstoqueWriteRepository(
      new InMemoryColheitaRepository(),
      lotes,
      new InMemoryEstoqueMovimentoRepository(),
      saldos,
    )

    const module = await Test.createTestingModule({
      controllers: [RemessasController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: RemessaRepository, useValue: remessas },
        { provide: ProdutoRepository, useValue: produtos },
        { provide: TabelaPrecoClienteRepository, useValue: tabelas },
        { provide: EstoqueSaldoRepository, useValue: saldos },
        { provide: LoteRepository, useValue: lotes },
        { provide: EstoqueWriteRepository, useValue: estoqueWrite },
        CriarRemessaUseCase,
        MarcarRemessaEntregueUseCase,
        CancelarRemessaUseCase,
        ListRemessasUseCase,
        GetRemessaUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /remessas', () => {
    it('retorna 201 e baixa estoque', async () => {
      seedSaldo(saldos, 200)

      const res = await request(app.getHttpServer()).post('/remessas').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.remessa.status).toBe('aberta')
      expect(res.body.remessa.itens).toHaveLength(1)
      expect(remessas.remessas).toHaveLength(1)
      expect(saldos.saldos[0].quantidadeDisponivel).toBe(100)
    })

    it('retorna 400 quando saldo insuficiente', async () => {
      seedSaldo(saldos, 10)
      const res = await request(app.getHttpServer()).post('/remessas').send(validBody)
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando itens vazio', async () => {
      const res = await request(app.getHttpServer())
        .post('/remessas')
        .send({ ...validBody, itens: [] })
      expect(res.status).toBe(400)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/remessas')
        .send({ ...validBody, tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão de create', async () => {
      currentUser = { ...mockUser, permissions: ['remessa:read'] }
      const res = await request(app.getHttpServer()).post('/remessas').send(validBody)
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).post('/remessas').send(validBody)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /remessas/:id/entregue', () => {
    it('retorna 200 ao marcar remessa aberta como entregue', async () => {
      remessas.remessas.push(makeRemessa({ id: 'r-1', status: 'aberta' }))
      const res = await request(app.getHttpServer())
        .post('/remessas/r-1/entregue')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(201)
      expect(res.body.remessa.status).toBe('entregue')
    })

    it('retorna 409 quando remessa não está aberta', async () => {
      remessas.remessas.push(makeRemessa({ id: 'r-2', status: 'entregue' }))
      const res = await request(app.getHttpServer())
        .post('/remessas/r-2/entregue')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 404 quando remessa não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/remessas/inexistente/entregue')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(404)
    })
  })

  describe('POST /remessas/:id/cancelar', () => {
    it('retorna 200 ao cancelar remessa aberta', async () => {
      remessas.remessas.push(makeRemessa({ id: 'r-3', status: 'aberta' }))
      const res = await request(app.getHttpServer())
        .post('/remessas/r-3/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(201)
      expect(res.body.remessa.status).toBe('cancelada')
    })

    it('retorna 409 ao cancelar remessa consolidada', async () => {
      remessas.remessas.push(makeRemessa({ id: 'r-4', status: 'consolidada' }))
      const res = await request(app.getHttpServer())
        .post('/remessas/r-4/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 404 quando remessa não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/remessas/inexistente/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /remessas', () => {
    it('retorna 200 paginado isolando por empresa', async () => {
      remessas.remessas.push(
        makeRemessa({ id: 'r-5', empresaFaturadoraId: 'empresa-1' }),
        makeRemessa({ id: 'r-6', empresaFaturadoraId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/remessas?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.remessas).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/remessas')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/remessas?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao contar', async () => {
      vi.spyOn(remessas, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/remessas?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /remessas/:id', () => {
    it('retorna 200 com lotes quando item tem loteId', async () => {
      const remessa = makeRemessa({ id: 'r-7', itens: [] })
      remessa.addItem(makeRemessaItem({ id: 'ri-1', remessaId: 'r-7', loteId: 'lote-1' }))
      remessas.remessas.push(remessa)
      lotes.lotes.push(makeLote({ id: 'lote-1' }))

      const res = await request(app.getHttpServer()).get('/remessas/r-7?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.remessa.lotes).toHaveLength(1)
      expect(res.body.remessa.lotes[0].id).toBe('lote-1')
    })

    it('retorna 404 quando remessa não existe', async () => {
      const res = await request(app.getHttpServer()).get('/remessas/inexistente?empresaId=empresa-1')
      expect(res.status).toBe(404)
    })
  })
})
