import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaEmpresaRepository } from './prisma-empresa-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Empresa } from '@/domain/enterprise/entities/empresa'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function makeCnpjCpf(raw = '11222333000181'): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error('invalid cnpj in test')
  return result.value
}

function makeEmpresa(tenantId: string, override: Partial<{ id: string; razaoSocial: string; serieNfe: number | null; status: 'ativo' | 'inativo'; cnpjCpf: string }> = {}): Empresa {
  return Empresa.create(
    {
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocial: override.razaoSocial ?? 'Agro LTDA',
      cnpjCpf: makeCnpjCpf(override.cnpjCpf),
      regimeTributario: 'simples_nacional',
      crt: '1',
      ambienteFiscal: 'homologacao',
      serieNfe: override.serieNfe ?? 1,
      status: override.status ?? 'ativo',
      endereco: { municipio: 'Sinop', uf: 'MT' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    new UniqueEntityID(override.id),
  )
}

async function createTenant(prisma: PrismaClient): Promise<string> {
  const id = randomUUID()
  await prisma.tenant.create({
    data: { id, nome: `Tenant ${id}`, createdAt: new Date(), updatedAt: new Date() },
  })
  return id
}

describe(PrismaEmpresaRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaEmpresaRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaEmpresaRepository(prisma as unknown as PrismaService)
    await prisma.empresa.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera empresa pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const empresa = makeEmpresa(tenantId, { razaoSocial: 'Persistida', serieNfe: 4 })

      await sut.create(empresa)
      const found = await sut.findById(empresa.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.razaoSocial).toBe('Persistida')
      expect(found!.cnpjCpf.value).toBe('11222333000181')
      expect(found!.serieNfe).toBe(4)
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando a empresa pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const empresa = makeEmpresa(tenantA)
      await sut.create(empresa)

      const found = await sut.findById(empresa.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna empresa soft-deletada', async () => {
      const tenantId = await createTenant(prisma)
      const empresa = makeEmpresa(tenantId)
      await sut.create(empresa)
      await prisma.empresa.update({
        where: { id: empresa.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(empresa.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas empresas do tenant, paginadas e sem soft-deletadas', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      await sut.create(makeEmpresa(tenantA, { cnpjCpf: '11222333000181' }))
      await sut.create(makeEmpresa(tenantA, { cnpjCpf: '04252011000110' }))
      await sut.create(makeEmpresa(tenantB, { cnpjCpf: '11444777000161' }))
      const deleted = makeEmpresa(tenantA, { cnpjCpf: '19131243000197' })
      await sut.create(deleted)
      await prisma.empresa.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((e) => e.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeEmpresa(tenantId, { cnpjCpf: '11222333000181' }))
      await sut.create(makeEmpresa(tenantId, { cnpjCpf: '04252011000110' }))
      await sut.create(makeEmpresa(tenantId, { cnpjCpf: '11444777000161' }))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((e) => e.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const empresa = makeEmpresa(tenantId, { razaoSocial: 'Original' })
      await sut.create(empresa)

      empresa.updateCadastro({ razaoSocial: 'Atualizada', serieNfe: 9 })
      empresa.deactivate()
      await sut.save(empresa)

      const found = await sut.findById(empresa.id.toString(), tenantId)
      expect(found!.razaoSocial).toBe('Atualizada')
      expect(found!.serieNfe).toBe(9)
      expect(found!.status).toBe('inativo')
    })
  })
})
