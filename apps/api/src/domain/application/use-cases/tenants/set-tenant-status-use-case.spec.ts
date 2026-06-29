import { InMemoryTenantRepository } from '@test/repositories/in-memory-tenant-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SetTenantStatusUseCase } from './set-tenant-status-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'
import { Tenant } from '@/domain/enterprise/entities/tenant'

function makeTenant(): Tenant {
  return Tenant.create({
    nome: 'Fazenda Teste',
    labelArea: 'Talhão',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe(SetTenantStatusUseCase.name, () => {
  let tenants: InMemoryTenantRepository
  let sut: SetTenantStatusUseCase

  beforeEach(() => {
    tenants = new InMemoryTenantRepository()
    sut = new SetTenantStatusUseCase(tenants)
  })

  it('suspende um tenant', async () => {
    const tenant = makeTenant()
    tenants.tenants.push(tenant)

    const result = await sut.execute({ tenantId: tenant.id.toString(), status: 'suspenso' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.status).toBe('suspenso')
    }
    expect(tenant.status).toBe('suspenso')
  })

  it('reativa um tenant', async () => {
    const tenant = makeTenant()
    tenant.suspend()
    tenants.tenants.push(tenant)

    const result = await sut.execute({ tenantId: tenant.id.toString(), status: 'ativo' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.status).toBe('ativo')
    }
  })

  it('retorna TenantNotFoundError quando o tenant não existe', async () => {
    const result = await sut.execute({ tenantId: 'inexistente', status: 'suspenso' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TenantNotFoundError)
  })

  it('retorna UnexpectedError quando a persistência falha', async () => {
    const tenant = makeTenant()
    tenants.tenants.push(tenant)
    tenants.shouldFailOnUpdateStatus = true
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await sut.execute({ tenantId: tenant.id.toString(), status: 'suspenso' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
