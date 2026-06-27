import { makeArea } from '@test/factories/make-area'
import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListAreasUseCase } from './list-areas-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListAreasUseCase.name, () => {
  let areaRepo: InMemoryAreaRepository
  let sut: ListAreasUseCase

  beforeEach(() => {
    areaRepo = new InMemoryAreaRepository()
    sut = new ListAreasUseCase(areaRepo)
  })

  it('retorna áreas paginadas do tenant', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
    await areaRepo.create(makeArea({ id: 'area-2', tenantId: 'tenant-1' }))

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

  it('isola áreas por tenant (não vaza de outro tenant)', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
    await areaRepo.create(makeArea({ id: 'area-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem áreas', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(areaRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
