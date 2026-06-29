import { makeCliente } from '@test/factories/make-cliente'
import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { makeLote } from '@test/factories/make-lote'
import { makeProduto } from '@test/factories/make-produto'
import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CriarRemessaUseCase, type CriarRemessaInput } from './criar-remessa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

function makeInput(override: Partial<CriarRemessaInput> = {}): CriarRemessaInput {
  return {
    tenantId: 'tenant-1',
    empresaFaturadoraId: 'empresa-1',
    clienteId: 'cliente-1',
    data: new Date('2024-10-01'),
    itens: [{ produtoId: 'produto-1', loteId: null, quantidade: 0, precoUnitario: 30 }],
    ...override,
  }
}

describe(CriarRemessaUseCase.name, () => {
  let remessaRepo: InMemoryRemessaRepository
  let produtoRepo: InMemoryProdutoRepository
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let saldoRepo: InMemoryEstoqueSaldoRepository
  let loteRepo: InMemoryLoteRepository
  let colheitaRepo: InMemoryColheitaRepository
  let movimentoRepo: InMemoryEstoqueMovimentoRepository
  let writeRepo: InMemoryEstoqueWriteRepository
  let clienteRepo: InMemoryClienteRepository
  let sut: CriarRemessaUseCase

  beforeEach(() => {
    remessaRepo = new InMemoryRemessaRepository()
    produtoRepo = new InMemoryProdutoRepository()
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    saldoRepo = new InMemoryEstoqueSaldoRepository()
    loteRepo = new InMemoryLoteRepository()
    colheitaRepo = new InMemoryColheitaRepository()
    movimentoRepo = new InMemoryEstoqueMovimentoRepository()
    writeRepo = new InMemoryEstoqueWriteRepository(colheitaRepo, loteRepo, movimentoRepo, saldoRepo)
    clienteRepo = new InMemoryClienteRepository()
    clienteRepo.clientes.push(makeCliente({ id: 'cliente-1' }))
    produtoRepo.produtos.push(makeProduto({ id: 'produto-1' }))
    sut = new CriarRemessaUseCase(
      remessaRepo,
      produtoRepo,
      tabelaRepo,
      saldoRepo,
      loteRepo,
      writeRepo,
      clienteRepo,
    )
  })

  it('cria remessa aberta com preço informado e sem lote', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.remessa.status).toBe('aberta')
      expect(result.value.remessa.itens[0].precoUnitario).toBe(30)
    }
    expect(remessaRepo.remessas).toHaveLength(1)
  })

  it('baixa saldo existente e consome o lote informado', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-1', quantidadeDisponivel: 500 }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', quantidadeAtual: 500 }))

    const result = await sut.execute(
      makeInput({
        usuarioId: 'user-1',
        itens: [{ produtoId: 'produto-1', loteId: 'lote-1', quantidade: 100, precoUnitario: 30 }],
      }),
    )

    expect(result.isRight()).toBe(true)
    expect(saldoRepo.saldos[0].quantidadeDisponivel).toBe(400)
    expect(loteRepo.lotes[0].quantidadeAtual).toBe(400)
  })

  it('resolve o preço pela tabela do cliente quando o item não informa preço', async () => {
    tabelaRepo.tabelas.push(
      makeTabelaPrecoCliente({
        clienteId: 'cliente-1',
        produtoId: 'produto-1',
        preco: 55,
        vigenciaInicio: new Date('2024-01-01'),
      }),
    )

    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', loteId: null, quantidade: 0 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.remessa.itens[0].precoUnitario).toBe(55)
    }
  })

  it('usa zero quando não há tabela vigente nem preço padrão do produto', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-1', loteId: null, quantidade: 0 }] }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.remessa.itens[0].precoUnitario).toBe(0)
    }
  })

  it('retorna ClienteNotFoundError quando o cliente não existe no tenant', async () => {
    const result = await sut.execute(makeInput({ clienteId: 'cliente-x' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando algum produto não existe no tenant', async () => {
    const result = await sut.execute(
      makeInput({ itens: [{ produtoId: 'produto-x', loteId: null, quantidade: 0, precoUnitario: 30 }] }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna EstoqueInsuficienteError quando o saldo não cobre a saída', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: null, quantidadeDisponivel: 10 }),
    )

    const result = await sut.execute(
      makeInput({
        itens: [{ produtoId: 'produto-1', loteId: null, quantidade: 100, precoUnitario: 30 }],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('retorna LoteNotFoundError quando o lote referenciado não existe', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-x', quantidadeDisponivel: 500 }),
    )

    const result = await sut.execute(
      makeInput({
        itens: [{ produtoId: 'produto-1', loteId: 'lote-x', quantidade: 100, precoUnitario: 30 }],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('retorna EstoqueInsuficienteError quando o lote não tem quantidade suficiente', async () => {
    saldoRepo.saldos.push(
      makeEstoqueSaldo({ produtoId: 'produto-1', loteId: 'lote-1', quantidadeDisponivel: 500 }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', quantidadeAtual: 5 }))

    const result = await sut.execute(
      makeInput({
        itens: [{ produtoId: 'produto-1', loteId: 'lote-1', quantidade: 100, precoUnitario: 30 }],
      }),
    )

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(remessaRepo, 'create').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
