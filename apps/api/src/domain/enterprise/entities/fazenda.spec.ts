import { describe, expect, it } from 'vitest'

import { Fazenda } from './fazenda'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeFazendaFull() {
  return Fazenda.create({
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    nome: 'Fazenda Boa Vista',
    enderecoLogradouro: 'Estrada Rural km 10',
    enderecoNumero: 's/n',
    enderecoBairro: 'Zona Rural',
    enderecoCep: '78000-000',
    municipio: 'Sorriso',
    uf: 'MT',
    latitude: -12.5,
    longitude: -55.7,
    car: 'MT-1234',
    nirfIncra: 'INCRA-9',
    areaTotalHa: 1500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Fazenda.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = makeFazendaFull()

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.nome).toBe('Fazenda Boa Vista')
    expect(sut.enderecoLogradouro).toBe('Estrada Rural km 10')
    expect(sut.enderecoNumero).toBe('s/n')
    expect(sut.enderecoBairro).toBe('Zona Rural')
    expect(sut.enderecoCep).toBe('78000-000')
    expect(sut.municipio).toBe('Sorriso')
    expect(sut.uf).toBe('MT')
    expect(sut.latitude).toBe(-12.5)
    expect(sut.longitude).toBe(-55.7)
    expect(sut.car).toBe('MT-1234')
    expect(sut.nirfIncra).toBe('INCRA-9')
    expect(sut.areaTotalHa).toBe(1500)
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('fazenda-1')
    const sut = Fazenda.create(
      {
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        nome: 'Fazenda X',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults nulos para campos opcionais quando omitidos', () => {
    const sut = Fazenda.create({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      nome: 'Fazenda X',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.enderecoLogradouro).toBeNull()
    expect(sut.enderecoNumero).toBeNull()
    expect(sut.enderecoBairro).toBeNull()
    expect(sut.enderecoCep).toBeNull()
    expect(sut.municipio).toBeNull()
    expect(sut.uf).toBeNull()
    expect(sut.latitude).toBeNull()
    expect(sut.longitude).toBeNull()
    expect(sut.car).toBeNull()
    expect(sut.nirfIncra).toBeNull()
    expect(sut.areaTotalHa).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeFazendaFull()

      sut.updateCadastro({
        nome: 'Fazenda Renovada',
        enderecoLogradouro: 'Av Nova',
        enderecoNumero: '100',
        enderecoBairro: 'Centro',
        enderecoCep: '78100-000',
        municipio: 'Sinop',
        uf: 'PA',
        latitude: -3.1,
        longitude: -52.2,
        car: 'PA-9999',
        nirfIncra: 'INCRA-1',
        areaTotalHa: 2000,
      })

      expect(sut.nome).toBe('Fazenda Renovada')
      expect(sut.enderecoLogradouro).toBe('Av Nova')
      expect(sut.enderecoNumero).toBe('100')
      expect(sut.enderecoBairro).toBe('Centro')
      expect(sut.enderecoCep).toBe('78100-000')
      expect(sut.municipio).toBe('Sinop')
      expect(sut.uf).toBe('PA')
      expect(sut.latitude).toBe(-3.1)
      expect(sut.longitude).toBe(-52.2)
      expect(sut.car).toBe('PA-9999')
      expect(sut.nirfIncra).toBe('INCRA-1')
      expect(sut.areaTotalHa).toBe(2000)
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeFazendaFull()

      sut.updateCadastro({
        enderecoLogradouro: null,
        enderecoNumero: null,
        enderecoBairro: null,
        enderecoCep: null,
        municipio: null,
        uf: null,
        latitude: null,
        longitude: null,
        car: null,
        nirfIncra: null,
        areaTotalHa: null,
      })

      expect(sut.enderecoLogradouro).toBeNull()
      expect(sut.enderecoNumero).toBeNull()
      expect(sut.enderecoBairro).toBeNull()
      expect(sut.enderecoCep).toBeNull()
      expect(sut.municipio).toBeNull()
      expect(sut.uf).toBeNull()
      expect(sut.latitude).toBeNull()
      expect(sut.longitude).toBeNull()
      expect(sut.car).toBeNull()
      expect(sut.nirfIncra).toBeNull()
      expect(sut.areaTotalHa).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeFazendaFull()

      sut.updateCadastro({ nome: 'Somente Nome' })

      expect(sut.nome).toBe('Somente Nome')
      expect(sut.municipio).toBe('Sorriso')
      expect(sut.uf).toBe('MT')
      expect(sut.areaTotalHa).toBe(1500)
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Fazenda.create({
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        nome: 'Fazenda X',
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ nome: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('softDelete()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Fazenda.create({
        tenantId: 'tenant-1',
        empresaId: 'empresa-1',
        nome: 'Fazenda X',
        createdAt: before,
        updatedAt: before,
      })

      sut.softDelete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
