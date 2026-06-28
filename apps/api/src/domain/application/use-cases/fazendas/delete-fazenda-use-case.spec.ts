import { makeFazenda } from '@test/factories/make-fazenda'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryFazendaRepository } from '@test/repositories/in-memory-fazenda-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteFazendaUseCase } from './delete-fazenda-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'

describe(DeleteFazendaUseCase.name, () => {
  let fazendaRepo: InMemoryFazendaRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: DeleteFazendaUseCase

  beforeEach(() => {
    fazendaRepo = new InMemoryFazendaRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new DeleteFazendaUseCase(fazendaRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
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

  it('registra auditoria de exclusão com dadosAntes e dadosDepois', async () => {
    await fazendaRepo.create(
      makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1', nome: 'Encerrada' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'fazenda-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'fazenda',
      acao: 'excluir',
      entidadeId: 'fazenda-1',
      dadosAntes: { nome: 'Encerrada', deletedAt: null },
    })
    expect(auditoriaRepo.logs[0].dadosDepois?.deletedAt).toBeInstanceOf(Date)
  })

  it('mantém a exclusão mesmo se a auditoria falhar', async () => {
    await fazendaRepo.create(makeFazenda({ id: 'fazenda-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({ tenantId: 'tenant-1', fazendaId: 'fazenda-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
