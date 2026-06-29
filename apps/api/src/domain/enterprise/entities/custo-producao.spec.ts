import { describe, expect, it } from 'vitest'

import { CustoProducao } from './custo-producao'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeCustoFull() {
  return CustoProducao.create({
    tenantId: 'tenant-1',
    safraId: 'safra-1',
    areaId: 'area-1',
    tipo: 'insumo',
    descricao: 'Adubo NPK',
    valor: 5000,
    data: new Date('2024-10-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(CustoProducao.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = CustoProducao.create({
      tenantId: 'tenant-1',
      safraId: 'safra-1',
      areaId: 'area-1',
      tipo: 'mao_de_obra',
      descricao: 'Diaristas colheita',
      valor: 3200.5,
      data: new Date('2024-10-05'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.safraId).toBe('safra-1')
    expect(sut.areaId).toBe('area-1')
    expect(sut.tipo).toBe('mao_de_obra')
    expect(sut.descricao).toBe('Diaristas colheita')
    expect(sut.valor).toBe(3200.5)
    expect(sut.data).toEqual(new Date('2024-10-05'))
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('custo-1')
    const sut = CustoProducao.create(
      {
        tenantId: 'tenant-1',
        tipo: 'maquinario',
        descricao: 'Aluguel trator',
        valor: 800,
        data: new Date('2024-10-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = CustoProducao.create({
      tenantId: 'tenant-1',
      tipo: 'outro',
      descricao: 'Diversos',
      valor: 100,
      data: new Date('2024-10-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.safraId).toBeNull()
    expect(sut.areaId).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeCustoFull()

      sut.updateCadastro({
        safraId: 'safra-2',
        areaId: 'area-2',
        tipo: 'maquinario',
        descricao: 'Manutenção colheitadeira',
        valor: 9000,
        data: new Date('2024-11-01'),
      })

      expect(sut.safraId).toBe('safra-2')
      expect(sut.areaId).toBe('area-2')
      expect(sut.tipo).toBe('maquinario')
      expect(sut.descricao).toBe('Manutenção colheitadeira')
      expect(sut.valor).toBe(9000)
      expect(sut.data).toEqual(new Date('2024-11-01'))
    })

    it('aceita safraId e areaId como null', () => {
      const sut = makeCustoFull()

      sut.updateCadastro({ safraId: null, areaId: null })

      expect(sut.safraId).toBeNull()
      expect(sut.areaId).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeCustoFull()

      sut.updateCadastro({ valor: 7777 })

      expect(sut.valor).toBe(7777)
      expect(sut.descricao).toBe('Adubo NPK')
      expect(sut.tipo).toBe('insumo')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = CustoProducao.create({
        tenantId: 'tenant-1',
        tipo: 'insumo',
        descricao: 'Semente',
        valor: 100,
        data: new Date('2024-10-01'),
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ valor: 200 })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('softDelete()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = CustoProducao.create({
        tenantId: 'tenant-1',
        tipo: 'insumo',
        descricao: 'Semente',
        valor: 100,
        data: new Date('2024-10-01'),
        createdAt: before,
        updatedAt: before,
      })

      sut.softDelete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
