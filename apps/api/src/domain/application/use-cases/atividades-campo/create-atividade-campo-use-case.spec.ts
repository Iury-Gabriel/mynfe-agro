import { InMemoryAtividadeCampoRepository } from '@test/repositories/in-memory-atividade-campo-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CreateAtividadeCampoUseCase,
  type CreateAtividadeCampoInput,
} from './create-atividade-campo-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

function makeInput(override: Partial<CreateAtividadeCampoInput> = {}): CreateAtividadeCampoInput {
  return {
    tenantId: 'tenant-1',
    tipo: 'plantio',
    data: new Date('2024-10-01'),
    ...override,
  }
}

describe(CreateAtividadeCampoUseCase.name, () => {
  let atividadeRepo: InMemoryAtividadeCampoRepository
  let sut: CreateAtividadeCampoUseCase

  beforeEach(() => {
    atividadeRepo = new InMemoryAtividadeCampoRepository()
    sut = new CreateAtividadeCampoUseCase(atividadeRepo)
  })

  it('cria atividade no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.atividade.tenantId).toBe('tenant-1')
      expect(result.value.atividade.tipo).toBe('plantio')
      expect(result.value.atividade.safraId).toBeNull()
      expect(result.value.atividade.deletedAt).toBeNull()
    }
    expect(atividadeRepo.atividades).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        safraId: 'safra-1',
        areaId: 'area-1',
        tipo: 'pulverizacao',
        responsavelUsuarioId: 'user-1',
        observacoes: 'Defensivo X',
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.atividade.safraId).toBe('safra-1')
      expect(result.value.atividade.areaId).toBe('area-1')
      expect(result.value.atividade.tipo).toBe('pulverizacao')
      expect(result.value.atividade.responsavelUsuarioId).toBe('user-1')
      expect(result.value.atividade.observacoes).toBe('Defensivo X')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    atividadeRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
