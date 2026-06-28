import { makeEmpresa } from '@test/factories'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ActivateEmpresaUseCase } from './activate-empresa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'

describe(ActivateEmpresaUseCase.name, () => {
  let empresaRepo: InMemoryEmpresaRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: ActivateEmpresaUseCase

  beforeEach(() => {
    empresaRepo = new InMemoryEmpresaRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new ActivateEmpresaUseCase(empresaRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('ativa a empresa do tenant', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'inativo' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.status).toBe('ativo')
    }
    expect(empresaRepo.empresas[0].status).toBe('ativo')
  })

  it('retorna EmpresaNotFoundError quando a empresa não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
  })

  it('não vaza empresa de outro tenant (IDOR) — retorna EmpresaNotFoundError', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-2', status: 'inativo' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
    expect(empresaRepo.empresas[0].status).toBe('inativo')
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'inativo' }))
    empresaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })

  it('registra auditoria de ativação com dadosAntes e dadosDepois', async () => {
    await empresaRepo.create(
      makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'inativo' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    const log = auditoriaRepo.logs[0]
    expect(log.entidade).toBe('empresa')
    expect(log.acao).toBe('editar')
    expect(log.entidadeId).toBe('empresa-1')
    expect(log.dadosAntes).toMatchObject({ status: 'inativo' })
    expect(log.dadosDepois).toMatchObject({ status: 'ativo' })
  })

  it('mantém a operação bem-sucedida quando a auditoria falha (best-effort)', async () => {
    await empresaRepo.create(
      makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'inativo' }),
    )
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
