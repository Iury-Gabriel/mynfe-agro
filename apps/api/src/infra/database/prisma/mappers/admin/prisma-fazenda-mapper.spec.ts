import { Prisma } from '@prisma/client'
import { makeFazenda } from '@test/factories/make-fazenda'
import { describe, expect, it } from 'vitest'

import { PrismaFazendaMapper } from './prisma-fazenda-mapper'

import type { Fazenda as PrismaFazenda } from '@prisma/client'

function makePrismaRow(override: Partial<PrismaFazenda> = {}): PrismaFazenda {
  return {
    id: 'fazenda-1',
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    nome: 'Fazenda Boa Vista',
    enderecoLogradouro: 'Rodovia BR-163',
    enderecoNumero: 'km 10',
    enderecoBairro: 'Zona Rural',
    enderecoCep: '78550000',
    municipio: 'Sinop',
    uf: 'MT',
    latitude: new Prisma.Decimal('-11.8642000'),
    longitude: new Prisma.Decimal('-55.5025000'),
    car: 'MT-123',
    nirfIncra: 'INCRA-9',
    areaTotalHa: new Prisma.Decimal('1500.500'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaFazendaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const fazenda = PrismaFazendaMapper.toDomain(makePrismaRow())

      expect(fazenda.id.toString()).toBe('fazenda-1')
      expect(fazenda.tenantId).toBe('tenant-1')
      expect(fazenda.empresaId).toBe('empresa-1')
      expect(fazenda.nome).toBe('Fazenda Boa Vista')
      expect(fazenda.enderecoLogradouro).toBe('Rodovia BR-163')
      expect(fazenda.enderecoNumero).toBe('km 10')
      expect(fazenda.enderecoBairro).toBe('Zona Rural')
      expect(fazenda.enderecoCep).toBe('78550000')
      expect(fazenda.municipio).toBe('Sinop')
      expect(fazenda.uf).toBe('MT')
      expect(fazenda.latitude).toBe(-11.8642)
      expect(fazenda.longitude).toBe(-55.5025)
      expect(fazenda.car).toBe('MT-123')
      expect(fazenda.nirfIncra).toBe('INCRA-9')
      expect(fazenda.areaTotalHa).toBe(1500.5)
      expect(fazenda.createdAt).toEqual(new Date('2024-01-01'))
      expect(fazenda.updatedAt).toEqual(new Date('2024-01-02'))
      expect(fazenda.deletedAt).toBeNull()
    })

    it('mapeia campos decimais nulos para null', () => {
      const fazenda = PrismaFazendaMapper.toDomain(
        makePrismaRow({ latitude: null, longitude: null, areaTotalHa: null }),
      )
      expect(fazenda.latitude).toBeNull()
      expect(fazenda.longitude).toBeNull()
      expect(fazenda.areaTotalHa).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const fazenda = PrismaFazendaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(fazenda.deletedAt).toEqual(deletedAt)
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação', () => {
      const fazenda = makeFazenda({
        id: 'fazenda-9',
        nome: 'Nova Fazenda',
        latitude: -10.5,
        longitude: -55.2,
        areaTotalHa: 800.25,
      })

      const data = PrismaFazendaMapper.toPrismaCreate(fazenda)

      expect(data.id).toBe('fazenda-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.empresaId).toBe('empresa-1')
      expect(data.nome).toBe('Nova Fazenda')
      expect(data.latitude).toBe(-10.5)
      expect(data.longitude).toBe(-55.2)
      expect(data.areaTotalHa).toBe(800.25)
    })

    it('mapeia decimais nulos para null no create', () => {
      const fazenda = makeFazenda({ latitude: null, longitude: null, areaTotalHa: null })
      const data = PrismaFazendaMapper.toPrismaCreate(fazenda)
      expect(data.latitude).toBeNull()
      expect(data.longitude).toBeNull()
      expect(data.areaTotalHa).toBeNull()
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const fazenda = makeFazenda({ id: 'fazenda-7', nome: 'Atualizada', areaTotalHa: 200 })

      const data = PrismaFazendaMapper.toPrismaUpdate(fazenda)

      expect(data).not.toHaveProperty('id')
      expect(data.nome).toBe('Atualizada')
      expect(data.areaTotalHa).toBe(200)
      expect(data.updatedAt).toEqual(fazenda.updatedAt)
    })
  })
})
