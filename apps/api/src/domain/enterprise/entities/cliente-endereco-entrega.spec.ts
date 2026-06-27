import { describe, expect, it } from 'vitest'

import { ClienteEnderecoEntrega } from './cliente-endereco-entrega'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

describe(ClienteEnderecoEntrega.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = ClienteEnderecoEntrega.create({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      enderecoLogradouro: 'Rua A',
      enderecoNumero: '100',
      enderecoBairro: 'Centro',
      enderecoCep: '78000-000',
      municipio: 'Cuiabá',
      uf: 'MT',
      principal: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.enderecoLogradouro).toBe('Rua A')
    expect(sut.enderecoNumero).toBe('100')
    expect(sut.enderecoBairro).toBe('Centro')
    expect(sut.enderecoCep).toBe('78000-000')
    expect(sut.municipio).toBe('Cuiabá')
    expect(sut.uf).toBe('MT')
    expect(sut.principal).toBe(true)
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('endereco-1')
    const sut = ClienteEnderecoEntrega.create(
      {
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = ClienteEnderecoEntrega.create({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.enderecoLogradouro).toBeNull()
    expect(sut.enderecoNumero).toBeNull()
    expect(sut.enderecoBairro).toBeNull()
    expect(sut.enderecoCep).toBeNull()
    expect(sut.municipio).toBeNull()
    expect(sut.uf).toBeNull()
    expect(sut.principal).toBe(false)
    expect(sut.deletedAt).toBeNull()
  })

  describe('update()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = ClienteEnderecoEntrega.create({
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })

      sut.update({
        enderecoLogradouro: 'Av B',
        enderecoNumero: '200',
        enderecoBairro: 'Jardim',
        enderecoCep: '78010-000',
        municipio: 'Sorriso',
        uf: 'MT',
        principal: true,
      })

      expect(sut.enderecoLogradouro).toBe('Av B')
      expect(sut.enderecoNumero).toBe('200')
      expect(sut.enderecoBairro).toBe('Jardim')
      expect(sut.enderecoCep).toBe('78010-000')
      expect(sut.municipio).toBe('Sorriso')
      expect(sut.uf).toBe('MT')
      expect(sut.principal).toBe(true)
    })

    it('mantém campos não informados intactos e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = ClienteEnderecoEntrega.create({
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        enderecoLogradouro: 'Rua A',
        principal: true,
        createdAt: before,
        updatedAt: before,
      })

      sut.update({ municipio: 'Lucas do Rio Verde' })

      expect(sut.municipio).toBe('Lucas do Rio Verde')
      expect(sut.enderecoLogradouro).toBe('Rua A')
      expect(sut.principal).toBe(true)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('delete()', () => {
    it('marca deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = ClienteEnderecoEntrega.create({
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        createdAt: before,
        updatedAt: before,
      })

      sut.delete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
