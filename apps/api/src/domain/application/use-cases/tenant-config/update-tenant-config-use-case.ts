import { Injectable } from '@nestjs/common'

import type { Tenant } from '@/domain/enterprise/entities/tenant'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TenantRepository } from '@/domain/application/repositories/tenant-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { TenantNotFoundError } from '@/domain/application/use-cases/errors/tenant-not-found-error'

export interface UpdateTenantConfigInput {
  tenantId: string
  usuarioId?: string | null
  nome?: string
  labelArea?: string
  diaCorteConsolidacao?: number | null
}

export interface UpdateTenantConfigOutput {
  tenant: Tenant
}

type UpdateTenantConfigResult = Either<
  TenantNotFoundError | UnexpectedError,
  UpdateTenantConfigOutput
>

function snapshot(tenant: Tenant): Record<string, unknown> {
  return {
    nome: tenant.nome,
    labelArea: tenant.labelArea,
    diaCorteConsolidacao: tenant.diaCorteConsolidacao,
  }
}

@Injectable()
export class UpdateTenantConfigUseCase {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: UpdateTenantConfigInput): Promise<UpdateTenantConfigResult> {
    const tenant = await this.tenants.findById(input.tenantId)
    if (!tenant) return left(new TenantNotFoundError())

    const dadosAntes = snapshot(tenant)

    if (input.nome !== undefined) tenant.rename(input.nome)
    if (input.labelArea !== undefined) tenant.setLabelArea(input.labelArea)
    if (input.diaCorteConsolidacao !== undefined) {
      tenant.setDiaCorteConsolidacao(input.diaCorteConsolidacao)
    }

    try {
      await this.tenants.save(tenant)
    } catch (err) {
      console.error('[UpdateTenantConfigUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: tenant.id.toString(),
      usuarioId: input.usuarioId ?? null,
      entidade: 'tenant',
      entidadeId: tenant.id.toString(),
      acao: 'editar',
      dadosAntes,
      dadosDepois: snapshot(tenant),
    })

    return right({ tenant })
  }
}
