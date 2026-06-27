import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { PrismaClienteRepository } from './prisma-cliente-repository'

import type { PrismaService } from '../prisma.service'
import type { PrismaClient } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Cliente } from '@/domain/enterprise/entities/cliente'
import { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function makeCnpjCpf(raw = '11222333000181'): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error('invalid cnpj in test')
  return result.value
}

function makeCliente(
  tenantId: string,
  override: Partial<{
    id: string
    razaoSocialNome: string
    cnpjCpf: string
    enderecosEntrega: ClienteEnderecoEntrega[]
  }> = {},
): Cliente {
  return Cliente.create(
    {
      tenantId,
      tipoPessoa: 'PJ',
      razaoSocialNome: override.razaoSocialNome ?? 'Cliente Agro LTDA',
      cnpjCpf: makeCnpjCpf(override.cnpjCpf),
      indicadorIe: '1',
      contribuinteIcms: true,
      enderecosEntrega: override.enderecosEntrega ?? [],
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

describe(PrismaClienteRepository.name, () => {
  let prisma: PrismaClient
  let sut: PrismaClienteRepository

  beforeEach(async () => {
    prisma = globalThis.__E2E_PRISMA__!
    sut = new PrismaClienteRepository(prisma as unknown as PrismaService)
    await prisma.clienteEnderecoEntrega.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.tenant.deleteMany()
  })

  describe('create + findById', () => {
    it('persiste e recupera cliente pelo id dentro do tenant', async () => {
      const tenantId = await createTenant(prisma)
      const cliente = makeCliente(tenantId, { razaoSocialNome: 'Persistido' })

      await sut.create(cliente)
      const found = await sut.findById(cliente.id.toString(), tenantId)

      expect(found).not.toBeNull()
      expect(found!.razaoSocialNome).toBe('Persistido')
      expect(found!.cnpjCpf.value).toBe('11222333000181')
      expect(found!.indicadorIe).toBe('1')
      expect(found!.contribuinteIcms).toBe(true)
    })

    it('persiste e recupera os endereços de entrega', async () => {
      const tenantId = await createTenant(prisma)
      const cliente = makeCliente(tenantId)
      cliente.addEnderecoEntrega(
        ClienteEnderecoEntrega.create({
          tenantId,
          clienteId: cliente.id.toString(),
          enderecoLogradouro: 'Rua da Entrega',
          municipio: 'Sorriso',
          uf: 'MT',
          principal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      )

      await sut.create(cliente)
      const found = await sut.findById(cliente.id.toString(), tenantId)

      expect(found!.enderecosEntrega).toHaveLength(1)
      expect(found!.enderecosEntrega[0].enderecoLogradouro).toBe('Rua da Entrega')
      expect(found!.enderecosEntrega[0].principal).toBe(true)
    })

    it('retorna null para id inexistente', async () => {
      const tenantId = await createTenant(prisma)
      const found = await sut.findById(randomUUID(), tenantId)
      expect(found).toBeNull()
    })

    it('retorna null quando o cliente pertence a outro tenant (isolamento)', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      const cliente = makeCliente(tenantA)
      await sut.create(cliente)

      const found = await sut.findById(cliente.id.toString(), tenantB)
      expect(found).toBeNull()
    })

    it('não retorna cliente soft-deletado', async () => {
      const tenantId = await createTenant(prisma)
      const cliente = makeCliente(tenantId)
      await sut.create(cliente)
      await prisma.cliente.update({
        where: { id: cliente.id.toString() },
        data: { deletedAt: new Date() },
      })

      const found = await sut.findById(cliente.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })

  describe('findManyByTenant + count', () => {
    it('lista apenas clientes do tenant, paginados e sem soft-deletados', async () => {
      const tenantA = await createTenant(prisma)
      const tenantB = await createTenant(prisma)
      await sut.create(makeCliente(tenantA, { cnpjCpf: '11222333000181' }))
      await sut.create(makeCliente(tenantA, { cnpjCpf: '04252011000110' }))
      await sut.create(makeCliente(tenantB, { cnpjCpf: '11444777000161' }))
      const deleted = makeCliente(tenantA, { cnpjCpf: '19131243000197' })
      await sut.create(deleted)
      await prisma.cliente.update({
        where: { id: deleted.id.toString() },
        data: { deletedAt: new Date() },
      })

      const items = await sut.findManyByTenant(tenantA, { page: 1, perPage: 10 })
      const total = await sut.count(tenantA)

      expect(items).toHaveLength(2)
      expect(total).toBe(2)
      expect(items.every((c) => c.tenantId === tenantA)).toBe(true)
    })

    it('aplica take/skip por página', async () => {
      const tenantId = await createTenant(prisma)
      await sut.create(makeCliente(tenantId, { cnpjCpf: '11222333000181' }))
      await sut.create(makeCliente(tenantId, { cnpjCpf: '04252011000110' }))
      await sut.create(makeCliente(tenantId, { cnpjCpf: '11444777000161' }))

      const page1 = await sut.findManyByTenant(tenantId, { page: 1, perPage: 2 })
      const page2 = await sut.findManyByTenant(tenantId, { page: 2, perPage: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      const ids = new Set([...page1, ...page2].map((c) => c.id.toString()))
      expect(ids.size).toBe(3)
    })
  })

  describe('save', () => {
    it('atualiza os campos persistidos', async () => {
      const tenantId = await createTenant(prisma)
      const cliente = makeCliente(tenantId, { razaoSocialNome: 'Original' })
      await sut.create(cliente)

      cliente.updateCadastro({ razaoSocialNome: 'Atualizado', email: 'novo@test.com' })
      await sut.save(cliente)

      const found = await sut.findById(cliente.id.toString(), tenantId)
      expect(found!.razaoSocialNome).toBe('Atualizado')
      expect(found!.email).toBe('novo@test.com')
    })

    it('persiste o soft-delete via save', async () => {
      const tenantId = await createTenant(prisma)
      const cliente = makeCliente(tenantId)
      await sut.create(cliente)

      cliente.delete()
      await sut.save(cliente)

      const found = await sut.findById(cliente.id.toString(), tenantId)
      expect(found).toBeNull()
    })
  })
})
