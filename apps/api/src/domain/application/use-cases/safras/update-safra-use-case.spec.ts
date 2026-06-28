import { makeSafra } from '@test/factories/make-safra'
import { InMemorySafraRepository } from '@test/repositories/in-memory-safra-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateSafraUseCase } from './update-safra-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { SafraNotFoundError } from '@/domain/application/use-cases/errors/safra-not-found-error'

describe(UpdateSafraUseCase.name, () => {
  let safraRepo: InMemorySafraRepository
  let sut: UpdateSafraUseCase

  beforeEach(() => {
    safraRepo = new InMemorySafraRepository()
    sut = new UpdateSafraUseCase(safraRepo)
  })

  it('atualiza dados da safra', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      safraId: 'safra-1',
      cultura: 'Milho',
      status: 'em_andamento',
      estimativaProducao: 900,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.safra.cultura).toBe('Milho')
      expect(result.value.safra.status).toBe('em_andamento')
      expect(result.value.safra.estimativaProducao).toBe(900)
    }
  })

  it('retorna SafraNotFoundError quando a safra não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      safraId: 'inexistente',
      cultura: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(SafraNotFoundError)
  })

  it('não vaza safra de outro tenant (IDOR) — retorna SafraNotFoundError', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      safraId: 'safra-1',
      cultura: 'Hack',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(SafraNotFoundError)
    expect(safraRepo.safras[0].cultura).not.toBe('Hack')
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await safraRepo.create(makeSafra({ id: 'safra-1', tenantId: 'tenant-1' }))
    safraRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      safraId: 'safra-1',
      cultura: 'Nova',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
