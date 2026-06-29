import { makeLote } from '@test/factories/make-lote'
import { makeRemessa } from '@test/factories/make-remessa'
import { makeRemessaItem } from '@test/factories/make-remessa-item'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetRemessaUseCase } from './get-remessa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'

describe(GetRemessaUseCase.name, () => {
  let remessaRepo: InMemoryRemessaRepository
  let loteRepo: InMemoryLoteRepository
  let sut: GetRemessaUseCase

  beforeEach(() => {
    remessaRepo = new InMemoryRemessaRepository()
    loteRepo = new InMemoryLoteRepository()
    sut = new GetRemessaUseCase(remessaRepo, loteRepo)
  })

  it('retorna a remessa com os lotes existentes dos itens', async () => {
    loteRepo.lotes.push(makeLote({ id: 'lote-1' }))
    remessaRepo.remessas.push(
      makeRemessa({
        id: 'remessa-1',
        itens: [
          makeRemessaItem({ id: 'item-1', loteId: 'lote-1' }),
          makeRemessaItem({ id: 'item-2', loteId: 'lote-ausente' }),
          makeRemessaItem({ id: 'item-3', loteId: null }),
        ],
      }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.lotes).toHaveLength(1)
      expect(result.value.lotes[0].id.toString()).toBe('lote-1')
    }
  })

  it('retorna RemessaNotFoundError quando a remessa é de outra empresa', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RemessaNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    remessaRepo.remessas.push(
      makeRemessa({ id: 'remessa-1', itens: [makeRemessaItem({ loteId: 'lote-1' })] }),
    )
    vi.spyOn(loteRepo, 'findById').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
