import { makeCliente } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaClienteMapper } from './prisma-cliente-mapper'

import type {
  Cliente as PrismaCliente,
  ClienteEnderecoEntrega as PrismaClienteEnderecoEntrega,
} from '@prisma/client'

import { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'

function makePrismaEndereco(
  override: Partial<PrismaClienteEnderecoEntrega> = {},
): PrismaClienteEnderecoEntrega {
  return {
    id: 'endereco-1',
    tenantId: 'tenant-1',
    clienteId: 'cliente-1',
    enderecoLogradouro: 'Rua B',
    enderecoNumero: '200',
    enderecoBairro: 'Jardim',
    enderecoCep: '78550001',
    municipio: 'Sorriso',
    uf: 'MT',
    principal: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

function makePrismaRow(
  override: Partial<PrismaCliente> & {
    enderecosEntrega?: PrismaClienteEnderecoEntrega[]
  } = {},
): PrismaCliente & { enderecosEntrega?: PrismaClienteEnderecoEntrega[] } {
  return {
    id: 'cliente-1',
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocialNome: 'Cliente Agro LTDA',
    cnpjCpf: '11222333000181',
    inscricaoEstadual: '123',
    indicadorIe: '1',
    contribuinteIcms: true,
    enderecoLogradouro: 'Rua A',
    enderecoNumero: '100',
    enderecoBairro: 'Centro',
    enderecoCep: '78550000',
    municipio: 'Sinop',
    codMunicipioIbge: '5107909',
    uf: 'MT',
    email: 'cliente@test.com',
    telefone: '66999999999',
    vendedorUsuarioId: 'vendedor-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaClienteMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const cliente = PrismaClienteMapper.toDomain(makePrismaRow())

      expect(cliente.id.toString()).toBe('cliente-1')
      expect(cliente.tenantId).toBe('tenant-1')
      expect(cliente.tipoPessoa).toBe('PJ')
      expect(cliente.razaoSocialNome).toBe('Cliente Agro LTDA')
      expect(cliente.cnpjCpf.value).toBe('11222333000181')
      expect(cliente.inscricaoEstadual).toBe('123')
      expect(cliente.indicadorIe).toBe('1')
      expect(cliente.contribuinteIcms).toBe(true)
      expect(cliente.enderecoLogradouro).toBe('Rua A')
      expect(cliente.enderecoNumero).toBe('100')
      expect(cliente.enderecoBairro).toBe('Centro')
      expect(cliente.enderecoCep).toBe('78550000')
      expect(cliente.municipio).toBe('Sinop')
      expect(cliente.codMunicipioIbge).toBe('5107909')
      expect(cliente.uf).toBe('MT')
      expect(cliente.email).toBe('cliente@test.com')
      expect(cliente.telefone).toBe('66999999999')
      expect(cliente.vendedorUsuarioId).toBe('vendedor-1')
      expect(cliente.enderecosEntrega).toHaveLength(0)
      expect(cliente.createdAt).toEqual(new Date('2024-01-01'))
      expect(cliente.updatedAt).toEqual(new Date('2024-01-02'))
      expect(cliente.deletedAt).toBeNull()
    })

    it('reconstrói o CNPJ/CPF via value object a partir do valor persistido', () => {
      const cliente = PrismaClienteMapper.toDomain(makePrismaRow({ cnpjCpf: '52998224725' }))
      expect(cliente.cnpjCpf.value).toBe('52998224725')
      expect(cliente.cnpjCpf.isCpf).toBe(true)
    })

    it('mapeia os endereços de entrega quando presentes', () => {
      const cliente = PrismaClienteMapper.toDomain(
        makePrismaRow({ enderecosEntrega: [makePrismaEndereco()] }),
      )

      expect(cliente.enderecosEntrega).toHaveLength(1)
      const endereco = cliente.enderecosEntrega[0]
      expect(endereco.id.toString()).toBe('endereco-1')
      expect(endereco.clienteId).toBe('cliente-1')
      expect(endereco.enderecoLogradouro).toBe('Rua B')
      expect(endereco.municipio).toBe('Sorriso')
      expect(endereco.uf).toBe('MT')
      expect(endereco.principal).toBe(true)
    })

    it('trata enderecosEntrega ausente como lista vazia', () => {
      const row = makePrismaRow()
      delete (row as { enderecosEntrega?: unknown }).enderecosEntrega
      const cliente = PrismaClienteMapper.toDomain(row)
      expect(cliente.enderecosEntrega).toHaveLength(0)
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const cliente = PrismaClienteMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(cliente.deletedAt).toEqual(deletedAt)
    })

    it('lança erro quando o CNPJ/CPF persistido é inválido', () => {
      expect(() =>
        PrismaClienteMapper.toDomain(makePrismaRow({ cnpjCpf: '00000000000000' })),
      ).toThrow(/CNPJ\/CPF persistido inválido/)
    })
  })

  describe('enderecoToDomain', () => {
    it('mapeia um endereço de entrega isolado', () => {
      const endereco = PrismaClienteMapper.enderecoToDomain(makePrismaEndereco({ principal: false }))
      expect(endereco).toBeInstanceOf(ClienteEnderecoEntrega)
      expect(endereco.principal).toBe(false)
      expect(endereco.enderecoCep).toBe('78550001')
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade persistindo o cnpjCpf como string limpa', () => {
      const cliente = makeCliente({ id: 'cliente-9', cnpjCpf: '11.222.333/0001-81' })

      const data = PrismaClienteMapper.toPrismaCreate(cliente)

      expect(data.id).toBe('cliente-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.cnpjCpf).toBe('11222333000181')
      expect(data.indicadorIe).toBe('1')
      expect(data.contribuinteIcms).toBe(true)
    })

    it('aninha a criação dos endereços de entrega', () => {
      const endereco = ClienteEnderecoEntrega.create(
        {
          tenantId: 'tenant-1',
          clienteId: 'cliente-1',
          enderecoLogradouro: 'Rua C',
          principal: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        undefined,
      )
      const cliente = makeCliente({ enderecosEntrega: [endereco] })

      const data = PrismaClienteMapper.toPrismaCreate(cliente)

      const nested = data.enderecosEntrega?.create
      expect(Array.isArray(nested)).toBe(true)
      expect((nested as unknown[]).length).toBe(1)
    })
  })

  describe('enderecoToPrismaCreate', () => {
    it('serializa um endereço para o input aninhado sem clienteId', () => {
      const endereco = ClienteEnderecoEntrega.create(
        {
          tenantId: 'tenant-1',
          clienteId: 'cliente-1',
          enderecoLogradouro: 'Rua D',
          municipio: 'Lucas do Rio Verde',
          uf: 'MT',
          principal: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        undefined,
      )

      const data = PrismaClienteMapper.enderecoToPrismaCreate(endereco)

      expect(data).not.toHaveProperty('clienteId')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.enderecoLogradouro).toBe('Rua D')
      expect(data.municipio).toBe('Lucas do Rio Verde')
      expect(data.principal).toBe(true)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const cliente = makeCliente({ id: 'cliente-7', razaoSocialNome: 'Novo Nome' })

      const data = PrismaClienteMapper.toPrismaUpdate(cliente)

      expect(data).not.toHaveProperty('id')
      expect(data.razaoSocialNome).toBe('Novo Nome')
      expect(data.cnpjCpf).toBe('11222333000181')
      expect(data.updatedAt).toEqual(cliente.updatedAt)
    })
  })
})
