import { makeFazenda } from '@test/factories/make-fazenda'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateFazendaUseCase } from './update-fazenda-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'

describe(UpdateFazendaUseCase.name, () => {
  let fazendaRepo: InMemoryFazendaRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: UpdateFazendaUseCase

  beforeEach(() => {
    fazendaRepo = new InMemoryFazendaRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new UpdateFazendaUseCase(fazendaRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('atualiza dados cadastrais da fazenda', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      nome: 'Fazenda Renovada',
      municipio: 'Sinop',
      areaTotalHa: 2500,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fazenda.nome).toBe('Fazenda Renovada')
      expect(result.value.fazenda.municipio).toBe('Sinop')
      expect(result.value.fazenda.areaTotalHa).toBe(2500)
    }
  })

  it('retorna FazendaNotFoundError quando a fazenda não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'inexistente',
      nome: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FazendaNotFoundError)
  })

  it('não vaza fazenda de outro tenant (IDOR) — retorna FazendaNotFoundError', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      nome: 'Hack',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FazendaNotFoundError)
    expect(fazendaRepo.fazendas[0].nome).not.toBe('Hack')
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    fazendaRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      nome: 'Nova',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })

  it('registra auditoria de edição com dadosAntes e dadosDepois', async () => {
    await fazendaRepo.create(
      makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1', nome: 'Antiga' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      nome: 'Nova',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'fazenda',
      acao: 'editar',
      entidadeId: 'fazenda-1',
      dadosAntes: { nome: 'Antiga' },
      dadosDepois: { nome: 'Nova' },
    })
  })

  it('mantém a edição mesmo se a auditoria falhar', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      nome: 'Nova',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
