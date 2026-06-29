import { makeLote } from '@test/factories/make-lote'
import { InMemoryLoteRepository } from '@test/repositories/in-memory-lote-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListLotesUseCase } from './list-lotes-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListLotesUseCase.name, () => {
  let repo: InMemoryLoteRepository
  let sut: ListLotesUseCase

  beforeEach(() => {
    repo = new InMemoryLoteRepository()
    sut = new ListLotesUseCase(repo)
  })

  it('retorna lotes paginados da empresa', async () => {
    repo.lotes.push(makeLote({ id: 'l-1', empresaId: 'empresa-1' }))
    repo.lotes.push(makeLote({ id: 'l-2', empresaId: 'empresa-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1, perPage: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(2)
      expect(result.value.totalPages).toBe(2)
    }
  })

  it('isola por tenant e empresa', async () => {
    repo.lotes.push(makeLote({ id: 'l-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }))
    repo.lotes.push(makeLote({ id: 'l-2', tenantId: 'tenant-2', empresaId: 'empresa-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(repo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
