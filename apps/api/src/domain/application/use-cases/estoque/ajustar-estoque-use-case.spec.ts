import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { makeLote } from '@test/factories/make-lote'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AjustarEstoqueUseCase } from './ajustar-estoque-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EstoqueInsuficienteError } from '@/domain/application/use-cases/errors/estoque-insuficiente-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'
import { MovimentoInvalidoError } from '@/domain/application/use-cases/errors/movimento-invalido-error'

describe(AjustarEstoqueUseCase.name, () => {
  let colheitaRepo: InMemoryColheitaRepository
  let loteRepo: InMemoryLoteRepository
  let movimentoRepo: InMemoryEstoqueMovimentoRepository
  let saldoRepo: InMemoryEstoqueSaldoRepository
  let writeRepo: InMemoryEstoqueWriteRepository
  let sut: AjustarEstoqueUseCase

  beforeEach(() => {
    colheitaRepo = new InMemoryColheitaRepository()
    loteRepo = new InMemoryLoteRepository()
    movimentoRepo = new InMemoryEstoqueMovimentoRepository()
    saldoRepo = new InMemoryEstoqueSaldoRepository()
    writeRepo = new InMemoryEstoqueWriteRepository(colheitaRepo, loteRepo, movimentoRepo, saldoRepo)
    sut = new AjustarEstoqueUseCase(writeRepo, saldoRepo, loteRepo)
  })

  const baseInput = {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    delta: 50,
    motivo: 'recontagem',
    data: new Date('2024-10-01'),
  }

  it('rejeita quando motivo está vazio', async () => {
    const result = await sut.execute({ ...baseInput, motivo: '   ' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(MovimentoInvalidoError)
  })

  it('rejeita quando delta é zero', async () => {
    const result = await sut.execute({ ...baseInput, delta: 0 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(MovimentoInvalidoError)
  })

  it('aplica ajuste positivo criando saldo novo', async () => {
    const result = await sut.execute(baseInput)

    expect(result.isRight()).toBe(true)
    expect(movimentoRepo.movimentos).toHaveLength(1)
    expect(saldoRepo.saldos).toHaveLength(1)
    if (result.isRight()) {
      expect(result.value.movimento.tipo).toBe('ajuste')
      expect(result.value.movimento.motivo).toBe('recontagem')
      expect(result.value.saldo.quantidadeDisponivel).toBe(50)
    }
  })

  it('aplica ajuste negativo sobre saldo existente', async () => {
    const saldo = makeEstoqueSaldo({ quantidadeDisponivel: 100, loteId: null })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(saldo)

    const result = await sut.execute({ ...baseInput, delta: -40 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.saldo.quantidadeDisponivel).toBe(60)
    }
  })

  it('rejeita ajuste negativo que deixaria saldo negativo', async () => {
    const saldo = makeEstoqueSaldo({ quantidadeDisponivel: 30, loteId: null })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(saldo)

    const result = await sut.execute({ ...baseInput, delta: -50 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
    expect(movimentoRepo.movimentos).toHaveLength(0)
  })

  it('ajusta também o lote informado em delta negativo', async () => {
    const lote = makeLote({ id: 'lote-1', quantidadeAtual: 100 })
    await loteRepo.save(lote)
    const saldo = makeEstoqueSaldo({ quantidadeDisponivel: 100, loteId: 'lote-1' })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(saldo)

    const result = await sut.execute({ ...baseInput, delta: -30, loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    expect(lote.quantidadeAtual).toBe(70)
  })

  it('estorna o lote informado em delta positivo', async () => {
    const lote = makeLote({ id: 'lote-1', quantidadeAtual: 100 })
    await loteRepo.save(lote)
    const saldo = makeEstoqueSaldo({ quantidadeDisponivel: 100, loteId: 'lote-1' })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(saldo)

    const result = await sut.execute({ ...baseInput, delta: 30, loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    expect(lote.quantidadeAtual).toBe(130)
  })

  it('rejeita ajuste negativo de lote acima da quantidade atual', async () => {
    const lote = makeLote({ id: 'lote-1', quantidadeAtual: 20 })
    await loteRepo.save(lote)
    const saldo = makeEstoqueSaldo({ quantidadeDisponivel: 100, loteId: 'lote-1' })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(saldo)

    const result = await sut.execute({ ...baseInput, delta: -50, loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EstoqueInsuficienteError)
  })

  it('rejeita quando o lote informado não existe', async () => {
    const result = await sut.execute({ ...baseInput, loteId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('isola lote por tenant (cross-tenant retorna LoteNotFound)', async () => {
    const lote = makeLote({ id: 'lote-1', tenantId: 'tenant-2' })
    await loteRepo.save(lote)

    const result = await sut.execute({ ...baseInput, loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('não persiste nada quando a transação falha', async () => {
    writeRepo.shouldFail = true

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(movimentoRepo.movimentos).toHaveLength(0)
    expect(saldoRepo.saldos).toHaveLength(0)
  })

  it('retorna UnexpectedError quando o repositório de saldo lança', async () => {
    vi.spyOn(saldoRepo, 'findByChave').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
