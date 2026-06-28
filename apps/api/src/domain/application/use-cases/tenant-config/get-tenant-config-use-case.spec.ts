import { makeTenant } from '@test/factories'
import { InMemoryTenantRepository } from '@test/repositories/in-memory-tenant-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { GetTenantConfigUseCase } from './get-tenant-config-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'

describe(GetTenantConfigUseCase.name, () => {
  let repo: InMemoryTenantRepository
  let sut: GetTenantConfigUseCase

  beforeEach(() => {
    repo = new InMemoryTenantRepository()
    sut = new GetTenantConfigUseCase(repo)
  })

  it('retorna o tenant pelo id', async () => {
    repo.tenants.push(makeTenant({ id: 'tenant-1', nome: 'Fazenda X' }))

    const result = await sut.execute({ tenantId: 'tenant-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.nome).toBe('Fazenda X')
    }
  })

  it('retorna TenantNotFoundError quando o tenant não existe', async () => {
    const result = await sut.execute({ tenantId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TenantNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório falha', async () => {
    repo.findById = () => Promise.reject(new Error('boom'))

    const result = await sut.execute({ tenantId: 'tenant-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
