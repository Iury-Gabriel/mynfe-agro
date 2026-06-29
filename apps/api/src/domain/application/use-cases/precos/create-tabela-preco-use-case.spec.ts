import { makeCliente } from '@test/factories/make-cliente'
import { makeProduto } from '@test/factories/make-produto'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateTabelaPrecoUseCase, type CreateTabelaPrecoInput } from './create-tabela-preco-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

function makeInput(override: Partial<CreateTabelaPrecoInput> = {}): CreateTabelaPrecoInput {
  return {
    tenantId: 'tenant-1',
    clienteId: 'cliente-1',
    produtoId: 'produto-1',
    preco: 100,
    ...override,
  }
}

describe(CreateTabelaPrecoUseCase.name, () => {
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let clienteRepo: InMemoryClienteRepository
  let produtoRepo: InMemoryProdutoRepository
  let sut: CreateTabelaPrecoUseCase

  beforeEach(() => {
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    clienteRepo = new InMemoryClienteRepository()
    produtoRepo = new InMemoryProdutoRepository()
    clienteRepo.clientes.push(makeCliente({ id: 'cliente-1' }))
    produtoRepo.produtos.push(makeProduto({ id: 'produto-1' }))
    sut = new CreateTabelaPrecoUseCase(tabelaRepo, clienteRepo, produtoRepo)
  })

  it('cria tabela de preço no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tabelaPreco.tenantId).toBe('tenant-1')
      expect(result.value.tabelaPreco.preco).toBe(100)
      expect(result.value.tabelaPreco.vigenciaInicio).toBeNull()
      expect(result.value.tabelaPreco.vigenciaFim).toBeNull()
    }
    expect(tabelaRepo.tabelas).toHaveLength(1)
  })

  it('aceita vigências opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        vigenciaInicio: new Date('2024-01-01'),
        vigenciaFim: new Date('2024-12-31'),
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tabelaPreco.vigenciaInicio).toEqual(new Date('2024-01-01'))
      expect(result.value.tabelaPreco.vigenciaFim).toEqual(new Date('2024-12-31'))
    }
  })

  it('retorna ClienteNotFoundError quando o cliente não existe no tenant', async () => {
    const result = await sut.execute(makeInput({ clienteId: 'cliente-x' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando o produto não existe no tenant', async () => {
    const result = await sut.execute(makeInput({ produtoId: 'produto-x' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    tabelaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
