import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { FazendaRepository } from '@/domain/application/repositories/fazenda-repository'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { Fazenda } from '@/domain/enterprise/entities/fazenda'

export interface CreateFazendaInput {
  tenantId: string
  empresaId: string
  nome: string
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

export interface CreateFazendaOutput {
  fazenda: Fazenda
}

type CreateFazendaResult = Either<UnexpectedError, CreateFazendaOutput>

@Injectable()
export class CreateFazendaUseCase {
  constructor(
    private readonly fazendas: FazendaRepository,
    private readonly registrarAuditoria: RegistrarAuditoriaUseCase,
  ) {}

  async execute(input: CreateFazendaInput): Promise<CreateFazendaResult> {
    try {
      const fazenda = Fazenda.create({
        tenantId: input.tenantId,
        empresaId: input.empresaId,
        nome: input.nome,
        enderecoLogradouro: input.enderecoLogradouro ?? null,
        enderecoNumero: input.enderecoNumero ?? null,
        enderecoBairro: input.enderecoBairro ?? null,
        enderecoCep: input.enderecoCep ?? null,
        municipio: input.municipio ?? null,
        uf: input.uf ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        car: input.car ?? null,
        nirfIncra: input.nirfIncra ?? null,
        areaTotalHa: input.areaTotalHa ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.fazendas.create(fazenda)

      await this.registrarAuditoria.execute({
        tenantId: input.tenantId,
        entidade: 'fazenda',
        entidadeId: fazenda.id.toString(),
        acao: 'criar',
        dadosDepois: { nome: fazenda.nome },
      })

      return right({ fazenda })
    } catch (err) {
      console.error('[CreateFazendaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
