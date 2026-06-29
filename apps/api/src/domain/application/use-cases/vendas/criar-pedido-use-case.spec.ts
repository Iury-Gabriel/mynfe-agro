import { makeProduto } from '@test/factories/make-produto'
import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { InMemoryPedidoRepository } from '@test/repositories/in-memory-pedido-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CriarPedidoUseCase, type CriarPedidoInput } from './criar-pedido-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

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
  let sut: CriarPedidoUseCase

  beforeEach(() => {
    pedidoRepo = new InMemoryPedidoRepository()
    produtoRepo = new InMemoryProdutoRepository()
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    sut = new CriarPedidoUseCase(pedidoRepo, produtoRepo, tabelaRepo)
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
    produtoRepo.produtos.push(makeProduto({ id: 'produto-1', precoPadrao: 99 }))

    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', quantidade: 10 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.itens[0].precoUnitario).toBe(42)
    }
  })

  it('usa zero quando não há tabela vigente nem produto cadastrado', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-x', quantidade: 5 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.pedido.itens[0].precoUnitario).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(pedidoRepo, 'create').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
