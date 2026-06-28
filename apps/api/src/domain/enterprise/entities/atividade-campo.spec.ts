import { describe, expect, it } from 'vitest'

import { AtividadeCampo } from './atividade-campo'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'

function makeAtividadeFull() {
  return AtividadeCampo.create({
    tenantId: 'tenant-1',
    safraId: 'safra-1',
    areaId: 'area-1',
    tipo: 'plantio',
    data: new Date('2024-10-01'),
    responsavelUsuarioId: 'user-1',
    observacoes: 'Plantio direto',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(AtividadeCampo.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const sut = AtividadeCampo.create({
      tenantId: 'tenant-1',
      safraId: 'safra-1',
      areaId: 'area-1',
      tipo: 'irrigacao',
      data: new Date('2024-10-05'),
      responsavelUsuarioId: 'user-1',
      observacoes: 'Pivô central',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.safraId).toBe('safra-1')
    expect(sut.areaId).toBe('area-1')
    expect(sut.tipo).toBe('irrigacao')
    expect(sut.data).toEqual(new Date('2024-10-05'))
    expect(sut.responsavelUsuarioId).toBe('user-1')
    expect(sut.observacoes).toBe('Pivô central')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('atividade-1')
    const sut = AtividadeCampo.create(
      {
        tenantId: 'tenant-1',
        tipo: 'outro',
        data: new Date('2024-10-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = AtividadeCampo.create({
      tenantId: 'tenant-1',
      tipo: 'adubacao',
      data: new Date('2024-10-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.safraId).toBeNull()
    expect(sut.areaId).toBeNull()
    expect(sut.responsavelUsuarioId).toBeNull()
    expect(sut.observacoes).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeAtividadeFull()

      sut.updateCadastro({
        safraId: 'safra-2',
        areaId: 'area-2',
        tipo: 'pulverizacao',
        data: new Date('2024-11-01'),
        responsavelUsuarioId: 'user-2',
        observacoes: 'Defensivo X',
      })

      expect(sut.safraId).toBe('safra-2')
      expect(sut.areaId).toBe('area-2')
      expect(sut.tipo).toBe('pulverizacao')
      expect(sut.data).toEqual(new Date('2024-11-01'))
      expect(sut.responsavelUsuarioId).toBe('user-2')
      expect(sut.observacoes).toBe('Defensivo X')
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeAtividadeFull()

      sut.updateCadastro({
        safraId: null,
        areaId: null,
        responsavelUsuarioId: null,
        observacoes: null,
      })

      expect(sut.safraId).toBeNull()
      expect(sut.areaId).toBeNull()
      expect(sut.responsavelUsuarioId).toBeNull()
      expect(sut.observacoes).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeAtividadeFull()

      sut.updateCadastro({ tipo: 'outro' })

      expect(sut.tipo).toBe('outro')
      expect(sut.safraId).toBe('safra-1')
      expect(sut.observacoes).toBe('Plantio direto')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = AtividadeCampo.create({
        tenantId: 'tenant-1',
        tipo: 'plantio',
        data: new Date('2024-10-01'),
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ tipo: 'outro' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('softDelete()', () => {
    it('define deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = AtividadeCampo.create({
        tenantId: 'tenant-1',
        tipo: 'plantio',
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
