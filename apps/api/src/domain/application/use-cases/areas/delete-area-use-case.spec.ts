import { makeArea } from '@test/factories/make-area'
import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteAreaUseCase } from './delete-area-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AreaNotFoundError } from '@/domain/application/use-cases/errors/area-not-found-error'

describe(DeleteAreaUseCase.name, () => {
  let areaRepo: InMemoryAreaRepository
  let sut: DeleteAreaUseCase

  beforeEach(() => {
    areaRepo = new InMemoryAreaRepository()
    sut = new DeleteAreaUseCase(areaRepo)
  })

  it('aplica soft delete definindo deletedAt', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', areaId: 'area-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.deletedAt).toBeInstanceOf(Date)
    }
    expect(areaRepo.areas[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna AreaNotFoundError quando a área não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', areaId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AreaNotFoundError)
  })

  it('não vaza área de outro tenant (IDOR) — retorna AreaNotFoundError', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', areaId: 'area-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AreaNotFoundError)
    expect(areaRepo.areas[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
    areaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', areaId: 'area-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
