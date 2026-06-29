import { describe, expect, it } from 'vitest'

import { Safra } from './safra'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeSafraFull() {
  return Safra.create({
    tenantId: 'tenant-1',
    areaId: 'area-1',
    cultura: 'Soja',
    variedade: 'Intacta',
    dataPlantio: new Date('2024-10-01'),
    dataColheitaPrevista: new Date('2025-02-01'),
    dataColheitaRealizada: null,
    estimativaProducao: 1200,
    status: 'em_andamento',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Safra.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = Safra.create({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      cultura: 'Soja',
      variedade: 'Intacta',
      dataPlantio: new Date('2024-10-01'),
      dataColheitaPrevista: new Date('2025-02-01'),
      dataColheitaRealizada: new Date('2025-02-10'),
      estimativaProducao: 1200,
      status: 'colhido',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.areaId).toBe('area-1')
    expect(sut.cultura).toBe('Soja')
    expect(sut.variedade).toBe('Intacta')
    expect(sut.dataPlantio).toEqual(new Date('2024-10-01'))
    expect(sut.dataColheitaPrevista).toEqual(new Date('2025-02-01'))
    expect(sut.dataColheitaRealizada).toEqual(new Date('2025-02-10'))
    expect(sut.estimativaProducao).toBe(1200)
    expect(sut.status).toBe('colhido')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('safra-1')
    const sut = Safra.create(
      {
        tenantId: 'tenant-1',
        areaId: 'area-1',
        cultura: 'Milho',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = Safra.create({
      tenantId: 'tenant-1',
      areaId: 'area-1',
      cultura: 'Algodão',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.variedade).toBeNull()
    expect(sut.dataPlantio).toBeNull()
    expect(sut.dataColheitaPrevista).toBeNull()
    expect(sut.dataColheitaRealizada).toBeNull()
    expect(sut.estimativaProducao).toBeNull()
    expect(sut.status).toBe('planejado')
    expect(sut.deletedAt).toBeNull()
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeSafraFull()

      sut.updateCadastro({
        cultura: 'Milho',
        variedade: 'Híbrido',
        dataPlantio: new Date('2024-11-01'),
        dataColheitaPrevista: new Date('2025-03-01'),
        dataColheitaRealizada: new Date('2025-03-15'),
        estimativaProducao: 1500,
        status: 'colhido',
      })

      expect(sut.cultura).toBe('Milho')
      expect(sut.variedade).toBe('Híbrido')
      expect(sut.dataPlantio).toEqual(new Date('2024-11-01'))
      expect(sut.dataColheitaPrevista).toEqual(new Date('2025-03-01'))
      expect(sut.dataColheitaRealizada).toEqual(new Date('2025-03-15'))
      expect(sut.estimativaProducao).toBe(1500)
      expect(sut.status).toBe('colhido')
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeSafraFull()

      sut.updateCadastro({
        variedade: null,
        dataPlantio: null,
        dataColheitaPrevista: null,
        dataColheitaRealizada: null,
        estimativaProducao: null,
      })

      expect(sut.variedade).toBeNull()
      expect(sut.dataPlantio).toBeNull()
      expect(sut.dataColheitaPrevista).toBeNull()
      expect(sut.dataColheitaRealizada).toBeNull()
      expect(sut.estimativaProducao).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeSafraFull()

      sut.updateCadastro({ status: 'colhido' })

      expect(sut.status).toBe('colhido')
      expect(sut.cultura).toBe('Soja')
      expect(sut.variedade).toBe('Intacta')
      expect(sut.estimativaProducao).toBe(1200)
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Safra.create({
        tenantId: 'tenant-1',
        areaId: 'area-1',
        cultura: 'Soja',
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ status: 'em_andamento' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('softDelete()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Safra.create({
        tenantId: 'tenant-1',
        areaId: 'area-1',
        cultura: 'Soja',
        createdAt: before,
        updatedAt: before,
      })

      sut.softDelete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
