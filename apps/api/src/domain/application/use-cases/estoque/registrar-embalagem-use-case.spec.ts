import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistrarEmbalagemUseCase } from './registrar-embalagem-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(RegistrarEmbalagemUseCase.name, () => {
  let colheitaRepo: InMemoryColheitaRepository
  let loteRepo: InMemoryLoteRepository
  let movimentoRepo: InMemoryEstoqueMovimentoRepository
  let saldoRepo: InMemoryEstoqueSaldoRepository
  let writeRepo: InMemoryEstoqueWriteRepository
  let sut: RegistrarEmbalagemUseCase

  beforeEach(() => {
    colheitaRepo = new InMemoryColheitaRepository()
    loteRepo = new InMemoryLoteRepository()
    movimentoRepo = new InMemoryEstoqueMovimentoRepository()
    saldoRepo = new InMemoryEstoqueSaldoRepository()
    writeRepo = new InMemoryEstoqueWriteRepository(colheitaRepo, loteRepo, movimentoRepo, saldoRepo)
    sut = new RegistrarEmbalagemUseCase(writeRepo, saldoRepo)
  })

  const baseInput = {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    quantidade: 500,
    data: new Date('2024-10-01'),
  }

  it('persiste lote de embalagem, movimento e saldo', async () => {
    const result = await sut.execute(baseInput)

    expect(result.isRight()).toBe(true)
    expect(loteRepo.lotes).toHaveLength(1)
    expect(movimentoRepo.movimentos).toHaveLength(1)
    expect(saldoRepo.saldos).toHaveLength(1)

    if (result.isRight()) {
      expect(result.value.lote.origemTipo).toBe('embalagem')
      expect(result.value.lote.colheitaId).toBeNull()
      expect(result.value.movimento.tipo).toBe('entrada')
      expect(result.value.movimento.origem).toBe('embalagem')
      expect(result.value.saldo.quantidadeDisponivel).toBe(500)
    }
  })

  it('gera codigoLote automaticamente quando não informado', async () => {
    const result = await sut.execute(baseInput)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.codigoLote).toMatch(/^LOTE-/)
    }
  })

  it('usa codigoLote informado e soma a saldo existente', async () => {
    const existente = makeEstoqueSaldo({ loteId: 'L-EMB', quantidadeDisponivel: 100 })
    vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(existente)

    const result = await sut.execute({ ...baseInput, codigoLote: 'EMB-1', usuarioId: 'user-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.codigoLote).toBe('EMB-1')
      expect(result.value.movimento.usuarioId).toBe('user-1')
      expect(result.value.saldo.quantidadeDisponivel).toBe(600)
    }
  })

  it('não persiste nada quando a transação falha', async () => {
    writeRepo.shouldFail = true

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(loteRepo.lotes).toHaveLength(0)
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
