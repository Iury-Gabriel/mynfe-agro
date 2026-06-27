import { makeFazenda } from '@test/factories/make-fazenda'
import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListFazendasUseCase } from './list-fazendas-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListFazendasUseCase.name, () => {
  let fazendaRepo: InMemoryFazendaRepository
  let sut: ListFazendasUseCase

  beforeEach(() => {
    fazendaRepo = new InMemoryFazendaRepository()
    sut = new ListFazendasUseCase(fazendaRepo)
  })

  it('retorna fazendas paginadas do tenant', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-2', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(10)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('isola fazendas por tenant (não vaza de outro tenant)', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem fazendas', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(fazendaRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
