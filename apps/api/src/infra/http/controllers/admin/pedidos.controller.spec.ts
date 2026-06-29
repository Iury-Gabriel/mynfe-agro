import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeCliente } from '@test/factories/make-cliente'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeProduto } from '@test/factories/make-produto'
import { makeRemessa } from '@test/factories/make-remessa'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { PedidosController } from './pedidos.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { ClienteRepository } from '@/domain/application/repositories/cliente-repository'
import { EstoqueSaldoRepository } from '@/domain/application/repositories/estoque-saldo-repository'
import { EstoqueWriteRepository } from '@/domain/application/repositories/estoque-write-repository'
import { LoteRepository } from '@/domain/application/repositories/lote-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RemessaRepository } from '@/domain/application/repositories/remessa-repository'
import { TabelaPrecoClienteRepository } from '@/domain/application/repositories/tabela-preco-cliente-repository'
import { CancelarPedidoUseCase } from '@/domain/application/use-cases/vendas/cancelar-pedido-use-case'
import { ConfirmarPedidoUseCase } from '@/domain/application/use-cases/vendas/confirmar-pedido-use-case'
import { CriarPedidoUseCase } from '@/domain/application/use-cases/vendas/criar-pedido-use-case'
import { GetPedidoUseCase } from '@/domain/application/use-cases/vendas/get-pedido-use-case'
import { ListPedidosUseCase } from '@/domain/application/use-cases/vendas/list-pedidos-use-case'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['pedido:read', 'pedido:create', 'pedido:confirm', 'pedido:cancel'],
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

