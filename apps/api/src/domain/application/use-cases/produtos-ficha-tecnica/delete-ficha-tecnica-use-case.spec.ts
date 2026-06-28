import { makeProdutoFichaTecnica } from '@test/factories/make-produto-ficha-tecnica'
import { InMemoryProdutoFichaTecnicaRepository } from '@test/repositories/in-memory-produto-ficha-tecnica-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteFichaTecnicaUseCase } from './delete-ficha-tecnica-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FichaTecnicaNotFoundError } from '@/domain/application/use-cases/errors/ficha-tecnica-not-found-error'

describe(DeleteFichaTecnicaUseCase.name, () => {
  let fichaRepo: InMemoryProdutoFichaTecnicaRepository
  let sut: DeleteFichaTecnicaUseCase

  beforeEach(() => {
    fichaRepo = new InMemoryProdutoFichaTecnicaRepository()
    sut = new DeleteFichaTecnicaUseCase(fichaRepo)
  })

  it('marca a ficha do tenant como deletada', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', fichaTecnicaId: 'f-1' })

    expect(result.isRight()).toBe(true)
    expect(fichaRepo.fichas[0].deletedAt).toBeInstanceOf(Date)
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
