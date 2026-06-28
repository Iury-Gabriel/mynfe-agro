import { makeColheita } from '@test/factories/make-colheita'
import { makeLote } from '@test/factories/make-lote'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetLoteRastreabilidadeUseCase } from './get-lote-rastreabilidade-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { LoteNotFoundError } from '@/domain/application/use-cases/errors/lote-not-found-error'

describe(GetLoteRastreabilidadeUseCase.name, () => {
  let loteRepo: InMemoryLoteRepository
  let colheitaRepo: InMemoryColheitaRepository
  let sut: GetLoteRastreabilidadeUseCase

  beforeEach(() => {
    loteRepo = new InMemoryLoteRepository()
    colheitaRepo = new InMemoryColheitaRepository()
    sut = new GetLoteRastreabilidadeUseCase(loteRepo, colheitaRepo)
  })

  it('retorna lote com cadeia a montante a partir da colheita', async () => {
    colheitaRepo.colheitas.push(
      makeColheita({ id: 'colheita-1', safraId: 'safra-1', areaId: 'area-1' }),
    )
    loteRepo.lotes.push(makeLote({ id: 'lote-1', colheitaId: 'colheita-1', areaId: null }))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lote.id.toString()).toBe('lote-1')
      expect(result.value.montante.colheita?.id.toString()).toBe('colheita-1')
      expect(result.value.montante.safraId).toBe('safra-1')
      expect(result.value.montante.areaId).toBe('area-1')
      expect(result.value.jusante.pedidoItens).toEqual([])
      expect(result.value.jusante.remessaItens).toEqual([])
    }
  })

  it('usa areaId do lote quando não há colheita vinculada', async () => {
    loteRepo.lotes.push(
      makeLote({ id: 'lote-1', origemTipo: 'embalagem', colheitaId: null, areaId: 'area-2' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.montante.colheita).toBeNull()
      expect(result.value.montante.safraId).toBeNull()
      expect(result.value.montante.areaId).toBe('area-2')
    }
  })

  it('retorna LoteNotFound quando o lote não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('isola lote por tenant (cross-tenant retorna LoteNotFound)', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LoteNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(loteRepo, 'findById').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', loteId: 'lote-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
