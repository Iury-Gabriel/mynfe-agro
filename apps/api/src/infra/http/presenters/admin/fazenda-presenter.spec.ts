import { makeFazenda } from '@test/factories/make-fazenda'
import { describe, expect, it } from 'vitest'

import { FazendaPresenter } from './fazenda-presenter'

describe(FazendaPresenter.name, () => {
  it('mapeia todos os campos da entidade', () => {
    const fazenda = makeFazenda({
      id: 'fazenda-1',
      nome: 'Fazenda Boa Vista',
      municipio: 'Sinop',
      uf: 'MT',
      latitude: -11.86,
      longitude: -55.5,
      areaTotalHa: 1500.5,
      car: 'MT-123',
      nirfIncra: 'INCRA-9',
    })

    const sut = FazendaPresenter.toHTTP(fazenda)

    expect(sut.id).toBe('fazenda-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.empresaId).toBe('empresa-1')
    expect(sut.nome).toBe('Fazenda Boa Vista')
    expect(sut.municipio).toBe('Sinop')
    expect(sut.uf).toBe('MT')
    expect(sut.latitude).toBe(-11.86)
    expect(sut.longitude).toBe(-55.5)
    expect(sut.areaTotalHa).toBe(1500.5)
    expect(sut.car).toBe('MT-123')
    expect(sut.nirfIncra).toBe('INCRA-9')
    expect(sut.createdAt).toEqual(fazenda.createdAt)
    expect(sut.updatedAt).toEqual(fazenda.updatedAt)
  })

  it('mapeia campos opcionais nulos', () => {
    const fazenda = makeFazenda({
      municipio: null,
      uf: null,
      latitude: null,
      longitude: null,
      areaTotalHa: null,
      car: null,
      nirfIncra: null,
    })

    const sut = FazendaPresenter.toHTTP(fazenda)

    expect(sut.municipio).toBeNull()
    expect(sut.uf).toBeNull()
    expect(sut.latitude).toBeNull()
    expect(sut.longitude).toBeNull()
    expect(sut.areaTotalHa).toBeNull()
    expect(sut.car).toBeNull()
    expect(sut.nirfIncra).toBeNull()
  })
})
