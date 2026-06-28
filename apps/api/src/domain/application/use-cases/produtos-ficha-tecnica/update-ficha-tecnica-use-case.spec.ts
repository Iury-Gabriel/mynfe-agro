import { makeProdutoFichaTecnica } from '@test/factories/make-produto-ficha-tecnica'
import { InMemoryProdutoFichaTecnicaRepository } from '@test/repositories/in-memory-produto-ficha-tecnica-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateFichaTecnicaUseCase } from './update-ficha-tecnica-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'

describe(UpdateFichaTecnicaUseCase.name, () => {
  let fichaRepo: InMemoryProdutoFichaTecnicaRepository
  let sut: UpdateFichaTecnicaUseCase

  beforeEach(() => {
    fichaRepo = new InMemoryProdutoFichaTecnicaRepository()
    sut = new UpdateFichaTecnicaUseCase(fichaRepo)
  })

  it('atualiza os campos da ficha do tenant', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      fichaTecnicaId: 'f-1',
      descricaoComponente: 'Soja moída',
      quantidadeReferencia: 9,
      observacoes: 'Novo',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fichaTecnica.descricaoComponente).toBe('Soja moída')
      expect(result.value.fichaTecnica.quantidadeReferencia).toBe(9)
      expect(result.value.fichaTecnica.observacoes).toBe('Novo')
    }
  })

  it('retorna FichaTecnicaNotFoundError quando a ficha não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', fichaTecnicaId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FichaTecnicaNotFoundError)
  })

  it('retorna FichaTecnicaNotFoundError quando a ficha é de outro tenant (IDOR)', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', fichaTecnicaId: 'f-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(FichaTecnicaNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança ao salvar', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', tenantId: 'tenant-1' }))
    fichaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', fichaTecnicaId: 'f-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
