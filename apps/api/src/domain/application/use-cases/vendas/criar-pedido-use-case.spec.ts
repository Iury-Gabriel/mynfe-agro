import { makeCliente } from '@test/factories/make-cliente'
import { makeLote } from '@test/factories/make-lote'
import { makeProduto } from '@test/factories/make-produto'
import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CriarPedidoUseCase, type CriarPedidoInput } from './criar-pedido-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

function makeInput(override: Partial<CriarPedidoInput> = {}): CriarPedidoInput {
  return {
    tenantId: 'tenant-1',
    empresaFaturadoraId: 'empresa-1',
    clienteId: 'cliente-1',
    data: new Date('2024-10-01'),
    itens: [{ produtoId: 'produto-1', quantidade: 100, precoUnitario: 25 }],
    ...override,
  }
}

describe(CriarPedidoUseCase.name, () => {
  let pedidoRepo: InMemoryPedidoRepository
  let produtoRepo: InMemoryProdutoRepository
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let clienteRepo: InMemoryClienteRepository
  let loteRepo: InMemoryLoteRepository
  let sut: CriarPedidoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    produtoRepo = new InMemoryProdutoRepository()
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    clienteRepo = new InMemoryClienteRepository()
    loteRepo = new InMemoryLoteRepository()
    clienteRepo.clientes.push(makeCliente({ id: 'cliente-1' }))
    produtoRepo.produtos.push(makeProduto({ id: 'produto-1' }))
    sut = new CriarPedidoUseCase(pedidoRepo, produtoRepo, tabelaRepo, clienteRepo, loteRepo)
  })

  it('cria pedido em rascunho usando o preço informado no item', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.status).toBe('rascunho')
      expect(result.value.pedido.itens[0].precoUnitario).toBe(25)
    }
    expect(pedidoRepo.pedidos).toHaveLength(1)
  })

  it('cria pedido confirmado quando solicitado', async () => {
    const result = await sut.execute(makeInput({ confirmar: true }))

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.status).toBe('confirmado')
    }
  })

  it('resolve o preço pela tabela do cliente quando o item não informa preço', async () => {
    tabelaRepo.tabelas.push(
      makeTabelaPrecoCliente({
        clienteId: 'cliente-1',
        produtoId: 'produto-1',
        preco: 42,
        vigenciaInicio: new Date('2024-01-01'),
      }),
    )

    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', quantidade: 10 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.itens[0].precoUnitario).toBe(42)
    }
  })

  it('usa zero quando não há tabela vigente nem preço padrão do produto', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', quantidade: 5 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.itens[0].precoUnitario).toBe(0)
    }
  })

  it('consome o pedido quando o lote informado existe no tenant', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1' }))

    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', loteId: 'lote-1', quantidade: 5, precoUnitario: 10 }] }),
    )

    expect(result.isRight()).toBe(true)
  })

  it('retorna ClienteNotFoundError quando o cliente não existe no tenant', async () => {
    const result = await sut.execute(makeInput({ clienteId: 'cliente-x' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando algum produto não existe no tenant', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-x', quantidade: 5, precoUnitario: 10 }] }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna LoteNotFoundError quando o lote informado não existe no tenant', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', loteId: 'lote-x', quantidade: 5, precoUnitario: 10 }] }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(pedidoRepo, 'create').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
