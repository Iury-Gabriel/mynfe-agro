import { makeAuditoriaLog } from '@test/factories'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListAuditoriaLogsUseCase } from './list-auditoria-logs-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListAuditoriaLogsUseCase.name, () => {
  let repo: InMemoryAuditoriaLogRepository
  let sut: ListAuditoriaLogsUseCase

  beforeEach(() => {
    repo = new InMemoryAuditoriaLogRepository()
    sut = new ListAuditoriaLogsUseCase(repo)
  })

  it('retorna logs paginados do tenant', async () => {
    repo.logs.push(makeAuditoriaLog({ id: 'l1', tenantId: 'tenant-1' }))
    repo.logs.push(makeAuditoriaLog({ id: 'l2', tenantId: 'outro' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(1)
      expect(result.value.page).toBe(1)
    }
  })

  it('filtra por entidade, acao e usuarioId', async () => {
    repo.logs.push(
      makeAuditoriaLog({ id: 'l1', entidade: 'tenant', acao: 'editar', usuarioId: 'u1' }),
    )
    repo.logs.push(
      makeAuditoriaLog({ id: 'l2', entidade: 'produto', acao: 'criar', usuarioId: 'u2' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      entidade: 'tenant',
      acao: 'editar',
      usuarioId: 'u1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('l1')
    }
  })

  it('retorna UnexpectedError quando o repositório falha', async () => {
    repo.findManyByTenant = () => Promise.reject(new Error('boom'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
