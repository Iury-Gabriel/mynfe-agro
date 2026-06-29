import { describe, expect, it } from 'vitest'

import { Area } from './area'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeAreaFull() {
  return Area.create({
    tenantId: 'tenant-1',
    fazendaId: 'fazenda-1',
    identificacao: 'Talhão 01',
    tamanho: 120.5,
    unidadeTamanho: 'ha',
    rotulo: 'Soja',
    geometria: { type: 'Polygon', coordinates: [] },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Area.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = makeAreaFull()

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.fazendaId).toBe('fazenda-1')
    expect(sut.identificacao).toBe('Talhão 01')
    expect(sut.tamanho).toBe(120.5)
    expect(sut.unidadeTamanho).toBe('ha')
    expect(sut.rotulo).toBe('Soja')
    expect(sut.geometria).toEqual({ type: 'Polygon', coordinates: [] })
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('area-1')
    const sut = Area.create(
      {
        tenantId: 'tenant-1',
        fazendaId: 'fazenda-1',
        identificacao: 'Talhão 02',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults nulos para campos opcionais quando omitidos', () => {
    const sut = Area.create({
      tenantId: 'tenant-1',
      fazendaId: 'fazenda-1',
      identificacao: 'Talhão 02',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tamanho).toBeNull()
    expect(sut.unidadeTamanho).toBeNull()
    expect(sut.rotulo).toBeNull()
    expect(sut.geometria).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeAreaFull()

      sut.updateCadastro({
        identificacao: 'Talhão 99',
        tamanho: 300,
        unidadeTamanho: 'alq',
        rotulo: 'Milho',
        geometria: { type: 'Point', coordinates: [1, 2] },
      })

      expect(sut.identificacao).toBe('Talhão 99')
      expect(sut.tamanho).toBe(300)
      expect(sut.unidadeTamanho).toBe('alq')
      expect(sut.rotulo).toBe('Milho')
      expect(sut.geometria).toEqual({ type: 'Point', coordinates: [1, 2] })
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeAreaFull()

      sut.updateCadastro({
        tamanho: null,
        unidadeTamanho: null,
        rotulo: null,
        geometria: null,
      })

      expect(sut.tamanho).toBeNull()
      expect(sut.unidadeTamanho).toBeNull()
      expect(sut.rotulo).toBeNull()
      expect(sut.geometria).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeAreaFull()

      sut.updateCadastro({ identificacao: 'Somente Identificação' })

      expect(sut.identificacao).toBe('Somente Identificação')
      expect(sut.tamanho).toBe(120.5)
      expect(sut.rotulo).toBe('Soja')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Area.create({
        tenantId: 'tenant-1',
        fazendaId: 'fazenda-1',
        identificacao: 'Talhão 02',
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ identificacao: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('softDelete()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Area.create({
        tenantId: 'tenant-1',
        fazendaId: 'fazenda-1',
        identificacao: 'Talhão 02',
        createdAt: before,
        updatedAt: before,
      })

      sut.softDelete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
