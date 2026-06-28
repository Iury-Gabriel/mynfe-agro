import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateAreaUseCase, type CreateAreaInput } from './create-area-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'

function makeInput(override: Partial<CreateAreaInput> = {}): CreateAreaInput {
  return {
    tenantId: 'tenant-1',
    fazendaId: 'fazenda-1',
    identificacao: 'Talhão 01',
    ...override,
  }
}

describe(CreateAreaUseCase.name, () => {
  let areaRepo: InMemoryAreaRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: CreateAreaUseCase

  beforeEach(() => {
    areaRepo = new InMemoryAreaRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new CreateAreaUseCase(areaRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('cria área no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.tenantId).toBe('tenant-1')
      expect(result.value.area.fazendaId).toBe('fazenda-1')
      expect(result.value.area.identificacao).toBe('Talhão 01')
      expect(result.value.area.deletedAt).toBeNull()
    }
    expect(areaRepo.areas).toHaveLength(1)
  })

  it('aceita campos opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        tamanho: 250,
        unidadeTamanho: 'ha',
        rotulo: 'Soja',
        geometria: { type: 'Polygon', coordinates: [] },
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.tamanho).toBe(250)
      expect(result.value.area.unidadeTamanho).toBe('ha')
      expect(result.value.area.rotulo).toBe('Soja')
      expect(result.value.area.geometria).toEqual({ type: 'Polygon', coordinates: [] })
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    areaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })

  it('registra auditoria após criar a área', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    if (result.isRight()) {
      expect(auditoriaRepo.logs[0]).toMatchObject({
        entidade: 'area',
        acao: 'criar',
        entidadeId: result.value.area.id.toString(),
        dadosDepois: { identificacao: 'Talhão 01' },
      })
    }
  })

  it('não falha a operação quando a auditoria falha (best-effort)', async () => {
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