describe(PedidosController.name, () => {
  let app: INestApplication
  let pedidos: InMemoryPedidoRepository
  let remessas: InMemoryRemessaRepository
  let produtos: InMemoryProdutoRepository
  let tabelas: InMemoryTabelaPrecoClienteRepository
  let saldos: InMemoryEstoqueSaldoRepository
  let lotes: InMemoryLoteRepository
  let clientes: InMemoryClienteRepository
  let estoqueWrite: InMemoryEstoqueWriteRepository

  beforeEach(async () => {
    currentUser = mockUser
    pedidos = new InMemoryPedidoRepository()
    remessas = new InMemoryRemessaRepository()
    produtos = new InMemoryProdutoRepository()
    tabelas = new InMemoryTabelaPrecoClienteRepository()
    saldos = new InMemoryEstoqueSaldoRepository()
    lotes = new InMemoryLoteRepository()
    clientes = new InMemoryClienteRepository()
    clientes.clientes.push(makeCliente({ id: 'cliente-1' }))
    produtos.produtos.push(makeProduto({ id: 'produto-1' }))
    estoqueWrite = new InMemoryEstoqueWriteRepository(
      new InMemoryColheitaRepository(),
      lotes,
      new InMemoryEstoqueMovimentoRepository(),
      saldos,
    )

    const module = await Test.createTestingModule({
      controllers: [PedidosController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: PedidoRepository, useValue: pedidos },
        { provide: RemessaRepository, useValue: remessas },
        { provide: ProdutoRepository, useValue: produtos },
        { provide: TabelaPrecoClienteRepository, useValue: tabelas },
        { provide: EstoqueSaldoRepository, useValue: saldos },
        { provide: LoteRepository, useValue: lotes },
        { provide: ClienteRepository, useValue: clientes },
        { provide: EstoqueWriteRepository, useValue: estoqueWrite },
        CriarPedidoUseCase,
        ConfirmarPedidoUseCase,
        CancelarPedidoUseCase,
        ListPedidosUseCase,
        GetPedidoUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /pedidos', () => {
    it('retorna 201 e cria pedido rascunho com itens', async () => {
      const res = await request(app.getHttpServer()).post('/pedidos').send(validBody)

      expect(res.status).toBe(201)
      expect(res.body.pedido.status).toBe('rascunho')
      expect(res.body.pedido.itens).toHaveLength(1)
      expect(res.body.pedido.itens[0].precoUnitario).toBe(10)
      expect(pedidos.pedidos).toHaveLength(1)
    })

    it('retorna 201 com confirmar:true e status confirmado', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({ ...validBody, confirmar: true })

      expect(res.status).toBe(201)
      expect(res.body.pedido.status).toBe('confirmado')
    })

    it('retorna 400 quando itens vazio', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({ ...validBody, itens: [] })
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const { empresaId: _omit, ...semEmpresa } = validBody
      const res = await request(app.getHttpServer()).post('/pedidos').send(semEmpresa)
      expect(res.status).toBe(400)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({ ...validBody, tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão de create', async () => {
      currentUser = { ...mockUser, permissions: ['pedido:read'] }
      const res = await request(app.getHttpServer()).post('/pedidos').send(validBody)
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).post('/pedidos').send(validBody)
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao criar', async () => {
      vi.spyOn(pedidos, 'create').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).post('/pedidos').send(validBody)
      expect(res.status).toBe(500)
    })

    it('retorna 404 quando o cliente não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({ ...validBody, clienteId: 'cliente-x' })
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ClienteNotFound')
    })

    it('retorna 404 quando o produto não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          ...validBody,
          itens: [{ produtoId: 'produto-x', quantidade: 100, precoUnitario: 10 }],
        })
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('ProdutoNotFound')
    })

    it('retorna 404 quando o lote não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          ...validBody,
          itens: [{ produtoId: 'produto-1', loteId: 'lote-x', quantidade: 100, precoUnitario: 10 }],
        })
      expect(res.status).toBe(404)
      expect(res.body.error.kind).toBe('LoteNotFound')
    })
  })

  describe('POST /pedidos/:id/confirmar', () => {
    it('retorna 200 e baixa estoque', async () => {
      const pedido = makePedido({ id: 'p-1', status: 'rascunho', itens: [] })
      pedido.addItem(makePedidoItem({ id: 'pi-1', pedidoId: 'p-1', quantidade: 50 }))
      pedidos.pedidos.push(pedido)
      seedSaldo(saldos, 200)

      const res = await request(app.getHttpServer())
        .post('/pedidos/p-1/confirmar')
        .send({ empresaId: 'empresa-1' })

      expect(res.status).toBe(201)
      expect(res.body.pedido.status).toBe('confirmado')
      expect(saldos.saldos[0].quantidadeDisponivel).toBe(150)
    })

    it('retorna 404 quando pedido não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos/inexistente/confirmar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(404)
    })

    it('retorna 409 ao confirmar pedido já confirmado', async () => {
      pedidos.pedidos.push(makePedido({ id: 'p-2', status: 'confirmado' }))
      const res = await request(app.getHttpServer())
        .post('/pedidos/p-2/confirmar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 400 quando saldo insuficiente', async () => {
      const pedido = makePedido({ id: 'p-3', status: 'rascunho', itens: [] })
      pedido.addItem(makePedidoItem({ id: 'pi-3', pedidoId: 'p-3', quantidade: 500 }))
      pedidos.pedidos.push(pedido)
      seedSaldo(saldos, 100)

      const res = await request(app.getHttpServer())
        .post('/pedidos/p-3/confirmar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /pedidos/:id/cancelar', () => {
    it('retorna 200 ao cancelar rascunho', async () => {
      pedidos.pedidos.push(makePedido({ id: 'p-4', status: 'rascunho' }))
      const res = await request(app.getHttpServer())
        .post('/pedidos/p-4/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(201)
      expect(res.body.pedido.status).toBe('cancelado')
    })

    it('retorna 409 ao cancelar pedido faturado', async () => {
      pedidos.pedidos.push(makePedido({ id: 'p-5', status: 'faturado' }))
      const res = await request(app.getHttpServer())
        .post('/pedidos/p-5/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 404 quando pedido não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/pedidos/inexistente/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /pedidos', () => {
    it('retorna 200 paginado isolando por empresa', async () => {
      pedidos.pedidos.push(
        makePedido({ id: 'p-6', empresaFaturadoraId: 'empresa-1' }),
        makePedido({ id: 'p-7', empresaFaturadoraId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/pedidos?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.pedidos).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/pedidos')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/pedidos?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha ao contar', async () => {
      vi.spyOn(pedidos, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/pedidos?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /pedidos/:id', () => {
    it('retorna 200 com remessas vinculadas', async () => {
      pedidos.pedidos.push(makePedido({ id: 'p-8' }))
      remessas.remessas.push(
        makeRemessa({ id: 'r-1', status: 'consolidada', pedidoConsolidadoId: 'p-8' }),
      )

      const res = await request(app.getHttpServer()).get('/pedidos/p-8?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.pedido.remessas).toHaveLength(1)
      expect(res.body.pedido.remessas[0].id).toBe('r-1')
    })

    it('retorna 404 quando pedido não existe', async () => {
      const res = await request(app.getHttpServer()).get('/pedidos/inexistente?empresaId=empresa-1')
      expect(res.status).toBe(404)
    })
  })
})
