import { InMemoryTenantRepository } from '@test/repositories/in-memory-tenant-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListTenantsUseCase } from './list-tenants-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { Tenant } from '@/domain/enterprise/entities/tenant'

function makeTenant(nome: string, createdAt: Date): Tenant {
  return Tenant.create({ nome, labelArea: 'Talhão', createdAt, updatedAt: createdAt })
}

describe(ListTenantsUseCase.name, () => {
  let tenants: InMemoryTenantRepository
  let sut: ListTenantsUseCase

  beforeEach(() => {
    tenants = new InMemoryTenantRepository()
    sut = new ListTenantsUseCase(tenants)
  })

  it('retorna tenants paginados com contagens', async () => {
    const t1 = makeTenant('Fazenda A', new Date('2026-01-01'))
    const t2 = makeTenant('Fazenda B', new Date('2026-02-01'))
    tenants.tenants.push(t1, t2)
    tenants.empresasCounts.set(t2.id.toString(), 3)
    tenants.usuariosCounts.set(t2.id.toString(), 5)

    const result = await sut.execute({ page: 1, perPage: 20 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.total).toBe(2)
      expect(result.value.totalPages).toBe(1)
      // ordenado por createdAt desc → Fazenda B primeiro
      expect(result.value.items[0].tenant.nome).toBe('Fazenda B')
      expect(result.value.items[0].empresasCount).toBe(3)
      expect(result.value.items[0].usuariosCount).toBe(5)
      expect(result.value.items[1].empresasCount).toBe(0)
    }
  })

  it('aplica a paginação (page/perPage)', async () => {
    for (let i = 0; i < 5; i++) {
      tenants.tenants.push(makeTenant(`T${i}`, new Date(2026, 0, i + 1)))
    }

    const result = await sut.execute({ page: 2, perPage: 2 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(5)
      expect(result.value.totalPages).toBe(3)
      expect(result.value.page).toBe(2)
    }
  })

  it('retorna UnexpectedError quando o repositório falha', async () => {
    tenants.shouldFailOnFindMany = true
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await sut.execute({ page: 1, perPage: 20 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
