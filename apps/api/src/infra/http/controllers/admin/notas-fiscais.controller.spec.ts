import { APP_GUARD } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { makeEmpresa } from '@test/factories/make-empresa'
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { makeProduto } from '@test/factories/make-produto'
import { FakeFiscalProvider } from '@test/providers/fake-fiscal-provider'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import request from 'supertest'
import { describe, beforeEach, afterAll, it, expect, vi } from 'vitest'

import { NotasFiscaisController } from './notas-fiscais.controller'

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common'

import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'
import { AuditoriaLogRepository } from '@/domain/application/repositories/auditoria-log-repository'
import { EmpresaRepository } from '@/domain/application/repositories/empresa-repository'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { PedidoRepository } from '@/domain/application/repositories/pedido-repository'
import { ProdutoRepository } from '@/domain/application/repositories/produto-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { CancelarNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/cancelar-nota-fiscal-use-case'
import { EmitirNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/emitir-nota-fiscal-use-case'
import { GetNotaFiscalUseCase } from '@/domain/application/use-cases/faturamento/get-nota-fiscal-use-case'
import { ListNotasFiscaisUseCase } from '@/domain/application/use-cases/faturamento/list-notas-fiscais-use-case'
import { PermissionGuard } from '@/infra/http/guards/permission.guard'

const mockUser = {
  id: 'actor-1',
  email: 'actor@test.com',
  name: 'Actor',
  emailVerified: true,
  tenantId: 'tenant-1',
  permissions: ['nota:read', 'nota:emitir', 'nota:cancelar'],
}

let currentUser: Record<string, unknown> = mockUser

class MockAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = currentUser
    return true
  }
}

