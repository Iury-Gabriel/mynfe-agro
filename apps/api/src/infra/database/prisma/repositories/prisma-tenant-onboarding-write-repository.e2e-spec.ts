import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaTenantOnboardingWriteRepository } from './prisma-tenant-onboarding-write-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { PERMISSIONS } from '@/core/auth/permissions'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Empresa } from '@/domain/enterprise/entities/empresa'
import { Tenant } from '@/domain/enterprise/entities/tenant'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function makeTenant(): Tenant {
  return Tenant.create({
    nome: 'Fazenda Onboard',
    labelArea: 'Talhão',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeEmpresa(tenantId: string): Empresa {
  const cnpj = CnpjCpf.create('11222333000181')
  if (cnpj.isLeft()) throw new Error('cnpj inválido no setup')
  return Empresa.create({
    tenantId,
    tipoPessoa: 'PJ',
    razaoSocial: 'Agro Onboard LTDA',
    cnpjCpf: cnpj.value,
    regimeTributario: 'simples_nacional',
    crt: '1',
    ambienteFiscal: 'homologacao',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

describe(PrismaTenantOnboardingWriteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaTenantOnboardingWriteRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaTenantOnboardingWriteRepository(prisma as unknown as PrismaService)
    await prisma.usuarioEmpresa.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.userRoleAssignment.deleteMany()
    await prisma.empresa.deleteMany()
    await prisma.role.deleteMany()
    await prisma.user.deleteMany()
    await prisma.tenant.deleteMany()
  })

  async function seedUser(): Promise<string> {
    const userId = randomUUID()
    await prisma.user.create({
      data: { id: userId, email: `${randomUUID()}@e2e.com`, name: 'Onboard', isActive: false },
    })
    return userId
  }

  it('provisiona tenant, role com permissões, assignment, empresa e vínculo numa transação', async () => {
    const userId = await seedUser()
    const tenant = makeTenant()
    const empresa = makeEmpresa(tenant.id.toString())

    await sut.provision({
      userId,
      tenant,
      empresa,
      roleName: 'Administrador',
      permissions: PERMISSIONS,
    })

    const tenantId = tenant.id.toString()
    const persistedTenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    expect(persistedTenant!.nome).toBe('Fazenda Onboard')

    const persistedUser = await prisma.user.findUnique({ where: { id: userId } })
    expect(persistedUser!.tenantId).toBe(tenantId)
    expect(persistedUser!.isActive).toBe(true)
    expect(persistedUser!.emailVerified).toBe(true)

    const role = await prisma.role.findFirst({ where: { tenantId } })
    expect(role!.name).toBe('Administrador')
    expect(role!.isSystem).toBe(true)

    const perms = await prisma.rolePermission.count({ where: { roleId: role!.id } })
    expect(perms).toBe(PERMISSIONS.length)

    const assignment = await prisma.userRoleAssignment.findFirst({ where: { userId } })
    expect(assignment!.roleId).toBe(role!.id)

    const persistedEmpresa = await prisma.empresa.findFirst({ where: { tenantId } })
    expect(persistedEmpresa!.razaoSocial).toBe('Agro Onboard LTDA')

    const vinculo = await prisma.usuarioEmpresa.findFirst({ where: { userId } })
    expect(vinculo!.empresaId).toBe(empresa.id.toString())
  })

  it('reverte tudo quando a transação falha (rollback atômico)', async () => {
    const userId = await seedUser()
    const tenant = makeTenant()
    const empresa = makeEmpresa(tenant.id.toString())

    // userId inexistente no segundo provision força erro no update do user e deve abortar a tx
    await expect(
      sut.provision({
        userId: 'user-inexistente',
        tenant,
        empresa,
        roleName: 'Administrador',
        permissions: PERMISSIONS,
      }),
    ).rejects.toThrow()

    expect(await prisma.tenant.findUnique({ where: { id: tenant.id.toString() } })).toBeNull()
    expect(await prisma.empresa.count()).toBe(0)
    expect(await prisma.role.count()).toBe(0)
    // o user seedado segue intacto, sem tenant
    const persistedUser = await prisma.user.findUnique({ where: { id: userId } })
    expect(persistedUser!.tenantId).toBeNull()
  })

  it('permite o mesmo nome de role "Administrador" em tenants diferentes', async () => {
    const user1 = await seedUser()
    const tenant1 = makeTenant()
    await sut.provision({
      userId: user1,
      tenant: tenant1,
      empresa: makeEmpresa(tenant1.id.toString()),
      roleName: 'Administrador',
      permissions: PERMISSIONS,
    })

    const user2 = await seedUser()
    const tenant2 = makeTenant()
    await expect(
      sut.provision({
        userId: user2,
        tenant: tenant2,
        empresa: makeEmpresa(tenant2.id.toString()),
        roleName: 'Administrador',
        permissions: PERMISSIONS,
      }),
    ).resolves.toBeUndefined()

    expect(await prisma.role.count({ where: { name: 'Administrador' } })).toBe(2)
  })
})
