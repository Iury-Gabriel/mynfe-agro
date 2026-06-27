import { makeEmpresa } from '@test/factories'
import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeactivateEmpresaUseCase } from './deactivate-empresa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'

describe(DeactivateEmpresaUseCase.name, () => {
  let empresaRepo: InMemoryEmpresaRepository
  let sut: DeactivateEmpresaUseCase

  beforeEach(() => {
    empresaRepo = new InMemoryEmpresaRepository()
    sut = new DeactivateEmpresaUseCase(empresaRepo)
  })

  it('desativa a empresa do tenant', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'ativo' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.status).toBe('inativo')
    }
    expect(empresaRepo.empresas[0].status).toBe('inativo')
  })

  it('retorna EmpresaNotFoundError quando a empresa não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
  })

  it('não vaza empresa de outro tenant (IDOR) — retorna EmpresaNotFoundError', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-2', status: 'ativo' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
    expect(empresaRepo.empresas[0].status).toBe('ativo')
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1', status: 'ativo' }))
    empresaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
