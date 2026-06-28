import { makeTenant } from '@test/factories'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryTenantRepository } from '@test/repositories/in-memory-tenant-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateTenantConfigUseCase } from './update-tenant-config-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'

describe(UpdateTenantConfigUseCase.name, () => {
  let tenantRepo: InMemoryTenantRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let registrarAuditoria: RegistrarAuditoriaUseCase
  let sut: UpdateTenantConfigUseCase

  beforeEach(() => {
    tenantRepo = new InMemoryTenantRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    registrarAuditoria = new RegistrarAuditoriaUseCase(auditoriaRepo)
    sut = new UpdateTenantConfigUseCase(tenantRepo, registrarAuditoria)
  })

  it('atualiza nome, labelArea e diaCorteConsolidacao', async () => {
    tenantRepo.tenants.push(
      makeTenant({
        id: 'tenant-1',
        nome: 'Antigo',
        labelArea: 'Talhão',
        diaCorteConsolidacao: 5,
      }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      nome: 'Novo',
      labelArea: 'Gleba',
      diaCorteConsolidacao: 15,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.nome).toBe('Novo')
      expect(result.value.tenant.labelArea).toBe('Gleba')
      expect(result.value.tenant.diaCorteConsolidacao).toBe(15)
    }
  })

  it('registra uma auditoria com dadosAntes e dadosDepois', async () => {
    tenantRepo.tenants.push(makeTenant({ id: 'tenant-1', nome: 'Antigo', labelArea: 'Talhão' }))

    await sut.execute({ tenantId: 'tenant-1', nome: 'Novo' })

    expect(auditoriaRepo.logs).toHaveLength(1)
    const log = auditoriaRepo.logs[0]
    expect(log.entidade).toBe('tenant')
    expect(log.acao).toBe('editar')
    expect(log.entidadeId).toBe('tenant-1')
    expect(log.dadosAntes).toMatchObject({ nome: 'Antigo' })
    expect(log.dadosDepois).toMatchObject({ nome: 'Novo' })
  })

  it('propaga o usuarioId para a auditoria', async () => {
    tenantRepo.tenants.push(makeTenant({ id: 'tenant-1' }))

    await sut.execute({ tenantId: 'tenant-1', nome: 'Novo', usuarioId: 'user-99' })

    expect(auditoriaRepo.logs[0].usuarioId).toBe('user-99')
  })

  it('aceita diaCorteConsolidacao null', async () => {
    tenantRepo.tenants.push(makeTenant({ id: 'tenant-1', diaCorteConsolidacao: 5 }))

    const result = await sut.execute({ tenantId: 'tenant-1', diaCorteConsolidacao: null })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.diaCorteConsolidacao).toBeNull()
    }
  })

  it('não altera campos omitidos', async () => {
    tenantRepo.tenants.push(
      makeTenant({ id: 'tenant-1', nome: 'Original', labelArea: 'Talhão' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', nome: 'Novo' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.tenant.labelArea).toBe('Talhão')
    }
  })

  it('retorna TenantNotFoundError quando o tenant não existe', async () => {
    const result = await sut.execute({ tenantId: 'inexistente', nome: 'Novo' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TenantNotFoundError)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })

  it('retorna UnexpectedError quando o save falha', async () => {
    tenantRepo.tenants.push(makeTenant({ id: 'tenant-1' }))
    tenantRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', nome: 'Novo' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
