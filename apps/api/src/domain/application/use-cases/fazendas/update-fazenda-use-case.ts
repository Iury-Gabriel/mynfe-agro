import { Injectable } from '@nestjs/common'

import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { FazendaNotFoundError } from '@/domain/application/use-cases/errors/fazenda-not-found-error'

export interface UpdateFazendaInput {
  tenantId: string
  fazendaId: string
  nome?: string
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  latitude?: number | null
  longitude?: number | null
  car?: string | null
  nirfIncra?: string | null
  areaTotalHa?: number | null
}

export interface UpdateFazendaOutput {
  fazenda: Fazenda
}

type UpdateFazendaResult = Either<FazendaNotFoundError | UnexpectedError, UpdateFazendaOutput>

@Injectable()
export class UpdateFazendaUseCase {
  constructor(
    private readonly fazendas: FazendaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: UpdateFazendaInput): Promise<UpdateFazendaResult> {
    const fazenda = await this.fazendas.findById(input.fazendaId, input.tenantId)
    if (!fazenda) return left(new FazendaNotFoundError())

    const dadosAntes = { nome: fazenda.nome }

    fazenda.updateCadastro({
      nome: input.nome,
      enderecoLogradouro: input.enderecoLogradouro,
      enderecoNumero: input.enderecoNumero,
      enderecoBairro: input.enderecoBairro,
      enderecoCep: input.enderecoCep,
      municipio: input.municipio,
      uf: input.uf,
      latitude: input.latitude,
      longitude: input.longitude,
      car: input.car,
      nirfIncra: input.nirfIncra,
      areaTotalHa: input.areaTotalHa,
    })

    try {
      await this.fazendas.save(fazenda)
    } catch (err) {
      console.error('[UpdateFazendaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    await this.registrarAuditoria.execute({
      tenantId: input.tenantId,
      entidade: 'fazenda',
      entidadeId: fazenda.id.toString(),
      acao: 'editar',
      dadosAntes,
      dadosDepois: { nome: fazenda.nome },
    })

    return right({ fazenda })
  }
}
