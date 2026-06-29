import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { makeLote } from '@test/factories/make-lote'
import { makePedido } from '@test/factories/make-pedido'
import { makePedidoItem } from '@test/factories/make-pedido-item'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfirmarPedidoUseCase } from './confirmar-pedido-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { PedidoNotFoundError } from '@/domain/application/use-cases/errors/pedido-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

describe(ConfirmarPedidoUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let saldoRepo: InMemoryEstoqueSaldoRepository
  let loteRepo: InMemoryLoteRepository
  let colheitaRepo: InMemoryColheitaRepository
  let movimentoRepo: InMemoryEstoqueMovimentoRepository
  let writeRepo: InMemoryEstoqueWriteRepository
  let sut: ConfirmarPedidoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    saldoRepo = new InMemoryEstoqueSaldoRepository()
    loteRepo = new InMemoryLoteRepository()
    colheitaRepo = new InMemoryColheitaRepository()
    movimentoRepo = new InMemoryEstoqueMovimentoRepository()
    writeRepo = new InMemoryEstoqueWriteRepository(colheitaRepo, loteRepo, movimentoRepo, saldoRepo)
    sut = new ConfirmarPedidoUseCase(pedidoRepo, saldoRepo, loteRepo, writeRepo)
  })

  const baseInput = {
    tenantId: 'tenant-1',
    empresaFaturadoraId: 'empresa-1',
    pedidoId: 'pedido-1',
  }

  it('confirma o pedido baixando saldo existente e consumindo o lote', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-1', quantidadeDisponivel: 500 }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', quantidadeAtual: 500 }))
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: 'lote-1', quantidade: 100 })],
      }),
    )

    const result = await sut.execute({ ...baseInput, usuarioId: 'user-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.status).toBe('confirmado')
    }
    expect(saldoRepo.saldos[0].quantidadeDisponivel).toBe(400)
    expect(loteRepo.lotes[0].quantidadeAtual).toBe(400)
  })

  it('cria saldo novo quando não existe e item sem lote', async () => {
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: null, quantidade: 0 })],
      }),
    )

    const result = await sut.execute(baseInput)

    expect(result.isRight()).toBe(true)
    expect(saldoRepo.saldos).toHaveLength(1)
  })

  it('retorna PedidoNotFoundError quando o pedido é de outra empresa', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PedidoNotFoundError)
  })

  it('retorna TransicaoInvalidaError quando o pedido não está em rascunho', async () => {
    pedidoRepo.pedidos.push(makePedido({ id: 'pedido-1', status: 'confirmado' }))

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoInvalidaError)
  })

  it('retorna EstoqueInsuficienteError quando o saldo não cobre a saída', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: null, quantidadeDisponivel: 10 }),
    )
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: null, quantidade: 100 })],
      }),
    )

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('retorna EstoqueInsuficienteError quando o lote referenciado não existe', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-x', quantidadeDisponivel: 500 }),
    )
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: 'lote-x', quantidade: 100 })],
      }),
    )

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('retorna EstoqueInsuficienteError quando o lote não tem quantidade suficiente', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-1', quantidadeDisponivel: 500 }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', quantidadeAtual: 5 }))
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: 'lote-1', quantidade: 100 })],
      }),
    )

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    pedidoRepo.pedidos.push(
      makePedido({
        id: 'pedido-1',
        status: 'rascunho',
        itens: [makePedidoItem({ produtoId: 'produto-1', loteId: null, quantidade: 0 })],
      }),
    )
    vi.spyOn(pedidoRepo, 'save').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
