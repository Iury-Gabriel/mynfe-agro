import { makeArea } from '@test/factories/make-area'
import { InMemoryAreaRepository } from '@test/repositories/in-memory-area-repository'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateAreaUseCase } from './update-area-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { AreaNotFoundError } from '@/domain/application/use-cases/errors/area-not-found-error'

describe(UpdateAreaUseCase.name, () => {
  let areaRepo: InMemoryAreaRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: UpdateAreaUseCase

  beforeEach(() => {
    areaRepo = new InMemoryAreaRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new UpdateAreaUseCase(areaRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('atualiza dados cadastrais da área', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      identificacao: 'Talhão 99',
      tamanho: 333,
      rotulo: 'Milho',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.area.identificacao).toBe('Talhão 99')
      expect(result.value.area.tamanho).toBe(333)
      expect(result.value.area.rotulo).toBe('Milho')
    }
  })

  it('retorna AreaNotFoundError quando a área não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'inexistente',
      identificacao: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AreaNotFoundError)
  })

  it('não vaza área de outro tenant (IDOR) — retorna AreaNotFoundError', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      identificacao: 'Hack',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(AreaNotFoundError)
    expect(areaRepo.areas[0].identificacao).not.toBe('Hack')
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
    areaRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      identificacao: 'Nova',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })

  it('registra auditoria após atualizar a área', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      identificacao: 'Talhão 99',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'area',
      acao: 'editar',
      entidadeId: 'area-1',
      dadosAntes: { identificacao: 'Talhão 01' },
      dadosDepois: { identificacao: 'Talhão 99' },
    })
  })

  it('não falha a operação quando a auditoria falha (best-effort)', async () => {
    await areaRepo.create(makeArea({ id: 'area-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      identificacao: 'Talhão 99',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
