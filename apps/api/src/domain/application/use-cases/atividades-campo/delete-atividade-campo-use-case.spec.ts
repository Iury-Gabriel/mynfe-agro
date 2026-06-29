import { makeAtividadeCampo } from '@test/factories/make-atividade-campo'
import { InMemoryAtividadeCampoRepository } from '@test/repositories/in-memory-atividade-campo-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteAtividadeCampoUseCase } from './delete-atividade-campo-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AtividadeCampoNotFoundError } from '@/domain/application/use-cases/errors/atividade-campo-not-found-error'

describe(DeleteAtividadeCampoUseCase.name, () => {
  let atividadeRepo: InMemoryAtividadeCampoRepository
  let sut: DeleteAtividadeCampoUseCase

  beforeEach(() => {
    atividadeRepo = new InMemoryAtividadeCampoRepository()
    sut = new DeleteAtividadeCampoUseCase(atividadeRepo)
  })

  it('aplica soft delete definindo deletedAt', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', atividadeId: 'atividade-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.atividade.deletedAt).toBeInstanceOf(Date)
    }
    expect(atividadeRepo.atividades[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna AtividadeCampoNotFoundError quando a atividade não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', atividadeId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AtividadeCampoNotFoundError)
  })

  it('não vaza atividade de outro tenant (IDOR) — retorna AtividadeCampoNotFoundError', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', atividadeId: 'atividade-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AtividadeCampoNotFoundError)
    expect(atividadeRepo.atividades[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))
    atividadeRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', atividadeId: 'atividade-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
