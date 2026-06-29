import { makeRole } from '@test/factories'
import { InMemoryRoleRepository } from '@test/repositories/in-memory-role-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListRolesUseCase } from './list-roles-use-case'

const TENANT = 'tenant-1'

describe(ListRolesUseCase.name, () => {
  let roleRepo: InMemoryRoleRepository
  let sut: ListRolesUseCase

  beforeEach(() => {
    roleRepo = new InMemoryRoleRepository()
    sut = new ListRolesUseCase(roleRepo)
  })

  it('retorna lista vazia e nextCursor null quando não há roles', async () => {
    const result = await sut.execute({ tenantId: TENANT })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.roles).toHaveLength(0)
      expect(result.value.nextCursor).toBeNull()
    }
  })

  it('lista roles com contagem de usuários', async () => {
    const role1 = makeRole({ name: 'Gestor', id: 'role-1' })
    const role2 = makeRole({ name: 'Supervisor', id: 'role-2' })
    roleRepo.register(role1, TENANT)
    roleRepo.register(role2, TENANT)
    roleRepo._assignmentCounts.set('role-1', 5)
    roleRepo._assignmentCounts.set('role-2', 2)

    const result = await sut.execute({ tenantId: TENANT })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.roles).toHaveLength(2)
      const gestor = result.value.roles.find((r) => r.role.name === 'Gestor')
      expect(gestor?.assignedUserCount).toBe(5)
      const supervisor = result.value.roles.find((r) => r.role.name === 'Supervisor')
      expect(supervisor?.assignedUserCount).toBe(2)
    }
  })

  it('retorna contagem 0 para roles sem usuários atribuídos', async () => {
    const role = makeRole({ name: 'Visualizador', id: 'role-1' })
    roleRepo.register(role, TENANT)

    const result = await sut.execute({ tenantId: TENANT })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.roles[0].assignedUserCount).toBe(0)
    }
  })

  it('isola por tenant: não retorna roles de outro tenant', async () => {
    roleRepo.register(makeRole({ name: 'Administrador', id: 'role-t1' }), TENANT)
    roleRepo.register(makeRole({ name: 'Administrador', id: 'role-t2' }), 'tenant-2')

    const result = await sut.execute({ tenantId: TENANT })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.roles).toHaveLength(1)
      expect(result.value.roles[0].role.id.toString()).toBe('role-t1')
    }
  })

  it('pagina por cursor: primeira página retorna nextCursor e a próxima continua sem repetir', async () => {
    for (let i = 1; i <= 25; i++) {
      roleRepo.register(
        makeRole({ name: `Role ${i}`, id: `role-${String(i).padStart(2, '0')}` }),
        TENANT,
      )
    }

    const first = await sut.execute({ tenantId: TENANT, limit: 10 })
    expect(first.isRight()).toBe(true)
    if (!first.isRight()) return
    expect(first.value.roles).toHaveLength(10)
    expect(first.value.nextCursor).not.toBeNull()

    const second = await sut.execute({ tenantId: TENANT, limit: 10, cursor: first.value.nextCursor! })
    expect(second.isRight()).toBe(true)
    if (!second.isRight()) return
    expect(second.value.roles).toHaveLength(10)

    const firstIds = first.value.roles.map((r) => r.role.id.toString())
    const secondIds = second.value.roles.map((r) => r.role.id.toString())
    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false)
  })

  it('retorna nextCursor null na última página', async () => {
    for (let i = 1; i <= 5; i++) {
      roleRepo.register(makeRole({ name: `Role ${i}`, id: `role-${i}` }), TENANT)
    }

    const result = await sut.execute({ tenantId: TENANT, limit: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.roles).toHaveLength(5)
      expect(result.value.nextCursor).toBeNull()
    }
  })

  it('sempre retorna Right (sem erros possíveis)', async () => {
    const result = await sut.execute({ tenantId: TENANT })

    expect(result.isRight()).toBe(true)
    expect(result.isLeft()).toBe(false)
  })
})
