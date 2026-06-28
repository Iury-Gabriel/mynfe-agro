import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { InMemoryEstoqueWriteRepository } from '@test/repositories/in-memory-estoque-write-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistrarColheitaUseCase } from './registrar-colheita-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(RegistrarColheitaUseCase.name, () => {
  let colheitaRepo: InMemoryColheitaRepository
  let loteRepo: InMemoryLoteRepository
  let movimentoRepo: InMemoryEstoqueMovimentoRepository
  let saldoRepo: InMemoryEstoqueSaldoRepository
  let writeRepo: InMemoryEstoqueWriteRepository
  let sut: RegistrarColheitaUseCase

  beforeEach(() => {
    colheitaRepo = new InMemoryColheitaRepository()
    loteRepo = new InMemoryLoteRepository()
    movimentoRepo = new InMemoryEstoqueMovimentoRepository()
    saldoRepo = new InMemoryEstoqueSaldoRepository()
    writeRepo = new InMemoryEstoqueWriteRepository(colheitaRepo, loteRepo, movimentoRepo, saldoRepo)
    sut = new RegistrarColheitaUseCase(writeRepo, saldoRepo)
  })

  const baseInput = {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    produtoId: 'produto-1',
    quantidade: 1000,
    data: new Date('2024-10-01'),
  }

  it('persiste colheita, lote, movimento e saldo atomicamente', async () => {
    const result = await sut.execute({ ...baseInput, safraId: 'safra-1', areaId: 'area-1' })

    expect(result.isRight()).toBe(true)
    expect(colheitaRepo.colheitas).toHaveLength(1)
    expect(loteRepo.lotes).toHaveLength(1)
    expect(movimentoRepo.movimentos).toHaveLength(1)
    expect(saldoRepo.saldos).toHaveLength(1)

    if (result.isRight()) {
      const { colheita, lote, movimento, saldo } = result.value
      expect(lote.origemTipo).toBe('colheita')
      expect(lote.colheitaId).toBe(colheita.id.toString())
      expect(lote.areaId).toBe('area-1')
      expect(lote.quantidadeInicial).toBe(1000)
      expect(lote.quantidadeAtual).toBe(1000)
      expect(movimento.tipo).toBe('entrada')
      expect(movimento.origem).toBe('colheita')
      expect(movimento.loteId).toBe(lote.id.toString())
      expect(movimento.referenciaId).toBe(colheita.id.toString())
      expect(saldo.quantidadeDisponivel).toBe(1000)
    }
  })

  it('gera codigoLote automaticamente quando não informado', async () => {
    const result = await sut.execute(baseInput)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.codigoLote).toMatch(/^LOTE-/)
    }
  })

  it('usa o codigoLote informado quando presente', async () => {
    const result = await sut.execute({ ...baseInput, codigoLote: 'SAFRA-A-001' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.codigoLote).toBe('SAFRA-A-001')
    }
  })

  it('soma ao saldo existente quando já há saldo para a chave', async () => {
    const first = await sut.execute({ ...baseInput, codigoLote: 'L1' })
    if (first.isRight()) {
      vi.spyOn(saldoRepo, 'findByChave').mockResolvedValueOnce(first.value.saldo)
    }

    const result = await sut.execute({ ...baseInput, quantidade: 200, codigoLote: 'L2' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.saldo.quantidadeDisponivel).toBe(1200)
    }
  })

  it('não persiste nada quando a transação falha', async () => {
    writeRepo.shouldFail = true

    const result = await sut.execute(baseInput)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(colheitaRepo.colheitas).toHaveLength(0)
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