describe(NotasFiscaisController.name, () => {
  let app: INestApplication
  let notas: InMemoryNotaFiscalRepository
  let empresas: InMemoryEmpresaRepository
  let pedidos: InMemoryPedidoRepository
  let produtos: InMemoryProdutoRepository
  let fiscalProvider: FakeFiscalProvider

  beforeEach(async () => {
    currentUser = mockUser
    notas = new InMemoryNotaFiscalRepository()
    empresas = new InMemoryEmpresaRepository()
    pedidos = new InMemoryPedidoRepository()
    produtos = new InMemoryProdutoRepository()
    fiscalProvider = new FakeFiscalProvider()

    const module = await Test.createTestingModule({
      controllers: [NotasFiscaisController],
      providers: [
        { provide: APP_GUARD, useClass: MockAuthGuard },
        { provide: APP_GUARD, useClass: PermissionGuard },
        { provide: NotaFiscalRepository, useValue: notas },
        { provide: EmpresaRepository, useValue: empresas },
        { provide: PedidoRepository, useValue: pedidos },
        { provide: ProdutoRepository, useValue: produtos },
        { provide: FiscalProvider, useValue: fiscalProvider },
        { provide: AuditoriaLogRepository, useClass: InMemoryAuditoriaLogRepository },
        RegistrarAuditoriaUseCase,
        EmitirNotaFiscalUseCase,
        ListNotasFiscaisUseCase,
        GetNotaFiscalUseCase,
        CancelarNotaFiscalUseCase,
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  function seedFaturavel(): void {
    empresas.empresas.push(makeEmpresa({ id: 'empresa-1' }))
    produtos.produtos.push(makeProduto({ id: 'produto-1' }))
    const pedido = makePedido({ id: 'pedido-1', status: 'confirmado', itens: [] })
    pedido.addItem(makePedidoItem({ id: 'pi-1', pedidoId: 'pedido-1', quantidade: 100 }))
    pedidos.pedidos.push(pedido)
  }

  describe('POST /notas-fiscais/emitir', () => {
    it('retorna 201 e emite nota autorizada', async () => {
      seedFaturavel()

      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })

      expect(res.status).toBe(201)
      expect(res.body.nota.status).toBe('autorizada')
      expect(res.body.nota.chaveAcesso).toHaveLength(44)
      expect(res.body.nota).not.toHaveProperty('plugnotasId')
      expect(fiscalProvider.emitirCalls).toHaveLength(1)
    })

    it('retorna 404 quando a empresa não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'inexistente', pedidoId: 'pedido-1' })
      expect(res.status).toBe(404)
    })

    it('retorna 404 quando o pedido não pertence à empresa', async () => {
      empresas.empresas.push(makeEmpresa({ id: 'empresa-1' }))
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'inexistente' })
      expect(res.status).toBe(404)
    })

    it('retorna 409 quando o pedido não é faturável', async () => {
      empresas.empresas.push(makeEmpresa({ id: 'empresa-1' }))
      pedidos.pedidos.push(makePedido({ id: 'pedido-1', status: 'rascunho' }))
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 409 quando já existe nota autorizada para o pedido', async () => {
      seedFaturavel()
      notas.notas.push(makeNotaFiscal({ id: 'n-1', pedidoId: 'pedido-1', status: 'autorizada' }))
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })
      expect(res.status).toBe(409)
    })

    it('rejeita tenantId no body (schema strict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1', tenantId: 'evil' })
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão de emitir', async () => {
      currentUser = { ...mockUser, permissions: ['nota:read'] }
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha', async () => {
      seedFaturavel()
      vi.spyOn(notas, 'criarEmissao').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/emitir')
        .send({ empresaId: 'empresa-1', pedidoId: 'pedido-1' })
      expect(res.status).toBe(500)
    })
  })

  describe('GET /notas-fiscais', () => {
    it('retorna 200 paginado isolando por empresa', async () => {
      notas.notas.push(
        makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1' }),
        makeNotaFiscal({ id: 'n-2', empresaEmitenteId: 'outra' }),
      )

      const res = await request(app.getHttpServer()).get('/notas-fiscais?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.notas).toHaveLength(1)
      expect(res.body.total).toBe(1)
    })

    it('filtra por status', async () => {
      notas.notas.push(
        makeNotaFiscal({ id: 'n-1', status: 'autorizada' }),
        makeNotaFiscal({ id: 'n-2', status: 'pendente' }),
      )

      const res = await request(app.getHttpServer()).get(
        '/notas-fiscais?empresaId=empresa-1&status=autorizada',
      )

      expect(res.status).toBe(200)
      expect(res.body.notas).toHaveLength(1)
      expect(res.body.notas[0].status).toBe('autorizada')
    })

    it('filtra por pedidoId', async () => {
      notas.notas.push(
        makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', pedidoId: 'pedido-1' }),
        makeNotaFiscal({ id: 'n-2', empresaEmitenteId: 'empresa-1', pedidoId: 'pedido-2' }),
      )

      const res = await request(app.getHttpServer()).get(
        '/notas-fiscais?empresaId=empresa-1&pedidoId=pedido-1',
      )

      expect(res.status).toBe(200)
      expect(res.body.notas).toHaveLength(1)
      expect(res.body.notas[0].id).toBe('n-1')
    })

    it('rejeita query param desconhecido (schema strict)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/notas-fiscais?empresaId=empresa-1&foo=bar',
      )
      expect(res.status).toBe(400)
    })

    it('retorna 400 quando falta empresaId', async () => {
      const res = await request(app.getHttpServer()).get('/notas-fiscais')
      expect(res.status).toBe(400)
    })

    it('retorna 403 sem permissão', async () => {
      currentUser = { ...mockUser, permissions: [] }
      const res = await request(app.getHttpServer()).get('/notas-fiscais?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 403 sem tenant', async () => {
      currentUser = { ...mockUser, tenantId: null }
      const res = await request(app.getHttpServer()).get('/notas-fiscais?empresaId=empresa-1')
      expect(res.status).toBe(403)
    })

    it('retorna 500 quando o repositório falha', async () => {
      vi.spyOn(notas, 'count').mockRejectedValueOnce(new Error('db down'))
      const res = await request(app.getHttpServer()).get('/notas-fiscais?empresaId=empresa-1')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /notas-fiscais/:id', () => {
    it('retorna 200 com a nota', async () => {
      notas.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1' }))

      const res = await request(app.getHttpServer()).get('/notas-fiscais/n-1?empresaId=empresa-1')

      expect(res.status).toBe(200)
      expect(res.body.nota.id).toBe('n-1')
    })

    it('retorna 404 quando a nota não existe', async () => {
      const res = await request(app.getHttpServer()).get(
        '/notas-fiscais/inexistente?empresaId=empresa-1',
      )
      expect(res.status).toBe(404)
    })

    it('retorna 404 quando a nota é de outra empresa', async () => {
      notas.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'outra' }))
      const res = await request(app.getHttpServer()).get('/notas-fiscais/n-1?empresaId=empresa-1')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /notas-fiscais/:id/cancelar', () => {
    it('retorna 201 e cancela nota autorizada', async () => {
      notas.notas.push(
        makeNotaFiscal({
          id: 'n-1',
          empresaEmitenteId: 'empresa-1',
          status: 'autorizada',
          plugnotasId: 'pn-1',
        }),
      )

      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/n-1/cancelar')
        .send({ empresaId: 'empresa-1', motivo: 'erro de digitação' })

      expect(res.status).toBe(201)
      expect(res.body.nota.status).toBe('cancelada')
      expect(fiscalProvider.cancelarCalls).toContain('pn-1')
    })

    it('retorna 404 quando a nota não existe', async () => {
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/inexistente/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(404)
    })

    it('retorna 409 ao cancelar nota não autorizada', async () => {
      notas.notas.push(
        makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'pendente' }),
      )
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/n-1/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(409)
    })

    it('retorna 403 sem permissão de cancelar', async () => {
      currentUser = { ...mockUser, permissions: ['nota:read'] }
      const res = await request(app.getHttpServer())
        .post('/notas-fiscais/n-1/cancelar')
        .send({ empresaId: 'empresa-1' })
      expect(res.status).toBe(403)
    })
  })
})
