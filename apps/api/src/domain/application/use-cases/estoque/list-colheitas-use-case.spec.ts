import { makeColheita } from '@test/factories/make-colheita'
import { InMemoryColheitaRepository } from '@test/repositories/in-memory-colheita-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListColheitasUseCase } from './list-colheitas-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListColheitasUseCase.name, () => {
  let repo: InMemoryColheitaRepository
  let sut: ListColheitasUseCase

  beforeEach(() => {
    repo = new InMemoryColheitaRepository()
    sut = new ListColheitasUseCase(repo)
  })

  it('retorna colheitas paginadas da empresa', async () => {
    repo.colheitas.push(makeColheita({ id: 'c-1', empresaId: 'empresa-1' }))
    repo.colheitas.push(makeColheita({ id: 'c-2', empresaId: 'empresa-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.perPage).toBe(20)
    }
  })

  it('isola por tenant e por empresa', async () => {
    repo.colheitas.push(makeColheita({ id: 'c-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }))
    repo.colheitas.push(makeColheita({ id: 'c-2', tenantId: 'tenant-1', empresaId: 'empresa-2' }))
    repo.colheitas.push(makeColheita({ id: 'c-3', tenantId: 'tenant-2', empresaId: 'empresa-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('c-1')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(repo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
