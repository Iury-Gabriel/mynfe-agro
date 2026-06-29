import { createHash, randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import type {
  FiscalCancelarResult,
  FiscalConsultarResult,
  FiscalEmitirInput,
  FiscalEmitirResult,
} from '@/domain/application/ports/fiscal-provider'

import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'
import { EnvService } from '@/infra/env/env.service'

function gerarChaveAcesso(seed: string): string {
  const digest = createHash('sha256').update(seed).digest('hex')
  const digits = digest.replace(/\D/g, '')
  return (digits + '0'.repeat(44)).slice(0, 44)
}

@Injectable()
export class PlugNotasFiscalProvider extends FiscalProvider {
  constructor(private readonly env: EnvService) {
    super()
  }

  private get habilitado(): boolean {
    return this.env.get('PLUGNOTAS_ENABLED') && Boolean(this.env.get('PLUGNOTAS_API_KEY'))
  }

  async emitir(input: FiscalEmitirInput): Promise<FiscalEmitirResult> {
    if (this.habilitado) {
      return this.emitirReal(input)
    }
    return this.emitirSimulado(input)
  }

  async cancelar(plugnotasId: string): Promise<FiscalCancelarResult> {
    if (this.habilitado) {
      return this.cancelarReal(plugnotasId)
    }
    return { status: 'cancelada', mensagemRetorno: 'Cancelamento simulado (homologação).' }
  }

  async consultar(plugnotasId: string): Promise<FiscalConsultarResult> {
    if (this.habilitado) {
      return this.consultarReal(plugnotasId)
    }
    return {
      status: 'autorizada',
      plugnotasId,
      chaveAcesso: gerarChaveAcesso(plugnotasId),
      protocolo: createHash('sha256').update(plugnotasId).digest('hex').slice(0, 15),
      mensagemRetorno: 'Consulta simulada (homologação).',
    }
  }

  private emitirSimulado(input: FiscalEmitirInput): FiscalEmitirResult {
    const seed = `${input.notaFiscalId}:${input.numero}:${input.serie ?? ''}`
    const plugnotasId = randomUUID()
    const chaveAcesso = gerarChaveAcesso(seed)
    return {
      status: 'autorizada',
      chaveAcesso,
      protocolo: createHash('sha256').update(seed).digest('hex').slice(0, 15),
      plugnotasId,
      xmlUrl: `https://homologacao.local/nfe/${chaveAcesso}.xml`,
      danfeUrl: `https://homologacao.local/nfe/${chaveAcesso}.pdf`,
      mensagemRetorno: 'Autorizada em ambiente de homologação (simulação).',
    }
  }

  private async emitirReal(input: FiscalEmitirInput): Promise<FiscalEmitirResult> {
    const res = await this.request('POST', '/nfe', {
      idIntegracao: input.notaFiscalId,
      ambiente: input.ambiente,
      emitenteId: input.empresaEmitenteId,
      destinatarioId: input.clienteId,
      numero: input.numero,
      serie: input.serie,
      modelo: input.modelo,
      naturezaOperacao: input.naturezaOperacao,
      valorTotal: input.valorTotal,
      itens: input.itens,
    })

    return {
      status: this.mapEmitirStatus(asString(res.status)),
      chaveAcesso: asNullableString(res.chaveAcesso),
      protocolo: asNullableString(res.protocolo),
      plugnotasId: asNullableString(res.id),
      xmlUrl: asNullableString(res.xmlUrl),
      danfeUrl: asNullableString(res.danfeUrl),
      mensagemRetorno: asNullableString(res.mensagem),
    }
  }

  private async cancelarReal(plugnotasId: string): Promise<FiscalCancelarResult> {
    const res = await this.request('POST', `/nfe/${plugnotasId}/cancelamento`, {})
    const status = asString(res.status)
    return {
      status: status === 'cancelada' ? 'cancelada' : 'rejeitada',
      mensagemRetorno: asNullableString(res.mensagem),
    }
  }

  private async consultarReal(plugnotasId: string): Promise<FiscalConsultarResult> {
    const res = await this.request('GET', `/nfe/${plugnotasId}`, null)
    return {
      status: this.mapConsultarStatus(asString(res.status)),
      chaveAcesso: asNullableString(res.chaveAcesso),
      protocolo: asNullableString(res.protocolo),
      plugnotasId,
      xmlUrl: asNullableString(res.xmlUrl),
      danfeUrl: asNullableString(res.danfeUrl),
      mensagemRetorno: asNullableString(res.mensagem),
    }
  }

  private mapEmitirStatus(raw: string): FiscalEmitirResult['status'] {
    if (raw === 'autorizada' || raw === 'concluido') return 'autorizada'
    if (raw === 'rejeitada' || raw === 'erro') return 'rejeitada'
    return 'emitindo'
  }

  private mapConsultarStatus(raw: string): FiscalConsultarResult['status'] {
    if (raw === 'autorizada' || raw === 'concluido') return 'autorizada'
    if (raw === 'rejeitada' || raw === 'erro') return 'rejeitada'
    if (raw === 'cancelada') return 'cancelada'
    return 'emitindo'
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body: Record<string, unknown> | null,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.env.get('PLUGNOTAS_TIMEOUT_MS'))
    try {
      const response = await fetch(`${this.env.get('PLUGNOTAS_BASE_URL')}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.env.get('PLUGNOTAS_API_KEY') ?? '',
        },
        body: body === null ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      const json: unknown = await response.json()
      if (json === null || typeof json !== 'object' || Array.isArray(json)) {
        return {}
      }
      return json as Record<string, unknown>
    } finally {
      clearTimeout(timeout)
    }
  }
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}
