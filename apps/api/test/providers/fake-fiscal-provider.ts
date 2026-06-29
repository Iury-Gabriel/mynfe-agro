import type {
  FiscalCancelarResult,
  FiscalConsultarResult,
  FiscalEmitirInput,
  FiscalEmitirResult,
} from '@/domain/application/ports/fiscal-provider'

import { FiscalProvider } from '@/domain/application/ports/fiscal-provider'

export class FakeFiscalProvider extends FiscalProvider {
  emitirResult: FiscalEmitirResult = {
    status: 'autorizada',
    chaveAcesso: '0'.repeat(44),
    protocolo: 'protocolo-1',
    plugnotasId: 'plugnotas-1',
    xmlUrl: 'https://files.example/nfe.xml',
    danfeUrl: 'https://files.example/danfe.pdf',
  }
  cancelarResult: FiscalCancelarResult = { status: 'cancelada' }
  consultarResult: FiscalConsultarResult = {
    status: 'autorizada',
    chaveAcesso: '0'.repeat(44),
    protocolo: 'protocolo-1',
  }
  emitirCalls: FiscalEmitirInput[] = []
  cancelarCalls: string[] = []
  consultarCalls: string[] = []

  async emitir(input: FiscalEmitirInput): Promise<FiscalEmitirResult> {
    this.emitirCalls.push(input)
    return this.emitirResult
  }

  async cancelar(plugnotasId: string): Promise<FiscalCancelarResult> {
    this.cancelarCalls.push(plugnotasId)
    return this.cancelarResult
  }

  async consultar(plugnotasId: string): Promise<FiscalConsultarResult> {
    this.consultarCalls.push(plugnotasId)
    return this.consultarResult
  }
}
