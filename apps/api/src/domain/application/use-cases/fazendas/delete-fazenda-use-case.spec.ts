import { makeFazenda } from '@test/factories/make-fazenda'
import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteFazendaUseCase } from './delete-fazenda-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'

describe(DeleteFazendaUseCase.name, () => {
  let fazendaRepo: InMemoryFazendaRepository
  let sut: DeleteFazendaUseCase

  beforeEach(() => {
    fazendaRepo = new InMemoryFazendaRepository()
    sut = new DeleteFazendaUseCase(fazendaRepo)
  })

  it('aplica soft delete definindo deletedAt', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'fazenda-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fazenda.deletedAt).toBeInstanceOf(Date)
    }
    expect(fazendaRepo.fazendas[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna FazendaNotFoundError quando a fazenda não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FazendaNotFoundError)
  })

  it('não vaza fazenda de outro tenant (IDOR) — retorna FazendaNotFoundError', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'fazenda-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FazendaNotFoundError)
    expect(fazendaRepo.fazendas[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    fazendaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'fazenda-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
