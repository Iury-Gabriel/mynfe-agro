import { makeSafra } from '@test/factories/make-safra'
import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteSafraUseCase } from './delete-safra-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { SafraNotFoundError } from '@/domain/application/use-cases/errors/safra-not-found-error'

describe(DeleteSafraUseCase.name, () => {
  let safraRepo: InMemorySafraRepository
  let sut: DeleteSafraUseCase

  beforeEach(() => {
    safraRepo = new InMemorySafraRepository()
    sut = new DeleteSafraUseCase(safraRepo)
  })

  it('aplica soft delete definindo deletedAt', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', safraId: 'safra-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.safra.deletedAt).toBeInstanceOf(Date)
    }
    expect(safraRepo.safras[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna SafraNotFoundError quando a safra não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', safraId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(SafraNotFoundError)
  })

  it('não vaza safra de outro tenant (IDOR) — retorna SafraNotFoundError', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', safraId: 'safra-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(SafraNotFoundError)
    expect(safraRepo.safras[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))
    safraRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', safraId: 'safra-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
