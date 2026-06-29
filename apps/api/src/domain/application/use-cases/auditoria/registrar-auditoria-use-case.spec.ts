import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { RegistrarAuditoriaUseCase } from './registrar-auditoria-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(RegistrarAuditoriaUseCase.name, () => {
  let repo: InMemoryAuditoriaLogRepository
  let sut: RegistrarAuditoriaUseCase

  beforeEach(() => {
    repo = new InMemoryAuditoriaLogRepository()
    sut = new RegistrarAuditoriaUseCase(repo)
  })

  it('cria um log de auditoria com todos os campos', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      usuarioId: 'user-1',
      entidade: 'tenant',
      entidadeId: 'tenant-1',
      acao: 'editar',
      dadosAntes: { nome: 'Antes' },
      dadosDepois: { nome: 'Depois' },
    })

    expect(result.isRight()).toBe(true)
    expect(repo.logs).toHaveLength(1)
    const log = repo.logs[0]
    expect(log.entidade).toBe('tenant')
    expect(log.acao).toBe('editar')
    expect(log.usuarioId).toBe('user-1')
    expect(log.dadosAntes).toEqual({ nome: 'Antes' })
    expect(log.dadosDepois).toEqual({ nome: 'Depois' })
  })

  it('aplica defaults nulos para campos opcionais', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entidade: 'produto',
      entidadeId: 'p1',
      acao: 'criar',
    })

    expect(result.isRight()).toBe(true)
    const log = repo.logs[0]
    expect(log.usuarioId).toBeNull()
    expect(log.dadosAntes).toBeNull()
    expect(log.dadosDepois).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório falha', async () => {
    repo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entidade: 'produto',
      entidadeId: 'p1',
      acao: 'criar',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
